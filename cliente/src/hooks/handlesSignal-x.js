import { handleOffer, handleAnswer, handleIncomingICE } from './1-setSignal';

// role: 'admin' | 'viewer'
export async function handleSignal(message, role) {
    const { type, from_user, to_user, payload } = message;
    console.log('handleSignal', type, 'from', from_user, 'to', to_user, 'role', role);

    switch(type) {
        case 'offer':
            if (role === 'viewer') await handleOffer(from_user, payload);
        break;

        case 'answer':
            if (role === 'admin') await handleAnswer(from_user, payload);
        break;

        case 'ice-candidate':
            await handleIncomingICE(from_user, payload);
        break;

        case 'viewer-join':
        // opcional: lógica de UI/estado
        break;

        default:
        console.warn('Signal desconocida', type);
    }
    }