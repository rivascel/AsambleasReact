
const socket9 = io();
const allUsers = document.querySelector("#all-users");

socket9.on("updateConnectedUsers",  ( connectedUsers ) => {
    allAssistants.innerHTML = ""; // Limpiar la lista antes de actualizar
    
    connectedUsers.forEach((user) => {
        user;
        // const assistantList = document.createRange().createContextualFragment
        // (`
        // <div class="assistants">
        //     <div class="assistants-body">
        //         <div class="user-info">
        //             <span class="username">${user}</span>
        //             <img src="../assets/img/hand-up.png" alt="" class="logo">
        //         </div>
        //     </div>
        // </div>
        // `);
        // allAssistants.append(assistantList);
    });

    setTimeout(async () => {
        //conteo de asistencia para quorun
        try {
            // Hacer una solicitud al servidor para recuperar los datos
            const response = await fetch('http://localhost:3000/emailFile')  // Asegúrate de que esta ruta devuelva los datos del archivo TXT
            if (!response.ok) {
                throw new Error(`Error al recuperar los datos: ${response.status}`);
            }
        
            const votesData = await response.json(); // Suponiendo que el servidor devuelve un JSON con los datos
            if (!Array.isArray(votesData)) {
                throw new Error("La respuesta del servidor no es un arreglo.");
            }
    
            let quorum = votesData.filter(mail => connectedUsers.includes(mail.correo));
    
            let quorumPercentage = quorum.length/votesData.length*100;
            
            const quorumElement= document.querySelector("#quorum");
    
            if (quorumElement){
                quorumElement.textContent = `Quorum: ${quorumPercentage.toFixed(2)}%`;
            }
    
        }    catch (error) {
            console.error("Error al contar el quorum:", error);
            return null;
        }
    }, 1000);
    
});                

let currentUser = null;
// let currentAskUsers = new Queue();
let currentAskUsers = [];

socket9.on("updatedUser", user=>{
    currentUser=user;
})

socket9.on("wordUser", (users) => {
    currentAskUsers=users;
    renderUsers();
});

// Escuchar evento del botón una sola vez
ask.addEventListener("click", () => {
    if (!currentUser) return; // Si no hay usuario actual, salir

    if (!currentAskUsers.includes(currentUser)) {
        currentAskUsers.push(currentUser);
        socket9.emit("wordUser", { user: currentUser, action: "add"} );
        ask.textContent = "Cancelar Palabra";
    } else {
        socket9.emit("wordUser", { user: currentUser, action: "remove" });

        ask.textContent = "Solicitud Palabra";
    }

    renderUsers();
});

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

// Escuchar desconexiones (opcional para mensajes visuales)
socket9.on("userDisconnected", (user) => {
    console.log(`${user} se desconectó.`);
});