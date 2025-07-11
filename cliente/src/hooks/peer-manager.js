const peerConnections = {};

export const createPeerConnection = (adminId, viewerId, localStream) => {
  const configuration = { iceServers: [{ urls:  ['stun:stun1.l.google.com:19302', 
                                                  'stun:stun2.l.google.com:19302']}]};
  const pc = new RTCPeerConnection(configuration);
  
  // Almacenar la conexión
  peerConnections[viewerId] = pc;
  
  // Añadir tracks locales
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  
  // Configurar ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendIceCandidate(adminId, viewerId, event.candidate);
    }
  };
  
  return pc;
};

export const getPeerConnection = (viewerId) => {
  return peerConnections[viewerId] || null;
};

export const closePeerConnection = (viewerId) => {
  const pc = peerConnections[viewerId];
  if (pc) {
    pc.close();
    delete peerConnections[viewerId];
  }
};

export const closeAllPeerConnections = () => {
  Object.keys(peerConnections).forEach(viewerId => {
    closePeerConnection(viewerId);
  });
};