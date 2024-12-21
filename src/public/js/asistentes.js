load();
function load(){
    const socket2 = io();
    const correo = document.querySelector("#correo");

    const coprop = document.querySelector("#copropietario");

    const allAssistants = document.querySelector("#all-assistants");

    // Actualizar el valor mostrado cuando se recibe un evento
    socket2.on("updatedUser", (data) => {
        coprop.innerHTML = data || "Sin nombre";
        // console.log("usuario actualizado", user)
    });

    // socket2.emit("connectedUsers", coprop);

    socket2.on("updateConnectedUsers",  ( connectedUsers ) => {
        // console.log("connectedUsers", connectedUsers);
        allAssistants.innerHTML = ""; // Limpiar la lista antes de actualizar
        connectedUsers.forEach((user) => {
            const assistantList = document.createRange().createContextualFragment
                (`
                <div class="assistants">
                    <div class="assistants-body">
                        <div class="user-info">
                            <span class="username">${user}</span>
                            <span class="time">Hace 1 segundo</span>
                        </div>
                    </div>
                </div>
                `);
            allAssistants.append(assistantList);
        });
    });

    // Escuchar desconexiones (opcional para mensajes visuales)
    socket2.on("userDisconnected", (user) => {
        console.log(`${user} se desconectó.`);
    });
}
