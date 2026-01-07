// Import the new functions
import {
  //... other imports
  getActiveAdmin,
  registerViewer, // Import the existing viewer registration function
  sendJoinRequest, // Import the new sender function
  sendSignal,
  listenToSignalsFromAdmin,
  listenToSignals,
  setViewerIsStreaming
 
} from "../../src/supabase-client";

const API_URL = import.meta.env.VITE_BACKEND_URL;


const peerConnections={};
let localStream;
let remoteStream;
let candidateQueue = [];
const appliedAnswers = new Set();

let configuration=null;
// Obtener configuración del servidor

export const getWebRTCConfig = async () => {

    if (configuration) return configuration;

    const response = await fetch(`${API_URL}/api/webrtc-config`, {
      credentials: 'include'
    });
    if (!response.ok){
      const Text = await response.text();
      throw new Error(`Error fetching WebRTC config: ${Text}`);
    }
    configuration = await response.json();
    return configuration;

};

export async function getAdmin(roomId) {
  return await getActiveAdmin(roomId);
};

async function createPeerConnection(viewerId) {
  const config = await getWebRTCConfig();
  const pc = new RTCPeerConnection(config);
  peerConnections[viewerId] = pc;
  return pc;
}

function getPeerConnection(viewerId) {
  return peerConnections[viewerId];
}

function closePeerConnection(viewer) {
  const pc = peerConnections[viewer];
  if (pc) {
    pc.close();
    delete peerConnections[viewer];
    console.log(`✅ PeerConnection de ${viewer} cerrada`);
  }
}


export async function startLocalStream(roomId, email, localVideoElement) {
  setViewerIsStreaming(email);
  try{
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoElement.srcObject = localStream;

    await createOfferToAdmin(roomId, email /*, pc*/);

    return localStream;
  } catch(error){
    console.error("Error al obtener el stream local:", error);
    throw error;
  }
};

export async function stopLocalStream(videoElement) {
  localStream = videoElement?.srcObject;
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    videoElement.srcObject = null;
    console.log("stream detenido correctamente")
  } else {
    console.warn("No hay stream activo en el videoElement");
  }
}  

export async function joinStreamAsViewer(roomId, viewerId, adminId, streamTarget) {
  try {
    if (!streamTarget) {
    console.log('Invalid video element provided');
    return;
  }
    await registerViewer(roomId, viewerId);

    // await sendJoinRequest(roomId, viewerId, adminId);

    await receivingStream(roomId, viewerId, adminId, streamTarget);
    
    
  } catch (error) {
    console.error("Viewer failed to join stream:", error);
  }
};


//==============================================================

// Viewer crea y envía oferta a Admin
let adminPc;
export async function createOfferToAdmin(roomId, viewerId /*, pc*/) {

  try {
    const adminId = await getActiveAdmin(roomId);
    console.log("admin desde cliente", adminId);

    adminPc = getPeerConnection(adminId);
    if (!adminPc) {
      adminPc = createPeerConnection(adminId);
    } 

    if (localStream && localStream.getTracks().length > 0) {
      localStream.getTracks().forEach((track) => adminPc.addTrack(track, localStream));
       console.log("🎥 Tracks añadidos al PeerConnection:", localStream.getTracks().map(t => t.kind));
    } else {
      console.warn("⚠️ No se encontraron tracks locales — no se generarán ICE candidates");
    }

    console.log("🔍 Estado de peerConnections para viewer:", Object.keys(peerConnections));

    // Array para recolectar ICE candidates
    const iceCandidates = [];
    // let iceGatheringResolve;

   // 4️⃣ Registrar handlers ANTES de crear la oferta
    const iceGatheringPromise = new Promise((resolve) => {
      adminPc.onicegatheringstatechange = () => {
        console.log(`🔄 Estado ICE gathering: ${adminPc.iceGatheringState}`);
        if (adminPc.iceGatheringState === "complete") {
          console.log("✅ Recolección de ICE candidates completada.");
          resolve();
        }
      };
    });

    // Manejar ICE candidates - envio al admin
    adminPc.onicecandidate = async (event) => {
      if (event.candidate) {
        iceCandidates.push(event.candidate);
        // Enviar a cada viewer individualmente

        //registra candidates en tabla webrtc_signaling
          try {
            await sendSignal({
            room_id: roomId, 
            from_user: viewerId,
            to_user: adminId,
            type: "ice-candidate",
            payload: {
              candidate: event.candidate.candidate,        // ← Esto es crucial
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid
            },
            });
            console.log(`❄️ ICE candidate ENVIADO a ${adminId}`);
    
          } catch (error) {
              console.error(`⚠️ Error enviando ICE candidate:`, error);
          }
      } else {  
              console.log("🧊 Fin de generación de ICE candidates.");
      };
    };

    // Crear y enviar oferta
    console.log("🎬 Creando oferta...");
    const offer = await adminPc.createOffer();
    await adminPc.setLocalDescription(offer);

    console.log("📨 Enviando oferta a admin:", adminId);
    await sendSignal({
      room_id: roomId,
      from_user: viewerId,
      to_user: adminId,
      type: "offer",
      payload: offer
    });

    console.log("⏳ Esperando generación de ICE candidates...");
    await Promise.race([
      iceGatheringPromise,
      new Promise((resolve) => setTimeout(resolve, 3000)), // 3 segundos máximo
    ]);

    // console.log("📦 ICE candidates finales recolectados:", iceCandidates);
  
    return { adminId, iceCandidates };

  } catch (error) {
    console.error("💥 Error en createOfferToAdmin:", error);
    if (adminPc) adminPc.close();
    throw error;
    }
}

// Escucha las answers a la offer que creó el admin al viewer
export async function listenForAnswers(viewerId) {
  //Viene del video_owner.jsx con el usuario adminId
  // const subscription = 
  const channel = listenToSignals(viewerId, async ( signal ) => { 
    const adminId = signal.from_user;

    // let pc;
    const pc = getPeerConnection(adminId);
        if (!pc) pc=createPeerConnection(adminId);
        // const pc = peerConnections[viewerId];
        console.log(`📨 Señal enviada a ${viewerId}:`, signal);

    if (!pc) {
      console.warn(`No se encontró conexión para viewer ${viewerId}`);
      return;
    }

    if (signal.type === "answer") {

      await handleAnswer(signal.from_user, signal.payload);

      console.log("Estado actual de señalización:", pc.signalingState);

      console.log("📦 Payload recibido del answer:");

      const answer = typeof signal.payload === "string" ? JSON.parse(signal.payload) : signal.payload;

      // Verificar el estado de señalización
      console.log("Estado actual de señalización:", pc.signalingState);
      
      if (pc.signalingState === "have-local-offer") {
          try{
            await pc.setRemoteDescription(answer);
            console.log(`✅ Answer aplicado para ${viewerId}`);
          } catch (error) { 
             if (error.toString().includes('ufrag')) {
                console.warn('Skipping queued candidate with ufrag mismatch');
              } 
              // else {
              //   errors.push(error);
              // }
          };

      } else {
        console.warn(`⚠️ Estado inesperado: ${pc.signalingState} para ${viewerId}`);
      }
      
      try {
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
      console.error(`❌ Error al aplicar la respuesta de ${adminId}:`, error);
      }
    } else if (signal.type === "ice-candidate") {
      try {
        const parsed = typeof signal.payload === "string" ? JSON.parse(signal.payload) : signal.payload;
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
        console.error(`Error agregando ICE candidate de ${adminId}:`, error);
      }
    }

    async function handleAnswer(viewerId, answer) {
      const key = `${viewerId}:${answer.sdp}`;
      // Evitar procesar el mismo answer dos veces
      if (appliedAnswers.has(key)) {
        console.log("⏩ Answer duplicado ignorado:", viewerId);
        return;
      }
      appliedAnswers.add(key);

    }

    return channel;
  });
  // return subscription;
};

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
};

//====== espectador recibe transmision del admin ======
export async function receivingStream(roomId, viewerId, adminId, streamTarget) {

   // Variables de estado para reconexión

  // ============================================================
  // 🧹 UTILIDADES
  // ============================================================
  
  function cleanupViewerConnection() {
    const pc = peerConnections[adminId]

    if (pc) {
      pc.ontrack = null
      pc.onicecandidate = null
      pc.onconnectionstatechange = null
      pc.close()
      delete peerConnections[adminId]
    }

    if (streamTarget?.srcObject) {
      streamTarget.srcObject.getTracks().forEach(t => t.stop())
      streamTarget.srcObject = null
    }

    console.log("🧹 Viewer PC destruida")
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

  function createViewerPC() {
    const pc = createPeerConnection(adminId)
    peerConnections[adminId] = pc

    const remoteStream = createRemoteStream();  

    pc.addTransceiver('video', { direction: 'recvonly' })
    pc.addTransceiver('audio', { direction: 'recvonly' })

    pc.onconnectionstatechange = () => {
      console.log("🔌 PC state:", pc.connectionState)
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupViewerConnection()
      }
    }

    pc.ontrack = ({ track }) => {
      console.log("🎥 Track recibido:", track.kind)

      if (!remoteStream.getTracks().some(t => t.id === track.id)) {
        remoteStream.addTrack(track)
      }

      track.onended = () => {
        console.log("⏹️ Track terminó → reset PC")
        cleanupViewerConnection()
      }
    }

    pc.onicecandidate = async ({ candidate }) => {
      if (!candidate) return

      try {
        await sendSignal({
          room_id: roomId,
          from_user: viewerId,
          to_user: adminId,
          type: "ice-candidate",
          payload: {
            candidate: candidate.candidate,
            sdpMLineIndex: candidate.sdpMLineIndex,
            sdpMid: candidate.sdpMid
          }
        })
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
    cleanupViewerConnection()

    const pc = createViewerPC()

    const parsedOffer =
      typeof offer === "string" ? JSON.parse(offer) : offer

    await pc.setRemoteDescription(new RTCSessionDescription(parsedOffer))

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    await sendSignal({
      room_id,
      from_user: viewerId,
      to_user: fromUser,
      type: "answer",
      payload: answer
    })

    console.log("📤 Answer enviado")
  }

  async function handleIceCandidate(payload) {
    // const pc = peerConnections[adminId]
    const pc = getPeerConnection(adminId);
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

// ============================================================
  // 👂 LISTENER DE SEÑALES
  // ============================================================

  const unsubscribe = listenToSignalsFromAdmin(
    viewerId,
    async ({ type, payload, from_user, room_id }) => {
      try {
        if (type === "offer") {
          await handleOffer(payload, from_user, room_id)
        }

        if (type === "ice-candidate") {
          await handleIceCandidate(payload)
        }
      } catch (err) {
        console.error("❌ Signal handler error:", err)
      }
    }
  )

  // ============================================================
  // 🧹 CLEANUP FINAL
  // ============================================================

  return () => {
    console.log("🧹 Viewer cleanup manual")
    unsubscribe()
    cleanupViewerConnection()
  }
};


