const socket12=io();

const allUsers = document.querySelector("#all-users");

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = 'https://hhmqduncjwddwptghsaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobXFkdW5jandkZHdwdGdoc2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODQ0NTIsImV4cCI6MjA1NzQ2MDQ1Mn0.0IC33LEBv1O4QO9ctymNJu7nMjzXqk1P3Un9gf8WYds';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const configuration = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

  
let peerConnection = null;
let localStream = null;
let remoteStream = null;
let userId;
const roomId = "main-room"; 

//El usuario se une a la sala
socket12.on("updatedUser", ( email ) => {
  userId = email;
  console.log("El usuario se ha unido a la sala con el ID:", userId);
  init();
});

//el cliente abre el video, cuelga la llamada y solicita unirse a la sala
function init() {
  
  // document.querySelector('#cameraBtn').disabled = true;
  // document.querySelector('#hangupBtn').disabled = true;

  peerConnection = new RTCPeerConnection(configuration);
  registerPeerConnectionListeners();
  document.querySelector('#cameraBtn').addEventListener('click', openUserMedia);
  document.querySelector('#hangupBtn').addEventListener('click', hangUp);
  document.querySelector('#ask').addEventListener('click', () => requestToJoinRoom(roomId, userId));
}

//El usuario se une a la sala
async function requestToJoinRoom(roomId, userId) {
  if (!userId) {
    console.error("userId no está definido.");
    return;
}
  console.log(`Requesting to join room: ${roomId} as ${userId}`);

  const { error } = await supabase
    .from('requests')
    .insert([{ user_id: userId, status: 'pending', room_id: roomId }]);

  if (error) {
    console.error("Error sending request:", error);
    return;
  }

  console.log(`Request sent for room: ${roomId}. Waiting for admin approval.`);
}

//El usuario da permiso a la camara
async function openUserMedia(e) {

  if (!peerConnection) {
    console.error("peerConnection no está inicializado.");
    return;
  }

  supabase
  .channel('room-approval')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'requests',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      const status = payload.new.status;
      const currentRoom = payload.new.room_id;

      if (status === 'approved' && currentRoom === roomId) {
        console.log('🟢 El administrador te aprobó para unirte');
        cameraBtn.disabled = false;

        // Opcional: mostrar aviso visual
        alert('Has sido aprobado para activar tu cámara 🎥');
      }
    }
  )
  .subscribe();
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.querySelector('#localVideo').srcObject = stream;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    remoteStream = new MediaStream();
    document.querySelector('#remoteVideo').srcObject = remoteStream;

    // Escuchar tracks remotos
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
          remoteStream.addTrack(track);
      });
    };

  } catch (error) {
    console.error("Error accessing camera/microphone:", error);
  }

  document.querySelector('#cameraBtn').disabled = true;
  document.querySelector('#hangupBtn').disabled = false;

  // Este codigo es para que actualice los usuarios conectados luego que el 
  // administrador aprobara solicitud de usuario que pide la palabra
  // por tanto se borró
  socket12.on("wordUser", (users) => {
    currentAskUsers=users;
    currentAskUsers.shift;
    renderUsers();
});

}

//EL cliente cuelga la llamada
function hangUp() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }

  if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
  }

  if (peerConnection) {
      peerConnection.close();
  }

  document.querySelector('#localVideo').srcObject = null;
  document.querySelector('#remoteVideo').srcObject = null;
  document.querySelector('#cameraBtn').disabled = false;
  document.querySelector('#hangupBtn').disabled = true;

  document.location.reload(true);
}

function registerPeerConnectionListeners() {
  if (!peerConnection) {
      console.error("peerConnection no está inicializado.");
      return;
  };

  peerConnection.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
          console.log("New ICE candidate:", event.candidate);
          // Aquí podrías enviar el candidato al servidor si es necesario
      }
  });

  peerConnection.addEventListener('connectionstatechange', () => {
      console.log("Connection state:", peerConnection.connectionState);
  });

  peerConnection.addEventListener('iceconnectionstatechange', () => {
      console.log("ICE connection state:", peerConnection.iceConnectionState);
  });
}

function renderUsers(){
  // Si el usuario ya está en la lista, lo eliminamos y cambiamos el botón
  allUsers.innerHTML = "";

  currentAskUsers.forEach(user => {
      let safeUserId = user.replace(/[@.]/g, "_");
      const userElement = document.createRange().createContextualFragment(`
          <div class="users" id="user-${safeUserId}">
              <div class="users-body">
                  <div class="user-info">
                      <span class="username" data-user="${user}">${user}</span>
                      <img src="../assets/img/hand-up.png" alt="" class="logo">

                  </div>
              </div>
          </div>
      `);
      allUsers.append(userElement);

      const userAllow = document.querySelector(`#user-${safeUserId}.username`);
      if (userAllow){
          userAllow.addEventListener("click", () => {
              
          });
      }
  });
};