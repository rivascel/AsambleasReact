//una funcion que se esta exportando para ser usada en otro
//archivo, y crea el servidor socket.io en tiempo real

module.exports = httpServer =>{
    const { Server } = require("socket.io");
    const io = new Server(httpServer);
    let connectedUsers = [];

    io.on("connection", socket => {

        // const cookie = socket.handshake.headers.cookie;

        // if (cookie != administrador) {
        // const user = cookie.split("=").pop();
        // const user = cookie.split("username=").pop()?.split(";")[0]; // Validar la existencia de la cookie

        const cookie = socket.handshake.headers.cookie || "";
        const user = cookie.split("=").pop(); // Obtener el usuario de la cookie

        if (user != '') {

            if (user) {
                if (!connectedUsers.includes(user)) {
                    connectedUsers.push(user); // Agregar usuario si no está en la lista
                };
                console.log("Usuario conectado:", user);
    
                //Enviar la lista actualizada a todos los clientes
                io.emit("updateConnectedUsers", connectedUsers);
                console.log("lista de conectados",connectedUsers)
            }
    
            // Escuchar el usuario enviado desde una página
            // socket.on("userUpdated", data => {
            //     // Emitir el input a todos los clientes conectados
            //     // socket.broadcast.emit("updatedUser", data);
            //     console.log("email recibido desde login", data);

            //     // data.value="";
            //     socket.emit("updatedUser",  data );
            //     console.log("updatedUser", data);

            // });

            socket.emit("updatedUser", user );
            // console.log("updatedUser", user);

            // Manejar la desconexión
            socket.on("disconnect", () => {
                // console.log("Usuario desconectado:", user);
                connectedUsers = connectedUsers.filter(id => id !== user);
                
            });
            // =======================================

            // socket.on("connect", () => {
            //     io.emit("connect", socket);
            //     console.log("Conectado al servidor, ID:", socket.id);
            // });
            
            // console.log("Receptor conectado, escuchando eventos send-votes...");
            // console.log("Nuevo cliente conectado, ID:", socket.id);

            // ================= ENVIO DEL DECISION A CLIENTES ===================
            socket.on("send-decision", data=>{
                io.emit("receive-decision", data );
            });
            
        // ================= ENVIO DE VOTOS A CLIENTES =================
            socket.on("send-votes", data => {
                // console.log("Votos emitidos", data);
                io.emit("receive-votes", { data });
                // console.log("Votos recibidos del emisor:", data);
            });
            
            //enviar el mensaje y el usuario
            socket.on("message", message => {
                io.emit("message", {
                    user,message
                });
            });
    
            //Enviar resultado votacion a todos los sockets conectados
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

        socket.on("disconnect", () => {
            console.log("Cliente desconectado:", socket.id);
            io.emit("user-disconnected", socket.id);
        });
        

        // ================= ENVIO DEL CRONOMETRO A CLIENTES ===================
        // Escuchar el inicio del cronómetro
        socket.on('start-cronometer', (data) => {
            // Retransmitir a todos los clientes
            io.emit('start-cronometer', data);
        });

        // Escuchar las actualizaciones del cronómetro
        socket.on('update-cronometer', (data) => {
            io.emit('update-cronometer', data);
        });
    });
};
