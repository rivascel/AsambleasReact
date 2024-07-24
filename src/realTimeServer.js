//una funcion que se esta exportando para ser usada en otro
//archivo, y crea el servidor socket.io en tiempo real

module.exports = httpServer =>{
    const { Server } = require("socket.io");
    const io = new Server(httpServer);
    let connectedUsers = [];

    io.on("connection", socket => {
        const cookie = socket.handshake.headers.cookie;
        const user = cookie.split("=").pop();
        console.log('A user connected:', socket.id);

        // // Añadir al usuario a la lista de usuarios conectados
        connectedUsers.push(socket.id);

        // Enviar la lista actualizada a todos los clientes
        io.emit('updateUserList', connectedUsers);


         // Manejar la desconexión
        socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);


        // Remover al usuario de la lista
        connectedUsers = connectedUsers.filter(id => id !== socket.id);

        // Enviar la lista actualizada a todos los clientes
        io.emit('updateUserList', connectedUsers);
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
            io.emit("vote2", {
                user,voto3 
            });
        });

    });
};
