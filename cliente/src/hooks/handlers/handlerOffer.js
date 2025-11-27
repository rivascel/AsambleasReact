// handleOffer.js
import { getPeerConnection, createPeerConnection, flushCandidateQueue, queueCandidate } from '../peer-manager';
import { sendSignal } from '../signals';


export async function handleOffer(fromUser, sdp) {
// Este archivo corre en el viewer (recibe offer del admin) o en quien reciba oferta
let pc = getPeerConnection(fromUser);
if (!pc) {
pc = createPeerConnection(fromUser);
}


const desc = typeof sdp === 'string' ? JSON.parse(sdp) : sdp;
await pc.setRemoteDescription(new RTCSessionDescription(desc));


// crear answer
const answer = await pc.createAnswer();
await pc.setLocalDescription(answer);


// enviar answer de vuelta al admin
sendSignal(fromUser, /* fromUserAquí sería el receptor */ pc.localIdentity || 'viewer', 'answer', pc.localDescription);


// flush queued candidates
const queued = flushCandidateQueue(fromUser);
for (const c of queued) {
try { await pc.addIceCandidate(c); } catch(e){ console.warn('Error flush candidate', e); }
}
}