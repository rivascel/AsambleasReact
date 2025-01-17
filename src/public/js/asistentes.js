import Queue from "./cola.js";

const socket9 = io();
const ask = document.querySelector("#ask");

// const coprop = document.querySelector("#copropietario");

const allAssistants = document.querySelector("#all-assistants");

// Actualizar el valor mostrado cuando se recibe un evento
// socket2.on("updatedUser", (data) => {
//     coprop.innerHTML = data || "Sin nombre";
//     console.log("usuario actualizado", data);
// });

// socket2.emit("connectedUsers", coprop);

socket9.on("updateConnectedUsers",  ( connectedUsers ) => {
    // console.log("connectedUsers", connectedUsers);
    allAssistants.innerHTML = ""; // Limpiar la lista antes de actualizar
    
    connectedUsers.forEach((user) => {

        const assistantList = document.createRange().createContextualFragment
        (`
        <div class="assistants">
            <div class="assistants-body">
                <div class="user-info">
                    <span class="username">${user}</span>
                    <img src="../assets/img/hand-up.png" alt="" class="logo">
                </div>
            </div>
        </div>
        `);
        allAssistants.append(assistantList);
    
        // UsersAsk = connectedUsers;
                
        const askUsers = new Queue();
        askUsers.push(user);
        // console.log("usuario-palabra",askUsers);

        ask.addEventListener("click", () => {
            const userDiv = document.createRange().createContextualFragment
            (`
                <div class="users">
                    <div class="users-body">
                        <div class="user-info">
                            <span class="username">${user}</span>
                            <img src="../assets/img/hand-up.png" alt="" class="logo">
                        </div>
                    </div>
                </div>
            `);
            document.querySelector("#all-users").append(userDiv);
        });
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

// Escuchar desconexiones (opcional para mensajes visuales)
socket9.on("userDisconnected", (user) => {
    console.log(`${user} se desconectó.`);
});




