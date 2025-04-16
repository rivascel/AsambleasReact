// const socket13=io();

// const allUsers = document.querySelector("#all-users");

// // import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// // const SUPABASE_URL = 'https://hhmqduncjwddwptghsaj.supabase.co';
// // const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobXFkdW5jandkZHdwdGdoc2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODQ0NTIsImV4cCI6MjA1NzQ2MDQ1Mn0.0IC33LEBv1O4QO9ctymNJu7nMjzXqk1P3Un9gf8WYds';
// // const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// // const configuration = {
// //     iceServers: [
// //       {
// //         urls: [
// //           'stun:stun1.l.google.com:19302',
// //           'stun:stun2.l.google.com:19302',
// //         ],
// //       },
// //     ],
// //     iceCandidatePoolSize: 10,
// // };

// // let peerConnection = null;
// // let localStream = null;
// // let remoteStream = null;
// // const roomId = "main-room";
// // let userId=null;
// // let pc = null;


// function init() {
//     // peerConnection = new RTCPeerConnection(configuration);

//     // document.querySelector('#createBtn').addEventListener('click', createRoom);
//     // document.querySelector('#cameraBtn').addEventListener('click', openUserMedia);
//     // document.querySelector('#all-users').addEventListener('click', async (event) => {
//     //     if (event.target && event.target.id === "joinBtn") {
//           // Recuperar el user_id de la tabla requests
//     //       const { data: request, error } = await supabase
//     //       .from('requests')
//     //       .select('user_id')
//     //       .eq('room_id', roomId)
//     //       .eq('status', 'pending')
//     //       .single();
          

//     //   if (error) {
//     //       console.error("Error fetching request:", error);
//     //       return;
//     //   }

//     //   console.log("Respuesta de Supabase:", request);

//     //   if (!request || !request.user_id) {
//     //       console.error("No hay solicitudes pendientes o user_id no está definido.");
//     //       return;
//     //   }

//     //   userId = request.user_id; // Asignar el user_id recuperado
//     //         joinRoom();
//     //     } 
//     // });
    
// // }

// async function createRoom() {
//     // console.log('Creating PeerConnection with configuration:', configuration);

//     const offer = await peerConnection.createOffer();
//     await peerConnection.setLocalDescription(offer);
//     console.log('Created offer:', offer);

//     // const { error } = await supabase
//     //     .from('rooms')
//     //     .insert([{ room_id: roomId, offer: offer, candidates: [] }]);

//     // if (error) {
//     //     console.error("Error creating room:", error);
//     //     return;
//     // }

//     console.log(`New room created. Room ID: ${roomId}`);
//     document.querySelector('#currentRoom').innerText = `Current room is ${roomId} - You are the caller!`;
// }

// async function joinRoom() {
//   if (!peerConnection) {
//     console.error("PeerConnection no está inicializado. Crea una sala primero.");
//     return;
//     }

//     if (!userId) {
//     console.error("userId no está definido.");
//     return;
//     }

//     // supabase
//     // .channel('room-approval')
//     // .on(
//     //   'postgres_changes',
//     //   {
//     //     event: 'UPDATE',
//     //     schema: 'public',
//     //     table: 'requests',
//     //     filter: `user_id=eq.${userId}`,
//     //   },
//     //   (payload) => {
//     //     const status = payload.new.status;
//     //     const currentRoom = payload.new.room_id;
  
//     //     if (status === 'approved' && currentRoom === roomId) {
//     //       console.log('🟢 El administrador te aprobó para unirte');
//     //       cameraBtn.disabled = false;
  
//     //       // Opcional: mostrar aviso visual
//     //       alert('Has sido aprobado para activar tu cámara 🎥');
//     //     }
//     //   }
//     // )
//     // .subscribe();


//     registerPeerConnectionListeners();
//     await approveRequest(userId, roomId);

//     setTimeout(() => {
//         console.log('Room data:', roomId);
//         console.log('User ID:', userId);
//         hangUp();
//     }, 2000);
// }

// // async function approveRequest(userId, roomId) {
// //     if (!userId) {
// //         console.error("userId no está definido en approveRequest.");
// //         return;
// //     }

// //     const { error } = await supabase
// //       .from('requests')
// //       .update({ status: 'approved' })
// //       .eq('user_id', userId)
// //       .eq('room_id', roomId);

// //     if (error) {
// //         console.error("Error approving request:", error);
// //         return;
// //     }

// //     console.log(`Approved request for user: ${userId}`);

// //     socket13.on("wordUser", (users) => {
// //     currentAskUsers=users;
// //     currentAskUsers.shift;
// //     renderUsers();
// // });

// // }

// async function openUserMedia() {
//     try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

//         document.querySelector('#localVideo').srcObject = stream;
//         // stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

//         // remoteStream = new MediaStream();
//         document.querySelector('#remoteVideo').srcObject = remoteStream;

//         // Escuchar tracks remotos
//         peerConnection.ontrack = (event) => {
//             event.streams[0].getTracks().forEach(track => {
//                 remoteStream.addTrack(track);
//             });
//     };

//     } catch (error) {
//         console.error("Error accessing camera/microphone:", error);
//     }

//     document.querySelector('#cameraBtn').disabled = true;
//     document.querySelector('#hangupBtn').disabled = false;
//     document.querySelector('#joinBtn').disabled = false;
//     document.querySelector('#createBtn').disabled = false;
// }

// function hangUp() {
//     if (localStream) {
//         localStream.getTracks().forEach(track => track.stop());
//       }
    
//       if (remoteStream) {
//           remoteStream.getTracks().forEach(track => track.stop());
//       }
    
//       if (peerConnection) {
//           peerConnection.close();
//       }
    
//       document.querySelector('#localVideo').srcObject = null;
//       document.querySelector('#remoteVideo').srcObject = null;
//       document.querySelector('#cameraBtn').disabled = false;
//       document.querySelector('#hangupBtn').disabled = true;
    
//       document.location.reload(true);
// }

// function registerPeerConnectionListeners() {
//     if (!peerConnection) {
//         console.error("peerConnection no está inicializado.");
//         return;
//     };
  
//     peerConnection.addEventListener('icecandidate', (event) => {
//         if (event.candidate) {
//             console.log("New ICE candidate:", event.candidate);
//             // Aquí podrías enviar el candidato al servidor si es necesario
//         }
//     });
  
//     peerConnection.addEventListener('connectionstatechange', () => {
//         console.log("Connection state:", peerConnection.connectionState);
//     });
  
//     peerConnection.addEventListener('iceconnectionstatechange', () => {
//         console.log("ICE connection state:", peerConnection.iceConnectionState);
//     });
// }

// function renderUsers(){
//     // Si el usuario ya está en la lista, lo eliminamos y cambiamos el botón
//     allUsers.innerHTML = "";
//     currentAskUsers.forEach(user => {
//         let safeUserId = user.replace(/[@.]/g, "_");
//         const userElement = document.createRange().createContextualFragment(`
//             <div class="users" id="user-${safeUserId}">
//                 <div class="users-body">
//                     <div class="user-info">
//                         <span class="username" data-user="${user}">${user}</span>
//                         <img src="../assets/img/hand-up.png" alt="" class="logo">
//                         <button type="button" id="joinBtn" class="btn 
//                         secondary">Unirse a sala</button>
//                     </div>
//                 </div>
//             </div>
//         `);
//         allUsers.append(userElement);

//         // const userAllow = document.querySelector(`#user-${safeUserId}.username`);
//         // if (userAllow){
//         //     userAllow.addEventListener("click", () => {
                
//         //     });
//         // }
//     });
// };


// // init();