// Import the new functions
import {
  //... other imports
  getActiveAdmin,
  registerViewer, // Import the existing viewer registration function
  sendSignal,
  setUserIsStreaming
 
} from "../../src/supabase-client";


import { getPeerConnection, createPeerConnection, closePeerConnection } from "./peer-manager.js";

import { createAndSendOffer } from "./offerManager";

const API_URL = import.meta.env.VITE_API_URL;


const peerConnections={};
let localStream;
let remoteStream;
let candidateQueue = [];
const appliedAnswers = new Set();

let configuration=null;
// Obtener configuración del servidor

// export const getWebRTCConfig = async () => {

//     if (configuration) return configuration;

//     const response = await fetch(`${API_URL}/api/webrtc-config`, {
//       credentials: 'include'
//     });
//     // console.log("Respuesta de configuración WebRTC:", response);
//     if (!response.ok){
//       const Text = await response.text();
//       throw new Error(`Error fetching WebRTC config: ${Text}`);
//     }
//     configuration = await response.json();
//     return configuration;

// };

export async function getAdmin(roomId) {
  return await getActiveAdmin(roomId);
};

// async function createPeerConnection(user) {
//   const config = await getWebRTCConfig();
//   const pc = new RTCPeerConnection(config);
//   peerConnections[user] = pc;
//   console.log(`✅ PeerConnection creada para ${user}`);
//   return pc;
// }

// function getPeerConnection(viewerId) {
//   return peerConnections[viewerId];
// }

// function closePeerConnection(viewer) {
//   const pc = peerConnections[viewer];
//   if (pc) {
//     pc.close();
//     delete peerConnections[viewer];
//     console.log(`✅ PeerConnection de ${viewer} cerrada`);
//   }
// }


export async function startLocalStream(roomId, email, localVideoElement) {
  // setViewerIsStreaming(email);
  setUserIsStreaming(email)
  try{
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoElement.srcObject = localStream;

    await createOfferToAdmin(roomId, email, localStream);

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

// let adminPc;
export async function createOfferToAdmin(roomId, viewerId,localStream) {

  const adminId = await getActiveAdmin(roomId);
          // console.log("admin desde cliente", adminId);
    createAndSendOffer({
      roomId: roomId,
      fromPeer: viewerId,
      toPeer: adminId,
      localStream 
    });
};

//====== espectador recibe transmision del admin ======
export async function receivingStream(roomId, viewerId, adminId, streamTarget) {


  try {
    let pc;
    if (!peerConnections[adminId]) {
      pc = createPeerConnection(adminId);
    console.log("🔌 Viewer PC creada")
    } else {
      pc=getPeerConnection(adminId);
    };

    const remoteStream = createRemoteStream();  

    pc.addTransceiver('video', { direction: 'recvonly' })
    pc.addTransceiver('audio', { direction: 'recvonly' })

    pc.onconnectionstatechange = () => {
      console.log("🔌 PC state:", pc.connectionState)
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        // cleanupViewerConnection()
      }
    }

    pc.ontrack = ({ track }) => {
      console.log("🎥 Track recibido:", track.kind)

      if (!remoteStream.getTracks().some(t => t.id === track.id)) {
        remoteStream.addTrack(track)
      }

      track.onended = () => {
        console.log("⏹️ Track terminó → reset PC")
        // cleanupViewerConnection()
      }
    };

    return pc

  } catch (error) {
    console.error(error);
  }

  function createRemoteStream() {
    const stream = new MediaStream()
    if (streamTarget) {
      streamTarget.srcObject = stream
    }
    return stream
  }


  function cleanupViewerConnection() {
    const pc = peerConnections[adminId]

    if (pc) {
      pc.ontrack = null
      pc.onicecandidate = null
      pc.onconnectionstatechange = null
      pc.close()
      delete peerConnections[adminId]
       console.log("🧹 Viewer PC destruida")
    }

    if (streamTarget?.srcObject) {
      streamTarget.srcObject.getTracks().forEach(t => t.stop())
      streamTarget.srcObject = null;
      console.log("🧹 Stream remoto detenido y limpiado")
    }
    console.log("✅ Viewer cleanup completo")
   
  }

  return () => {
    console.log("🧹 Viewer cleanup manual")
    
    // cleanupViewerConnection()
  }
};


