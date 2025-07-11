// Import the new functions
import {
  //... other imports
  getActiveAdmin,
  registerViewer, // Import the existing viewer registration function
  sendJoinRequest // Import the new sender function
} from "../../src/supabase-client";

let peerConnection;
let localStream;
let remoteStream;

// Obtener configuración del servidor
const response = await fetch('https://localhost:3000/api/webrtc-config');
const configuration = await response.json();

/**
 * VIEWER: Joins the room and requests the video stream.
 */

export async function getAdmin(roomId) {
    return await getActiveAdmin(roomId);
};

export async function joinStreamAsViewer(viewerId, roomId, adminId, remoteVideoElement) {
  try {
    // 1. Set up all listeners for offers, answers, and ICE candidates from the admin
    // The existing registerViewer function is perfect for this.

    await registerViewer(viewerId, roomId);

    // 2. Announce presence to the admin to trigger the offer
    await sendJoinRequest(viewerId, roomId, adminId);
    
  } catch (error) {
    console.error("Viewer failed to join stream:", error);
  }
}

export function startLocalStream(videoElement) {
  localStream = navigator.mediaDevices.getUserMedia({ video: true, audio: true });

  videoElement.srcObject = localStream;
  return localStream;
}

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



export function closeConnection() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }
}

