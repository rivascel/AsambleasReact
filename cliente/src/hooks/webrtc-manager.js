// Import the new functions
import { 
  registerAdminIsActive,
  getAllViewersAndListen,
  listenToSignals,
  sendSignal
} from "../../src/supabase-client";

let peerConnections = {};
let localStream;


// Obtener configuración del servidor
const response = await fetch('https://localhost:3000/api/webrtc-config');
/**
 * ADMIN: Starts the broadcast.
 * This function gets the local stream and listens for viewers.
 */
export async function startBroadcasting(roomId, adminId, localVideoElement) {
  const configuration = await response.json();
  const pc = new RTCPeerConnection(configuration);

  try {
    console.log(`Pasando Administrador ${adminId},  sala ${roomId}..., video ${localVideoElement}`);
    await registerAdminIsActive(roomId, adminId );
    // 1. Start the admin's local video stream
    await startLocalStream(roomId, adminId, localVideoElement, pc);
   
    console.log(`Admin ${adminId} is broadcasting in room ${roomId}. Waiting for viewers...`);
  } catch (error) {
    console.error("Failed to start broadcast:", error);
  }
}

export async function startLocalStream(roomId, adminId, localVideoElement, pc) {
  try {
    
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoElement.srcObject = localStream;
    
    // Agregar tracks del local stream
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    await createOfferToViewer (roomId, adminId, pc);

    return localStream;
  } catch (error) {
    console.error("Error al obtener el stream local:", error);
    throw error;
  }
}

export async function stopLocalStream(adminId, localVideoElement) {
  // await deleteAdmin(adminId);
  localStream = localVideoElement?.srcObject;
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localVideoElement.srcObject = null;
    console.log("stream detenido correctamente")
  } else {
    console.warn("No hay stream activo en el videoElement");
  }
}

// Admin crea y envía oferta a un viewer
export async function createOfferToViewer(roomId, adminId, pc) {

  if (!adminId)  {
    throw new Error("adminId y roomId es requerido");
  }
  if (!roomId)  {
    throw new Error("roomId es requerido");
}

  let unsubscribe;

      
  try {
    const {viewers, unsubscribe:unsub} = await getAllViewersAndListen(roomId, async (newViewerId)=>{
      console.log("Nuevo viewer ", newViewerId);
        // Aquí podrías enviar una nueva oferta al viewer si es necesario
      
    });
    unsubscribe = unsub;

    peerConnections[viewers] = pc;

    // Manejar ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        // Enviar a cada viewer individualmente
        for (const viewerId of viewers) {

        //registra candidates en tabla webrtc_signaling
          try {
            await sendSignal({
            room_id: roomId,
            from_user: adminId,
            to_user: viewerId,
            type: "ice-candidate",
            payload: event.candidate,
            });
    
          } catch (error) {
              console.error(`Error enviando ICE candidate a ${viewerId}:`, error);
          }
        }
      }
    };


    // Crear y enviar oferta
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Registra oferta en webrtc_signaling
    // Enviar a cada viewer
    for (const viewerId of viewers) {
      try {
      await sendSignal({
      room_id: roomId,
      from_user: adminId,
      to_user: viewerId,
      type: "offer",
      payload: offer
    });
     console.log(`Oferta enviada a viewer ${viewerId}`);
      } catch (error) {
        console.error(`Error enviando oferta a ${viewerId}:`, error);
      }
    }
    return { pc, unsubscribe };
  } catch (error) {
    if (unsubscribe) unsubscribe();
    pc.close();
    console.error("Error al crear oferta:", error);
    throw error;
  }
}

// Escucha las answers a la offer que creó el admin
export async function listenForAnswers(adminId) {

  listenToSignals(adminId, async ({ from_user, type, payload }) => {
    if (type === "answer") {
      const pc = peerConnections[from_user];
      await pc.setRemoteDescription(new RTCSessionDescription(payload));
    } else {
      console.log("No hay answer de usuarios");
    }

    if (type === "ice-candidate") {
      const pc = peerConnections[from_user];
      await pc.addIceCandidate(new RTCIceCandidate(payload));
    }
  });
};


