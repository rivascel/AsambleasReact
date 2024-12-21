const socket4 = io(); // Conexión a tu servidor

const peerConnections = {};
const localVideo = document.getElementById("localVideo");
const remoteVideos = document.getElementById("remoteVideos");

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localVideo.srcObject = stream;

        // Notificar al servidor que te uniste a una sala
        socket.emit("join-room", "roomId");

        socket.on("user-connected", userId => {
            console.log("Nuevo usuario conectado:", userId);
            createOffer(userId, stream);
        });

        socket.on("offer", async ({ from, offer }) => {
            const pc = createPeerConnection(from);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { to: from, answer });
        });

        socket.on("answer", async ({ from, answer }) => {
            const pc = peerConnections[from];
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("ice-candidate", ({ from, candidate }) => {
            const pc = peerConnections[from];
            pc.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on("user-disconnected", userId => {
            if (peerConnections[userId]) {
                peerConnections[userId].close();
                delete peerConnections[userId];
            }
        });

        function createPeerConnection(userId) {
            const pc = new RTCPeerConnection();
            pc.onicecandidate = event => {
                if (event.candidate) {
                    socket.emit("ice-candidate", {
                        to: userId,
                        candidate: event.candidate
                    });
                }
            };

            pc.ontrack = event => {
                const video = document.createElement("video");
                video.srcObject = event.streams[0];
                video.autoplay = true;
                remoteVideos.appendChild(video);
            };

            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            peerConnections[userId] = pc;
            return pc;
        }

        async function createOffer(userId, stream) {
            const pc = createPeerConnection(userId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", { to: userId, offer });
        }
    })
    .catch(error => console.error("Error accediendo a la cámara:", error));
