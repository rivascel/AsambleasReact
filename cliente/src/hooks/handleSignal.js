import { getPeerConnection, createPeerConnection, flushCandidateQueue, queueCandidate } from './peer-manager';
import { sendSignal } from '../supabase-client';

const candidateQueue = new Map(); // mapa global de colas por peerId

//recibe la señal si es oferta, respuesta o candidato y la maneja según el tipo
export async function handleSignal(signal, role) {
  const { type, from_user, to_user, room_id, payload } = signal;

  switch(type) {
      case 'offer':
          await handleOffer(room_id, from_user, to_user, payload);
      break;

      case 'answer':
          await handleAnswer(room_id, from_user, to_user, payload);
      break;

      case 'ice-candidate':
          await handleIncomingICE(room_id, from_user, to_user, payload);
      break;

      default:
      console.warn('Signal desconocida', type);
  }
  };
  //funcion que recibe la oferta y envia la respuesta
export async function handleOffer(room_id, from_user, to_user, payload ) {
  // Este archivo corre en el viewer (recibe offer del admin) o en quien reciba oferta
  let pc = getPeerConnection(from_user);
  if (!pc) {
    pc = createPeerConnection(from_user);
  }

  const desc = typeof payload === 'string' ? JSON.parse(payload) : payload;
  await pc.setRemoteDescription(new RTCSessionDescription(desc));

  // crear answer
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  console.log("✅ Offer manejada, answer creada para", from_user, to_user);
  
  await sendSignal({
      room_id: room_id,
      from_user: to_user,
      to_user: from_user,
      type: "answer",
      payload: answer
    })
    console.log("✅ Answer enviada a", from_user);

    await flushCandidateQueue(from_user); // aplicar candidatos en cola

}
//funcion que recibe la respuesta y la aplica candidatos
export async function handleAnswer(room_id, from_user, to_user,payload) {
    const pc = getPeerConnection(from_user);
    if (!pc) return console.warn('No PC para', from_user);

    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    await pc.setRemoteDescription(new RTCSessionDescription(parsed));

    await flushCandidateQueue(from_user); // aplicar candidatos en cola
}


//funcion que recibe el candidato y lo aplica o lo pone en cola si el pc no esta listo
export async function handleIncomingICE(room_id, from_user, to_user, payload) {
  const pc = getPeerConnection(from_user);
  
  // const ice = typeof payload === 'string' ? JSON.parse(payload) : payload;
  // let ice=payload;
  if (typeof payload === "string") {
    try {
      ice = JSON.parse(payload);
      } catch (err) {
        console.warn("ICE payload no es JSON válido:", payload);
        console.error(err);
        return;
      }
    }

  if (!payload || (!payload.candidate && payload.candidate !== '')) return;

  if (!pc || pc.signalingState === 'stable' || !pc.remoteDescription) {
    
      console.warn('PC no listo, candidato en cola para', from_user);
      queueCandidate(from_user, payload);
    
  } 
  else {
    try {
        await pc.addIceCandidate(new RTCIceCandidate(payload));
        console.log("✅ ICE candidate agregado para", from_user);
    } catch (err) {
        console.warn('Error addIceCandidate', err);
        // si falla, pushearlo
        queueCandidate(from_user, payload);
    }
  }
}