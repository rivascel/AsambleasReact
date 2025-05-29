const socket12=io();

const { createRoom, requestToJoinRoom, approveUser, listenForApproval, getPendingRequest, deleteCandidate } = require('./supabase.js');
const { openUserMedia, hangUp } = require('./media.js');
const { createPeerConnection, getPeerConnection, addLocalTracks, closeConnection } = require('./webrtc.js');
const { setupUI, setRoomText, toggleButtonStates, showAlert, enableCameraButton, askingToJoin, answeringAdmin, renderUsers } = require('../ui/ui.js');


// import { createRoom, requestToJoinRoom, approveUser, listenForApproval, getPendingRequest, deleteCandidate } from './supabase.js';
// import { openUserMedia, hangUp } from './media.js';
// import { createPeerConnection, getPeerConnection, addLocalTracks, closeConnection } from './webrtc.js';
// import { setupUI, setRoomText, toggleButtonStates, showAlert, enableCameraButton, askingToJoin, answeringAdmin, renderUsers } from '../ui/ui.js';

let peerConnection = null;
const roomId = "main-room";
let userId;
let currentAskUsers = [];

socket12.on("wordUser", (users) => {
    currentAskUsers=users;
    // renderUsers();
});

//El usuario se une a la sala
socket12.on("updatedUser", ( email ) => {
    userId = email;
    console.log("El usuario se ha unido a la sala con el ID:", userId);
    init();
  });

async function init() {
    setupUI({
        onCreate: createRooms,
        onAsk: requestToJoin,
        onJoin: handleJoinRequest,
        onCamera: handleCamera,
        onHangup: () => {
            deleteCandidate(userId);
            hangUp(peerConnection);
            enableCameraButton(true);
        }
    });
};

async function createRooms() {
    peerConnection = createPeerConnection(async (candidate) => {
        if (candidate) {
            await addIceCandidate(roomId, candidate);
        }
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    await createRoom(roomId, offer);
    setRoomText(roomId);

}

async function requestToJoin(){
    try {

        askingToJoin(userId);

        await requestToJoinRoom(roomId, userId);
        console.log(`Solicitud de unión enviada para la sala: ${roomId} como ${userId}.`);

    } catch (err) {
        console.error("Error al enviar la solicitud:", err);
    }
}

async function handleJoinRequest() {
    try {
        userId = await getPendingRequest(roomId);

        answeringAdmin(userId)

        await approveUser(userId, roomId);


        listenForApproval(userId, roomId, () => {
            enableCameraButton(true);
            alert('Has sido aprobado para activar tu cámara 🎥');
        });
    } catch (err) {
        console.error("Error al procesar la solicitud de unión:", err);
    }
}

async function handleCamera() {
    await openUserMedia(peerConnection);
    enableCameraButton(false);
}

init();

module.exports = {
    createRooms,
    requestToJoin,
    handleJoinRequest,
    handleCamera,
    hangUp,
    deleteCandidate,
    roomId
};