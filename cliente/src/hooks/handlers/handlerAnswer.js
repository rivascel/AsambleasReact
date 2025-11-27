// handleAnswer.js
import { getPeerConnection, flushCandidateQueue } from '../peers';


export async function handleAnswer(viewerId, desc) {
const pc = getPeerConnection(viewerId);
if (!pc) return console.warn('No PC para', viewerId);


const parsed = typeof desc === 'string' ? JSON.parse(desc) : desc;
await pc.setRemoteDescription(new RTCSessionDescription(parsed));


// aplicar candidatos en cola
const queued = flushCandidateQueue(viewerId);
for (const c of queued) {
try { await pc.addIceCandidate(c); } catch(e){ console.warn('Error aplicando candidato en cola', e); }
}
}