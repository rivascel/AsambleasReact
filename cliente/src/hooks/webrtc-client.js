// Import the new functions
import {
  //... other imports
  getActiveAdmin,
  registerViewer, // Import the existing viewer registration function
  sendJoinRequest, // Import the new sender function
  sendSignal,
  listenToSignalsToAdmin
 
} from "../../src/supabase-client";

const peerConnections={};
let localStream;
let remoteStream;
let pc;



// Obtener configuración del servidor
const response = await fetch('https://localhost:3000/api/webrtc-config');
const configuration = await response.json();

/**
 * VIEWER: Joins the room and requests the video stream.
 */

export async function getAdmin(roomId) {
  return await getActiveAdmin(roomId);
};

export async function joinStreamAsViewer(roomId, viewerId, adminId, remoteVideoElement) {
  try {
    // 1. Set up all listeners for offers, answers, and ICE candidates from the admin
    // The existing registerViewer function is perfect for this.

    await registerViewer(roomId, viewerId);

    // 2. Announce presence to the admin to trigger the offer
    // Register the viewer in the database webrtc_signaling table
    await sendJoinRequest(roomId, viewerId, adminId);

    await receivingStream(roomId, viewerId, adminId, streamTarget);
    
  } catch (error) {
    console.error("Viewer failed to join stream:", error);
  }
}

export async function startLocalStream(localVideoEl, remoteVideoEl) {
  try{
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoEl.srcObject = localStream;

    pc = new RTCPeerConnection();
   
    remoteStream = new MediaStream();

    pc.ontrack = (event) => {
      remoteVideoEl.srcObject = event.streams[0];
    };
    return localStream;
  } catch(error){
    console.error("Error al obtener el stream local:", error);
    throw error;
  }
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

export async function receivingStream(roomId, viewerId, adminId, streamTarget){
// if (!videoElement) {
//     console.log('Invalid video element provided');
//     return;
//   }
  remoteStream = new MediaStream();
  
  streamTarget && (streamTarget.srcObject = remoteStream);
  // videoElement?.srcObject =new MediaStream();

  const pc = new RTCPeerConnection(configuration);
  peerConnections[adminId] = pc;

      // 2. Mostrar el video remoto (stream del admin)
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach(track => {
      remoteStream.addTrack(track);
    });
  };

  //   pc.ontrack = (event) => {
  //   streamTarget.srcObject = event.streams[0];
  // };
    
  //Escucha del Admin - from_user
  listenToSignalsToAdmin(adminId, async ({ to_user, from_user, type, payload, room_id }) => {
    const parsedOffer = JSON.parse(payload);
    if (type === "offer") {
      // console.log("Remote offer recibida:", ({ type: parsedOffer.type, sdp: parsedOffer.sdp }));

      await pc.setRemoteDescription(new RTCSessionDescription({ type: parsedOffer.type, sdp: parsedOffer.sdp }));

      const answer = await pc.createAnswer();

      await pc.setLocalDescription(answer);
      // Enviar respuesta al admin

      await sendSignal({
        room_id: room_id,
        from_user: to_user,
        to_user: from_user,
        type: "answer",
        payload: answer,
      });
    };

    // Manejo de ICE
    // Manejar ICE candidates
    if (type === "ice-candidate" && payload) {
      try {
        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            // Enviar a cada viewer individualmente
            //registra candidates en tabla webrtc_signaling
              try {
                await sendSignal({
                room_id: room_id,
                from_user: to_user,
                to_user: from_user,
                type: "ice-candidate",
                payload: event.candidate,
                });
        
              } catch (error) {
                  console.error(`Error enviando ICE candidate a ${viewerId}:`, error);
              }
          }
        };
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    };
  });
};  



// export async function listenForOffersFromAdmin (roomId, viewerId, adminId ) {
//  if (!peerConnections || !peerConnections["admin"]) {
//     console.warn("peerConnections o admin no está inicializado todavía.");
//     return;
//  }

  
// };

//==================================================================
// Viewer maneja oferta entrante
// export const handleOffer = async (offerData, localStream, viewerId) => {
//   const { from_user: adminId, room_id: roomId, payload: offer } = offerData;
  
//   try {
//     const pc = new RTCPeerConnection(configuration);
//     peerConnections[adminId] = pc;

//     // Agregar local stream si es necesario (para comunicación bidireccional)
//     if (localStream) {
//       localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
//     }

//     // Configurar manejo de ICE candidates
//     pc.onicecandidate = async (event) => {
//       if (event.candidate) {
//         await candidateAdmin(roomId, viewerId, adminId, event.candidate);
//       }
//     };

//     // Configurar stream remoto
//     pc.ontrack = (event) => {
//       remoteStream = event.streams[0];
//       const remoteVideo = document.getElementById('remoteRef');
//       if (remoteVideo) remoteVideo.srcObject = remoteStream;
//     };

//     // Procesar oferta y crear respuesta
//     await pc.setRemoteDescription(new RTCSessionDescription(offer));
//     const answer = await pc.createAnswer();
//     await pc.setLocalDescription(answer);
//     await answerToAdmin(roomId, viewerId, adminId, answer);

//     return pc;
//   } catch (error) {
//     console.error("Error al manejar oferta:", error);
//     throw error;
//   }
// };
