//una funcion que se esta exportando para ser usada en otro
//archivo, y crea el servidor socket.io en tiempo real

module.exports = httpServer =>{
    const { Server } = require("socket.io");
    const io = new Server(httpServer, {
        cors: {
            origin: 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    }
    );
    let connectedUsers = [];
    const ADMIN_EMAIL = "admin";
    let administrador = "";

    // Configuración de Socket.IO con CORS
        io.on("connection", socket => {

        const cookie = socket.handshake.headers.cookie || "";
            
        const user = decodeURIComponent(cookie.split("username=").pop()?.split(";")[0]); // Validar la existencia de la cookie
        console.log("admin", user);
        if (!user) return;

        // if (user === ADMIN_EMAIL || user) {
        // administrador = user;
        // }

            if (user != '') {
                if (user || user === ADMIN_EMAIL) {
                    if (!connectedUsers.includes(user)) {
                        connectedUsers.push(user); // Agregar usuario si no está en la lista
                    };
                    console.log("Usuario conectado:", user);
        
                    //Enviar la lista actualizada a todos los clientes
                    io.emit("updateConnectedUsers", connectedUsers);
                    console.log("lista de conectados",connectedUsers)
                }
        
                socket.emit("updatedUser", user );
                // console.log("updatedUser", user);

                // Manejar la desconexión
                socket.on("disconnect", () => {
                    // console.log("Usuario desconectado:", user);
                    connectedUsers = connectedUsers.filter(id => id !== user);
                    console.log("Usuario desconectado:", user);
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
                socket.on("send-votes", vote_send => {
                    console.log("Votos emitidos", vote_send);
                    socket.broadcast.emit("receive-votes",   vote_send  );
                    console.log("Votos recibidos del emisor:", vote_send);
                });
                
                //enviar el mensaje y el usuario
                socket.on("message", (data) => {
                    socket.broadcast.emit("message", data);
                });
        
                //Enviar resultado votacion de todos los sockets conectados
               socket.on("vote", voto =>{
                    io.emit("vote", {
                        user,voto
                    });
                });
        

                socket.on("vote1", voto1 =>{
                    io.emit("vote1", {
                        user,voto1
                    });
                });
        
                socket.on("vote2", voto2  =>{
                    io.emit("vote2", {
                        user,voto2
                    });
                });
        
                socket.on("vote3", voto3  =>{
                    io.emit("vote3", {
                        user,voto3 
                    });
                });
            }
            // ===============CONEXION VIDEO ===================================
            // Manejar eventos de WebRTC (señalización)
            // socket.on("offer", data => {
            //     const { to, offer } = data;
            //     io.to(to).emit("offer", { from: socket.id, offer });
            // });

            // socket.on("answer", data => {
            //     const { to, answer } = data;
            //     io.to(to).emit("answer", { from: socket.id, answer });
            // });

            // socket.on("ice-candidate", data => {
            //     const { to, candidate } = data;
            //     io.to(to).emit("ice-candidate", { from: socket.id, candidate });
            // });

            // // Notificar a otros usuarios sobre nuevas conexiones
            // socket.on("join-room", roomId => {
            //     socket.join(roomId);
            //     socket.to(roomId).emit("user-connected", socket.id);
            // });

            // socket.on("disconnect", () => {
            //     console.log("Cliente desconectado:", socket.id);
            //     io.emit("user-disconnected", socket.id);
            // });
            

            // ================= ENVIO DEL CRONOMETRO A CLIENTES ===================
            // Escuchar el inicio del cronómetro
                socket.on('start-cronometer', ({ time })  => {

                    // const { time, aprueba, rechaza, blanco } = data;
                    // Retransmitir a todos los clientes
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
                
    });
    
};
