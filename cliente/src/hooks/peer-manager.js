const peerConnections = {};

export const createPeerConnection = (userId) => {
  const configuration = { iceServers: 
    [{ urls:  ['stun:stun1.l.google.com:19302', 
              'stun:stun2.l.google.com:19302'],
      },
      {
        urls: "turns:standard.relay.metered.ca:443?transport=tcp",
        username: "6e91ed4ca990de235a21a66f",
        credential: "mqzh0ARtqA3rjU6e",
      },
      ],
      iceCandidatePoolSize: 10
      };
  const pc = new RTCPeerConnection(configuration);
  
  // Almacenar la conexión
  peerConnections[userId] = pc;
  
  return pc;
};

export const getPeerConnection = (userId) => {
  return peerConnections[userId] || null;
};

export const closePeerConnection = (userId) => {
  const pc = peerConnections[userId];
  if (pc) {
    pc.close();
    delete peerConnections[userId];
  }
};

export const closeAllPeerConnections = () => {
  Object.keys(peerConnections).forEach(userId => {
    closePeerConnection(userId);
  });
};