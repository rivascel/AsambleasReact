// Import the new functions
import { 
  offerToViewer, 
  candidateViewer, 
  answerToAdmin, 
  candidateAdmin,
  listenForNewViewers,
  registerAdminIsActive,
  deleteAdmin
  // listenForJoinRequests // Import the new listener
} from "../../src/supabase-client";

let peerConnections = {};
let localStream;
let remoteStream;

// Obtener configuración del servidor
const response = await fetch('https://localhost:3000/api/webrtc-config');
const configuration = await response.json();

/**
 * ADMIN: Starts the broadcast.
 * This function gets the local stream and listens for viewers.
 */
export async function startBroadcasting(adminId, roomId, localVideoElement) {
  try {
    console.log(`Pasando Administrador ${adminId},  sala ${roomId}..., video ${localVideoElement}`);
    await registerAdminIsActive(adminId, roomId);
    // 1. Start the admin's local video stream
    await startLocalStream(localVideoElement);
   
    console.log(`Admin ${adminId} is broadcasting in room ${roomId}. Waiting for viewers...`);
  } catch (error) {
    console.error("Failed to start broadcast:", error);
  }
}

export async function startLocalStream(videoElement) {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoElement.srcObject = localStream;
    return localStream;
  } catch (error) {
    console.error("Error al obtener el stream local:", error);
    throw error;
  }
}

export async function stopLocalStream(adminId, videoElement) {
  await deleteAdmin(adminId);
  localStream = videoElement?.srcObject;
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    videoElement.srcObject = null;
    console.log("stream detenido correctamente")
  } else {
    console.warn("No hay stream activo en el videoElement");
  }

}

// Listen for new viewers who send a 'join' request
export function setupAdminListeners(adminId, roomId) {
  // 1. Escuchar nuevos viewers
  const newViewersChannel = listenForNewViewers(roomId, adminId, (viewerId) => {
     console.log(`Configurando listener para room: ${roomId}, admin: ${adminId}`);
    console.log(`Nuevo viewer detectado: ${viewerId}`);
    
    // 2. Crear y enviar oferta al viewer
    createOfferToViewer(roomId, adminId, viewerId);
  });

  // Retornar el canal para poder desuscribirse luego
  return newViewersChannel;
}

// Admin crea y envía oferta a un viewer
export async function createOfferToViewer(roomId, adminId, viewerId) {
  try {
    const pc = new RTCPeerConnection(configuration);
    peerConnections[viewerId] = pc;

    // Agregar tracks del local stream
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    // Manejar ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await candidateViewer(roomId, adminId, viewerId, event.candidate);
      }
    };

    // Crear y enviar oferta
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await offerToViewer(roomId, adminId, viewerId, offer);

    return pc;
  } catch (error) {
    console.error("Error al crear oferta:", error);
    throw error;
  }
}

// Viewer maneja oferta entrante
export const handleOffer = async (offerData, localStream, viewerId) => {
  const { from_user: adminId, room_id: roomId, payload: offer } = offerData;
  
  try {
    const pc = new RTCPeerConnection(configuration);
    peerConnections[adminId] = pc;

    // Agregar local stream si es necesario (para comunicación bidireccional)
    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    // Configurar manejo de ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await candidateAdmin(roomId, viewerId, adminId, event.candidate);
      }
    };

    // Configurar stream remoto
    pc.ontrack = (event) => {
      remoteStream = event.streams[0];
      const remoteVideo = document.getElementById('viewer-video');
      if (remoteVideo) remoteVideo.srcObject = remoteStream;
    };

    // Procesar oferta y crear respuesta
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await answerToAdmin(roomId, viewerId, adminId, answer);

    return pc;
  } catch (error) {
    console.error("Error al manejar oferta:", error);
    throw error;
  }
};

// Admin maneja respuesta del viewer
export const handleAnswer = async ({ from_user: viewerId, payload: answer }) => {
  const pc = peerConnections[viewerId];
  if (pc) {
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error("Error al manejar respuesta:", error);
    }
  }
};

// Manejar ICE candidates
export const handleIceCandidate = async ({ from_user, payload: candidate }) => {
  const pc = peerConnections[from_user];
  if (pc && candidate) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Error al agregar ICE candidate:", error);
    }
  }
};

