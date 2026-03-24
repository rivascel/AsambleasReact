

const peerConnections = {}; 
const iceCandidateQueue = {}; // Para almacenar candidatos antes de que el PC esté listo
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
  // const pc = {userId, connection: new RTCPeerConnection(configuration)};
  const pc = new RTCPeerConnection(configuration);
  
  // Almacenar la conexión
  peerConnections[userId] = pc;
  iceCandidateQueue[userId] = []; // Inicializar la cola para este peerId
  
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


export function queueCandidate(userId, candidate) {

  if (!iceCandidateQueue[userId]) {
    iceCandidateQueue[userId] = [];
  }

  iceCandidateQueue[userId].push(candidate);

  console.log("📥 ICE en cola para", userId);
}

export async function flushCandidateQueue(userId) {

  const pc = peerConnections[userId];
  const queue = iceCandidateQueue[userId];

  if (!pc || !queue) return;

  console.log("🚀 Procesando cola ICE de", userId);

  for (const candidate of queue) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("Error agregando ICE:", err);
    }
  }
  iceCandidateQueue[userId] = [];
}