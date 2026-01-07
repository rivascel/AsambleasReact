// handleIncomingICE.js
import { getPeerConnection, queueCandidate } from '../peers';


export async function handleIncomingICE(fromUser, candidatePayload) {
const pc = getPeerConnection(fromUser);
const parsed = typeof candidatePayload === 'string' ? JSON.parse(candidatePayload) : candidatePayload;


if (!parsed || (!parsed.candidate && parsed.candidate !== '')) return;


const ice = new RTCIceCandidate(parsed);


if (!pc || pc.signalingState === 'stable' || pc.signalingState === 'have-remote-offer') {
// si no hay pc aun o estado no permite agregar, pushearlo a la cola
queueCandidate(fromUser, ice);
return;
}


try {
await pc.addIceCandidate(ice);
} catch (err) {
console.warn('Error addIceCandidate', err);
// si falla, pushearlo
queueCandidate(fromUser, ice);
}
}