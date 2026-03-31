// Import the new functions
import { 
  getAllViewersAndListen,
   listenToRequests,
   setUserIsStreaming
} from "../../src/supabase-client";

import { getPeerConnection, createPeerConnection, closePeerConnection } from "./peer-manager.js";

import { createAndSendOffer } from "./offerManager";

let peerConnections = {};
let localStream=null;
let candidateQueue = [];
let remoteStream;



export async function startBroadcasting(roomId, adminId, localVideoElement) {

  try {
    // await setAdminIsStreaming(roomId, adminId);
    setUserIsStreaming(adminId)
    await startLocalStream(roomId, adminId, localVideoElement /*, pc*/);

    
  } catch (error) {
    console.error("Failed to start broadcast:", error);
  }
}

export function getLocalStream() {
  return localStream;
}
  
export async function startLocalStream(roomId, adminId, localVideoElement) {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoElement.srcObject = localStream;
    
    //Si hay usuarios conectados, crear ofertas para ellos
    await createOfferToViewer(roomId, adminId, localStream);
   
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

export async function joinStreamAsAdmin(roomId, adminId, streamTarget) {
  try {
    if (!streamTarget) {
    console.log('Invalid video element provided');
    return;
  }
    await receivingStream(roomId, adminId, streamTarget);
    
    
  } catch (error) {
    console.error("Viewer failed to join stream:", error);
  }
};

// Admin crea y envía oferta a un viewer
// let pc;
export async function createOfferToViewer(roomId, adminId, localStream) {
  if (!roomId)  {
    throw new Error("roomId es requerido");
  } 
  let unsubscribe;
  let viewerPc;
  let viewerId;
      
  try {
    const {viewers} = await getAllViewersAndListen(roomId, async (newViewerId)=>{
      console.log("Nuevo viewer ", newViewerId);
      viewerId=newViewerId;
      console.log("viewer encontrado para oferta:", viewerId);
        // Aquí podrías enviar una nueva oferta al viewer si es necesario

        await createAndSendOffer({
            roomId:roomId,
            fromPeer:adminId,
            toPeer: viewerId,
            localStream: localStream,
        });
    });

     //Viewers ya conectados
    for (const viewerId of viewers) {
      console.log("viewer encontrado para oferta:", viewerId);

      await createAndSendOffer({
        roomId: roomId,
        fromPeer: adminId,
        toPeer: viewerId,
        localStream: localStream
      });
    };

    return { 
      viewers, 
      unsubscribe: () => supabase.removeChannel(channel), 
    };
  } catch (error) {
    console.error("❌ Error creando ofertas:", error);
    if (unsubscribe) unsubscribe();
    throw error;
  }
}

const approvedViewers = new Set();


export function listenForApprovals(room) {
  return listenToRequests(
    room,
    { componentId: 'VideoGeneral' },
    (request) => {
      if (request?.status === 'approved') {
        approvedViewers.add(request.user_id)
        // console.log("✅ Viewer aprobado:", request.user_id)
      }
    },
  )
};

export async function receivingStream(roomId, adminId, streamTarget) {
  
  if (approvedViewers !== undefined) {
    // cleanupViewerConnection(approvedViewers)
    console.log("Iniciando recepción de stream para viewer aprobado:", approvedViewers);

    const viewerId = [...approvedViewers][0]; // Obtener el primer viewer aprobado 

    try {
      let pc;

      if (!peerConnections[viewerId]) {
        pc = createPeerConnection(roomId,adminId, viewerId);
      console.log("🔌 Viewer PC creada")
      } else {
        pc=getPeerConnection(viewerId);
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
  } else {
    console.log("No hay viewer aprobado para iniciar la conexión.");
    closePeerConnection(approvedViewers);
  }

  // Variables de estado para reconexión
    
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
  
  return () => {
  console.log("🧹 Viewer cleanup manual")
  
  // cleanupViewerConnection()
  }
};

