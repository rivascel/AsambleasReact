// Import the new functions
import { 
  getActiveAdmin, registerAdminIsActive, getAllViewersAndListen,
  listenToSignals, sendSignal, listenToSignalsFromViewer,
   setAdminIsStreaming,
   listenToRequests
} from "../../src/supabase-client";

import { getPeerConnection, createPeerConnection, closePeerConnection } from "./peer-manager.js";

// import { handleIncomingICECandidate, processCandidateQueue } from "./webrtc-utilities.js";

let peerConnections = {};
let localStream;
let candidateQueue = [];
let remoteStream;

export function getAdmin(roomId) {
    return getActiveAdmin(roomId);
  };

export async function startBroadcasting(roomId, adminId, localVideoElement) {

  try {
    await setAdminIsStreaming(roomId, adminId);
    await startLocalStream(roomId, adminId, localVideoElement /*, pc*/);
    
  } catch (error) {
    console.error("Failed to start broadcast:", error);
  }
}

export async function startLocalStream(roomId, adminId, localVideoElement /*, pc*/) {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoElement.srcObject = localStream;
    
    await createOfferToViewer(roomId, adminId);
   
    return localStream;

  } catch (error) {
    console.error("Error al obtener el stream local:", error);
    throw error;
  }
}

export async function stopLocalStream(localVideoElement) {
  // await deleteAdmin(adminId);
  localStream = localVideoElement?.srcObject;
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localVideoElement.srcObject = null;
    console.log("stream detenido correctamente")
    closePeerConnection(peerConnections[0]);  //<======================
  } else {
    console.warn("No hay stream activo en el videoElement");
  }
};

export async function joinStreamAsAdmin(roomId, adminId, /*viewerId,*/ streamTarget) {
  try {
    if (!streamTarget) {
    console.log('Invalid video element provided');
    return;
  }
    await receivingStream(roomId, adminId, /*viewerId,*/ streamTarget);
    
    
  } catch (error) {
    console.error("Viewer failed to join stream:", error);
  }
};

// Admin crea y envía oferta a un viewer
let pc;
export async function createOfferToViewer(roomId, adminId) {
  if (!roomId)  {
    throw new Error("roomId es requerido");
  } 

  let unsubscribe;
  let viewerPc;
  let viewerId;
      
  try {
    const {viewers, unsubscribe:unsub} = await getAllViewersAndListen(roomId, async (newViewerId)=>{
      console.log("Nuevo viewer ", newViewerId);
      viewerId=newViewerId;
      console.log("viewer encontrado para oferta:", viewerId);
        // Aquí podrías enviar una nueva oferta al viewer si es necesario
    });
    unsubscribe = unsub;

    let tracksAdded = false;

    for (const viewerId of viewers) {
      viewerPc = getPeerConnection(viewerId);
      if (!viewerPc || viewerPc.connectionState === "closed" || viewerPc.signalingState === "closed") {
        viewerPc = createPeerConnection(viewerId);
      } 
      
      if (localStream && !viewerPc._tracksAdded) {
        localStream.getTracks().forEach(track => {
          viewerPc.addTrack(track, localStream);
        });
        viewerPc._tracksAdded = true; // Marcar que ya tiene tracks
        console.log(`🎬 Tracks agregados para viewer ${viewerId}`);


      } else if (!localStream) {
        console.error("❗ localStream no disponible para agregar tracks");
        return;
      }

      // Envio ICE candidates
      viewerPc.onicecandidate =  (event) => {
        if (event.candidate) {
          // Enviar a cada viewer individualmente

          //registra candidates en tabla webrtc_signaling
            try {
              sendSignal({
              room_id: roomId,
              from_user: adminId,
              to_user: viewerId,
              type: "ice-candidate",
              payload: {
                candidate: event.candidate.candidate,        // ← Esto es crucial
                sdpMLineIndex: event.candidate.sdpMLineIndex,
                sdpMid: event.candidate.sdpMid
              },
              });
              console.log(`ICE candidate enviado a viewer ${viewerId}`);
            } catch (error) {
                console.error(`Error enviando ICE candidate a ${viewerId}:`, error);
            }
        }
      };

       // (Opcional) Si quieres depurar
        viewerPc.oniceconnectionstatechange = () => {
          console.log(`🌐 ICE state para ${viewerId}:`, viewerPc.iceConnectionState);
        };

        // Guarda o actualiza el peerConnection
        // savePeerConnection(viewerId, viewerPc);

      // Crear y enviar oferta
      const offer = await viewerPc.createOffer();
      await viewerPc.setLocalDescription(offer);

      // Registra oferta en webrtc_signaling
      // Enviar a cada viewer
      await sendSignal({
        room_id: roomId,
        from_user: adminId,
        to_user: viewerId,
        type: "offer",
        payload: offer
      });

      console.log(`Oferta enviada a viewer ${viewerId}`);
    }

    // return { viewers, unsubscribe };
  } catch (error) {
    // if (unsubscribe) unsubscribe();
    viewerPc.close(); 
    console.error("Error al crear oferta:", error);
    throw error;
    }
}

// Escucha las answers a la offer que creó el viewer al admin
export function listenForAnswers(adminId) {
  //Viene del video_owner.jsx con el usuario adminId
  // const subscription = 
  return listenToSignals(adminId, async ({ from_user, type, payload }) => { 
    const viewerId = from_user;

    pc = getPeerConnection(viewerId);
    if (!pc) 
      pc=createPeerConnection(viewerId);
      peerConnections[viewerId]=pc;
      console.log(`PeerConnection ${peerConnections} obtenida para viewer:`, viewerId);
      console.log(`📨 Señal enviada a ${adminId}:`, type);

    if (!pc) {
      console.warn(`No se encontró conexión para viewer ${viewerId}`);
      return;
    }

    if (type === "answer") {

      console.log("📦 Payload recibido del answer:", payload);

      const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;

      // Verificar el estado de señalización
      console.log("Estado actual de señalización:", pc.signalingState);
      
      if (pc.signalingState !== "have-local-offer") {
          console.warn("Estado incorrecto para answer. Estado actual:", pc.signalingState);
          return;
      }
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(parsed));

        console.log(`Respuesta aplicada desde viewer ${viewerId}`);

        while (candidateQueue.length > 0) {
          const queuedCandidate = candidateQueue.shift();
          try {
              await pc.addIceCandidate(queuedCandidate);
              console.log('✅ Candidato en cola agregado')
          } catch (err) {
            console.error('Error agregando candidato en cola:', err);
          }
        }
      } catch (error) {
      console.error(`❌ Error al aplicar la respuesta de ${viewerId}:`, error);
      }


    } else if (type === "ice-candidate") {
        try {
          const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
          console.log("📦 Payload ICE recibido:", parsed); // Debug detallado

          // Manejo de candidato vacío (end-of-candidates)
          if (parsed.candidate === "") {
            console.log("✅ Fin de candidatos ICE");
            return;
          }

          // Validación estricta
          if (!parsed?.candidate) {
            console.warn("❗ Candidato ICE no válido (falta 'candidate'):", parsed);
            return;
          }

          // console.log("📦 Payload recibido para ICE:", parsed);

          // Validación mejorada del candidato ICE
          if (!parsed || (!parsed.candidate && parsed.candidate !== "")) {
            console.warn("❗ ICE candidate incompleto:", parsed);
            return;
          }

          // Crear y agregar el candidato ICE
          const iceCandidate = new RTCIceCandidate({
            candidate: parsed.candidate || "",
            sdpMid: parsed.sdpMid || null,
            sdpMLineIndex: parsed.sdpMLineIndex !== undefined ? 
              Number(parsed.sdpMLineIndex) : null
          });

          // Usar handleIncomingICECandidate o agregar directamente
          await handleIncomingICECandidate(pc, iceCandidate);

        } catch (error) {
          console.error(`Error agregando ICE candidate de ${viewerId}:`, error);
        }
    }
  });
  // return subscription;
};


//manejo de ICES enviados por Viewer al Admin
export async function handleIncomingICECandidate(pc, candidate) {
  if (!pc.remoteDescription) {
    candidateQueue.push(candidate);
    console.log("🕒 Candidate en cola");
  } else {
    try {
      await pc.addIceCandidate(candidate);
      console.log("✅ Candidate agregado");
    } catch (err) {
      console.error("❌ Error agregando ICE:", err);
    }
  }
}


const approvedViewers = new Set()

export function listenForApprovals(room) {
  return listenToRequests(
    room,
    { componentId: 'VideoGeneral' },
    (request) => {
      if (request?.status === 'approved') {
        approvedViewers.add(request.user_id)
        console.log("✅ Viewer aprobado:", request.user_id)
      }
    },
  
  )
}

export async function receivingStream(roomId, adminId, /*ApprovedViewer,*/ streamTarget) {

  console.log("🔍 Estado de peerConnections:", Object.keys(peerConnections));

  // Variables de estado para reconexión
  
    // ============================================================
    // 🧹 UTILIDADES
    // ============================================================
    
    function cleanupViewerConnection(approvedViewers) {
      const pc = peerConnections[approvedViewers]
  
      if (pc) {
        pc.ontrack = null
        pc.onicecandidate = null
        pc.onconnectionstatechange = null
        pc.close()
        delete peerConnections[approvedViewers]
        console.log("🧹 Viewer PC destruida")
      }
  
      if (streamTarget?.srcObject) {
        streamTarget.srcObject.getTracks().forEach(t => t.stop())
        streamTarget.srcObject = null
        console.log("🧹 Stream remoto detenido y limpiado")
      }
  
      console.log("✅ Viewer cleanup completo")
    }
  
    function createRemoteStream() {
      const stream = new MediaStream()
      if (streamTarget) {
        streamTarget.srcObject = stream
      }
      return stream
    }
  
  
    // ============================================================
    // 🔌 CREACIÓN PC
    // ============================================================
  
    function createViewerPC(approvedViewers) {
      console.log("🔧 Creando Viewer PC... en ",approvedViewers);
      const pc = createPeerConnection(approvedViewers)
      peerConnections[approvedViewers] = pc
      console.log("🔌 Viewer PC creada")
  
      const remoteStream = createRemoteStream();  
  
      pc.addTransceiver('video', { direction: 'recvonly' })
      pc.addTransceiver('audio', { direction: 'recvonly' })
  
      pc.onconnectionstatechange = () => {
        console.log("🔌 PC state:", pc.connectionState)
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          // cleanupViewerConnection(approvedViewers)
        }
      }
  
      pc.ontrack = ({ track }) => {
        console.log("🎥 Track recibido:", track.kind)
  
        if (!remoteStream.getTracks().some(t => t.id === track.id)) {
          remoteStream.addTrack(track)
        }
  
        track.onended = () => {
          console.log("⏹️ Track terminó → reset PC")
          // cleanupViewerConnection(approvedViewers)
        }
      }
  
      pc.onicecandidate = async ({ candidate }) => {
        if (!candidate) return
  
        try {
          await sendSignal({
            room_id: roomId,
            from_user: adminId,
            to_user: approvedViewers,
            type: "ice-candidate",
            payload: {
              candidate: candidate.candidate,
              sdpMLineIndex: candidate.sdpMLineIndex,
              sdpMid: candidate.sdpMid
            }
          })
          console.log("❄️ ICE enviado");
        } catch (err) {
          console.error("❌ Error enviando ICE:", err)
        }
      }
  
      return pc
    }

      // ============================================================
      // 📡 SIGNALING
      // ============================================================
    
    async function handleOffer(offer, fromUser, room_id) {
      console.log("📨 Offer recibida → nueva PC")
  
      // Siempre empezamos LIMPIO
      // cleanupViewerConnection(approvedViewers)
  
      const pc = createViewerPC(approvedViewers)
  
      const parsedOffer =
        typeof offer === "string" ? JSON.parse(offer) : offer
  
      await pc.setRemoteDescription(new RTCSessionDescription(parsedOffer))
  
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
  
      await sendSignal({
        room_id,
        from_user: adminId,
        to_user: fromUser,
        type: "answer",
        payload: answer
      })
  
      console.log("📤 Answer enviado")
    }
  
    async function handleIceCandidate(payload) {
      const pc = peerConnections[approvedViewers]
      if (!pc || !pc.remoteDescription) return
  
      try {
        const parsed =
          typeof payload === "string" ? JSON.parse(payload) : payload
  
        if (!parsed?.candidate) return
  
        await pc.addIceCandidate(new RTCIceCandidate(parsed))
      } catch (err) {
        console.error("❌ ICE error:", err)
      }
    }
  
    // ===============================

  if (approvedViewers !== undefined) {
    cleanupViewerConnection(approvedViewers)
    console.log("Iniciando recepción de stream para viewer aprobado:", approvedViewers);

    createViewerPC(approvedViewers);

    // ✅ PASO 1: Inicializa una cola para los candidatos que lleguen temprano.
    // Track connection state
    // let isSettingRemoteDescription = false;
    // let isCreatingAnswer = false;
    // let candidateQueue = [];

    // ============================================================
      // 👂 LISTENER DE SEÑALES
      // ============================================================
    
      const unsubscribe = listenToSignalsFromViewer(
        adminId, 
        
        async ({ type, payload, from_user, room_id }) => {
          // Solo procesar señales del viewer específico

          // 🔒 SEGURIDAD
          if (!approvedViewers.has(from_user)) {
            console.warn("⛔ Offer ignorada de viewer NO aprobado:", from_user)
            return
          }

          try {
            if (type === "offer") {
              await handleOffer(payload, from_user, room_id)
              console.log("✅ Offer manejada correctamente en admin...")
            }
    
            if (type === "ice-candidate") {
              await handleIceCandidate(payload)
              console.log("✅ ICE candidate manejado en admin ...")
            }
          } catch (err) {
            console.error("❌ Signal handler error:", err)
          }
        }
      )
    

  } else {
    console.log("No hay viewer aprobado para iniciar la conexión.");
    closePeerConnection(approvedViewers);
  }
};

// Helper function to process queued candidates
export async function processCandidateQueue(pc, queue) {
  const processed = [];
  const errors = [];

  for (const candidate of queue) {
    try {
      await pc.addIceCandidate(candidate);
      processed.push(candidate);
      console.log('Processed queued ICE candidate');
    } catch (error) {
      if (error.toString().includes('ufrag')) {
        console.warn('Skipping queued candidate with ufrag mismatch');
      } else {
        errors.push(error);
      }
    }
  }

  // Clear processed candidates
  queue.splice(0, processed.length);

  if (errors.length > 0) {
    console.error('Errors processing some candidates:', errors);
  }
}