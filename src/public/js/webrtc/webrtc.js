// webrtc.js
let peerConnection = null;
let remoteStream = null;

const configuration = {
    iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
    ],
    iceCandidatePoolSize: 10,
};


export function createPeerConnection(onIceCandidate) {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.addEventListener('icecandidate', event => {
        if (event.candidate && typeof onIceCandidate === 'function') {
            onIceCandidate(event.candidate);
        }
    });

    remoteStream = new MediaStream();

    peerConnection.addEventListener('track', event => {
        remoteStream.addTrack(event.track);
    });

    return peerConnection;
}

export function addLocalTracks(stream) {
    if (!peerConnection || !stream) return;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
}

export function getPeerConnection() {
    return peerConnection;
}

export function getRemoteStream() {
    return remoteStream;
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
