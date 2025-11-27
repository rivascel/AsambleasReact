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

const peerConnections={};
let localStream;
let remoteStream;
let candidateQueue = [];
const appliedAnswers = new Set();

let configuration;
// Obtener configuración del servidor
(async () => {
  const response = await fetch('https://localhost:3000/api/webrtc-config');
  configuration = await response.json();
})();

export async function getAdmin(roomId) {
  return await getActiveAdmin(roomId);
};

function createPeerConnection(viewerId) {
  const pc = new RTCPeerConnection(configuration);
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

    // Agregar tracks del local stream
    // localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
   
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

    await sendJoinRequest(roomId, viewerId, adminId);

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
      // En caso de que quieras forzar el inicio de ICE aunque no haya medios:
      // adminPc.createDataChannel("dummy");
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
    const pcAdmin = peerConnections[adminId];

    if (!pcAdmin) {
      console.warn(`No se encontró conexión para viewer ${viewerId}`);
      return;
    }

    if (signal.type === "answer") {
      await handleAnswer(signal.from_user, signal.payload);

      console.log("Estado actual de señalización:", pcAdmin.signalingState);

      console.log("📦 Payload recibido del answer:");

      const answer = typeof signal.payload === "string" ? JSON.parse(signal.payload) : signal.payload;

      // Verificar el estado de señalización
      console.log("Estado actual de señalización:", pcAdmin.signalingState);
      
      if (pcAdmin.signalingState === "have-local-offer") {
          try{
            await pcAdmin.setRemoteDescription(answer);
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
        console.warn(`⚠️ Estado inesperado: ${pcAdmin.signalingState} para ${viewerId}`);
      }
      
      try {
        while (candidateQueue.length > 0) {
          const queuedCandidate = candidateQueue.shift();
          try {
              await pcAdmin.addIceCandidate(queuedCandidate);
              console.log('✅ Candidato en cola agregado')
          } catch (err) {
            console.error('Error agregando candidato en cola:', err);
          }
        }
      } catch (error) {
      console.error(`❌ Error al aplicar la respuesta de ${adminId}:`, error);
      }
    } 
    if (signal.type === "ice-candidate") {
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
        await handleIncomingICECandidate(pcAdmin, iceCandidate);


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

export async function receivingStream(roomId, viewerId, adminId, streamTarget) {
  
  if (peerConnections[adminId]) {
    peerConnections[adminId].close();
    delete peerConnections[adminId];
  };

  let pcAdmin = getPeerConnection(adminId);
  if (!pcAdmin) {
    pcAdmin = createPeerConnection(adminId);
  }
  remoteStream = new MediaStream();

   // Prepara la conexión para recibir audio y video.
  pcAdmin.addTransceiver('video', { direction: 'sendrecv' });
  pcAdmin.addTransceiver('audio', { direction: 'sendrecv' });

  console.log("Viewer transceivers:", pcAdmin.getTransceivers().length);

    // 2. Mostrar el video remoto (stream del admin)
  pcAdmin.ontrack = (event) => {
    console.log("🎥 Track recibido:", event.track.kind);

    event.streams[0].getTracks().forEach(track => {
      const exists = remoteStream.getTracks().some((t) => t.id === track.id);
      if (!exists) {
        remoteStream.addTrack(track);
      }
    });
      
  // ✅ Asignar el stream al video solo si no se ha hecho antes
    if (streamTarget && !streamTarget.srcObject) {
      streamTarget.srcObject = remoteStream;
      console.log("📺 Stream remoto asignado (solo una vez)");
    } else {
      console.log("ℹ️ Stream ya estaba asignado, no se reasigna");
    }

    console.log("🎬 Tracks actuales en remoteStream:", remoteStream.getTracks().length);
  };

    // Manejar ICE candidates
  pcAdmin.onicecandidate = async (event) => {
    if (event.candidate) {
      // Enviar a cada viewer individualmente
        try {
            await sendSignal({
            room_id: roomId,  
            from_user: viewerId,  //De mi (viewer)
            to_user: adminId,     //Para el admin 
            type: "ice-candidate",
            payload: {
              candidate: event.candidate.candidate,        // ← Esto es crucial
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid
            },
            
          });
          console.log(`❄️ ICE candidate ENVIADO a ${adminId}`);
        } catch (error) {
            console.error(`Error enviando ICE candidate `, error);
        }
    }
  };

  // ✅ PASO 1: Inicializa una cola para los candidatos que lleguen temprano.
  // Track connection state
  let isSettingRemoteDescription = false;
  let isCreatingAnswer = false;
  let candidateQueue = [];

  //Escucha del Viewer - to_user
  listenToSignalsFromAdmin(viewerId, async ({ to_user, from_user, type, payload, room_id }) => {
    try {
      if (type === "offer") {
        if (isSettingRemoteDescription || isCreatingAnswer || pcAdmin.signalingState !== "stable") {
          console.warn('Ya se está procesando una oferta o no estamos en estado estable');
          return;
        }

        isSettingRemoteDescription = true;
        
        let offer;
        if (typeof payload === 'string') {
          try {
            offer = JSON.parse(payload);
          } catch (e) {
            console.error('Error parsing offer payload:', e);
            return;
          }
        } else {
          offer = payload;
        }

        if (pcAdmin.connectionState === "closed") {
          console.warn("⚠️ Intentando usar una peer connection cerrada.");
          return;
        }
        await pcAdmin.setRemoteDescription(new RTCSessionDescription(offer));

        console.log("Remote description set");

        // 2. Process queued candidates (with ufrag validation)
        await processCandidateQueue(pcAdmin, candidateQueue);

        // 3. Create and send answer
        isCreatingAnswer = true;

        const answer = await pcAdmin.createAnswer();
        console.log("Answer created:", answer.type);

        await pcAdmin.setLocalDescription(answer);
        console.log("Local description set");

        pcAdmin.onconnectionstatechange = () => {
          console.log("📡 Conexión state:", pcAdmin.connectionState);
          if (pcAdmin.connectionState === "disconnected" || pcAdmin.connectionState === "failed" || pcAdmin.connectionState === "closed") {
            console.warn("❌ Conexión cerrada, liberando recursos");
            pcAdmin.close();
            delete peerConnections[adminId];
          }
        };

        // Enviar respuesta al admin

        await sendSignal({
          room_id: room_id,
          from_user: to_user,  //o viewer
          to_user: from_user,   // o adminId
          type: "answer",
          payload: answer,
        });
        console.log("Answer sent to admin");

      } else if (type === "ice-candidate" && payload) {

        try {
            const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;

            // console.log("📦 Payload recibido para ICE:", parsed);

            // Validar que tenga las claves necesarias
            if (!parsed.candidate) {
              console.log("ICE end-of-candidates recibido");
              return;
            }

            if (
              !parsed.sdpMid ||
              parsed.sdpMLineIndex === undefined
            ) {
              console.warn("❗ ICE candidate incompleto:", parsed);
              return;
            }

            // Asegurar que sdpMLineIndex sea número (por si viene como string)
            parsed.sdpMLineIndex = Number(parsed.sdpMLineIndex);
            const candidate = new RTCIceCandidate(parsed);

            if (!pcAdmin || pcAdmin.connectionState === "closed") {
              console.warn("⚠️ Peer connection cerrada o no existe");
              return;
            }

            if (pcAdmin.remoteDescription) {
              await pcAdmin.addIceCandidate(candidate);
              console.log("✅ ICE candidate agregado");
            } else {
              candidateQueue.push(candidate);
              console.log("🕒 ICE candidate en cola (sin remoteDescription)");
            }

        } catch (error) {
          console.error("❌ Error procesando ICE:", error);
        }
      }

          // Return cleanup function
      return () => {
      unsubscribe();

      if (pcAdmin) {
        pcAdmin.close();
        pcAdmin = null;

      }
      remoteStream.getTracks().forEach(track => track.stop());
      }

    } 
    catch (error) {
      console.error('Error in signal handler:', error);
      // Reset flags on error
      isSettingRemoteDescription = false;
      isCreatingAnswer = false;
    } 
    finally {
          isSettingRemoteDescription = false;
          isCreatingAnswer = false;
    }
  });
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
}

// Helper function to process queued candidates
export async function processCandidateQueue(pcAdmin, queue) {
  const processed = [];
  const errors = [];

  for (const candidate of queue) {
    try {
      await pcAdmin.addIceCandidate(candidate);
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


      