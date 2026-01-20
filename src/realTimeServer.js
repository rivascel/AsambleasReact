//una funcion que se esta exportando para ser usada en otro
//archivo, y crea el servidor socket.io en tiempo real

const jwt = require("jsonwebtoken");

module.exports = httpServer =>{
    const { Server } = require("socket.io");
    const io = new Server(httpServer, {
        cors: {
            origin: 'https://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    }
    );
    let connectedUsers = [];
    const ADMIN_EMAIL = "admin";
    let administrador = "";
    let userIdentifier;

    // Configuración de Socket.IO con CORS
        io.on("connection", socket => {

            const cookieString = socket.handshake.headers.cookie || ""; 

            const getCookie = (name) => {  
                const value = `; ${cookieString}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop().split(';').shift();
                return null;
            };

            const sessionCookie = getCookie('session');

            if (sessionCookie) {
                try {
                // 1. Decodificar caracteres especiales (como %22 para comillas)
                const decodedSession = decodeURIComponent(sessionCookie);
                // 2. Parsear el string JSON a objeto JS
                const sessionData = JSON.parse(decodedSession);
                
                // Usamos el email como identificador en la lista
                userIdentifier = sessionData.email;

                if (userIdentifier && !connectedUsers.includes(userIdentifier)) {
                    connectedUsers.push(userIdentifier);
                    io.emit("updateConnectedUsers", connectedUsers);
                    console.log("lista de conectados",connectedUsers)
                }
            } catch (e) {
                console.error("Error al parsear la cookie session en Socket:", e.message);
            }
            console.log("Usuarios conectados actualmente:", connectedUsers);

            }

        // const user = decodeURIComponent(cookie.split("username=").pop()?.split(";")[0]); 
        // Validar la existencia de la cookie if (!user) return;
        
            if (!userIdentifier) return;

            if (userIdentifier != '') {
                // if (user ) {
                //     if (!connectedUsers.includes(user)) {
                //         connectedUsers.push(user); // Agregar usuario si no está en la lista
                //     };
        
                //     //Enviar la lista actualizada a todos los clientes
                //     io.emit("updateConnectedUsers", connectedUsers);
                //     console.log("lista de conectados",connectedUsers)
                // }
        
                socket.emit("updatedUser", userIdentifier );

                // Manejar la desconexión
                socket.on("disconnect", () => {
                    // console.log("Usuario desconectado:", user);
                    connectedUsers = connectedUsers.filter(id => id !== userIdentifier);
                    console.log("Usuario desconectado:", userIdentifier);
                    io.emit("updateConnectedUsers", connectedUsers); // ⬅️ importante
                    console.log("lista de conectados", connectedUsers);
                });

                socket.on("wordUser", ({ user, action}) =>{
                    if (!global.currentAskUsers){ //si no hay usuarios solicitando, array en blanco
                        global.currentAskUsers = []
                    }
                    if (action === 'add'){
                        if(!global.currentAskUsers.includes(user)){
                            global.currentAskUsers.push(user)
                        }
                    
                    }else if (action === 'remove'){
                        global.currentAskUsers = global.currentAskUsers.filter(u => u !== user);
                    }

                    io.emit("wordUser", global.currentAskUsers);
                    console.log("wordUser:", global.currentAskUsers);
                });
                
                // ================= ENVIO DEL DECISION A CLIENTES ===================
                socket.on("send-decision", text => {
                    socket.broadcast.emit("receive-decision", text );
                });
                
            // ================= ENVIO DE VOTOS A CLIENTES =================
                //enviar el mensaje y el usuario
                socket.on("message", (data) => {
                    socket.broadcast.emit("message", data);
                });

                // ===================== ACTUALIZAR USE EFFECT SOLICITUDES REALIZADAS =======
                socket.on("request-update", (userId, roomId, status, timeStamp) => {
                    socket.broadcast.emit("request-update", (userId, roomId, status, timeStamp));
                });

                socket.on("request-update-cancel", (userId, status, timeStamp) => {
                    socket.broadcast.emit("request-update", (userId, status, timeStamp));
                });

                // ===================== ENVIA APROBACION PARA EMITIR =======
                socket.on("approve", (userId) => {
                    socket.broadcast.emit("approve", (userId));
                });

                //============== ENVIA SOLICITUD PARA UNIRSE AL STREAM
                socket.on("admin-ready", () =>{
                    console.log("transmisión del admin");
                    socket.broadcast.emit("stream-ready");
                });

                socket.on("user-ready", (userId, roomId) =>{
                    console.log("transmisión del user",userId, roomId);
                    socket.broadcast.emit("stream-ready-user",userId, roomId);
                });
               
            }
            // ===============CONEXION VIDEO ===================================
            // Manejar eventos de WebRTC (señalización)
            socket.on("offer", data => {
                const { to, offer } = data;
                io.to(to).emit("offer", { from: socket.id, offer });
            });

            socket.on("answer", data => {
                const { to, answer } = data;
                io.to(to).emit("answer", { from: socket.id, answer });
            });

            socket.on("ice-candidate", data => {
                const { to, candidate } = data;
                io.to(to).emit("ice-candidate", { from: socket.id, candidate });
            });

            // Notificar a otros usuarios sobre nuevas conexiones
            socket.on("join-room", roomId => {
                socket.join(roomId);
                socket.to(roomId).emit("user-connected", socket.id);
            });

            // socket.on("broadCasting",   (email)   => {
            //     console.log("Administrador transmitiendo:", administrador);
            //     // Enviar mensaje a todos los clientes conectados   
            //     io.emit("admin-connected", email );
            // });

            // ================= ENVIO DEL CRONOMETRO A CLIENTES ===================
            // Escuchar el inicio del cronómetro
                socket.on('start-cronometer', ({ time })  => {

                    io.emit('start-cronometer', { 
                        time 

                    });
                    console.log("cronometro iniciado", time);
                });

                // Escuchar las actualizaciones del cronómetro
                socket.on('update-cronometer', data => {
                    io.emit('update-cronometer', data);
                });

                socket.on('end-cronometer', () => {
                    io.emit('end-cronometer');
                });

                socket.on('ocultar', data => {
                    socket.broadcast.emit('ocultar', data);
                });

                socket.on('signal', data => {
                    // Retransmitir señal a todos excepto al emisor
                    socket.broadcast.emit('signal', data);
                  });

                socket.on('send-votes', data => {
                    socket.broadcast.emit('send-votes', data);
                  });
                
    });
    
};
