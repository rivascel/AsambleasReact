
// const  sendMagicLink  = require("../utils/sendMagicLink");
const socket3 = io();

// const login = document.querySelector("#login");
const user = document.querySelector("#username");

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

login.addEventListener("click", async ()=>{
    const userValue = user.value.trim();
    
    if (userValue === "administrator"){
        document.cookie = `username=${userValue}`;
        window.location.href = "/administrator";
    } else if (isValidEmail(userValue)){
        const tempUser = userValue;
        document.cookie = `username=${encodeURIComponent(userValue)}`;

        try{
            await sendURL(tempUser);
            // Emitir el valor del input al servidor cuando cambie
            socket3.emit("userUpdated",  tempUser  );
            // document.location.href="/owner";
            alert("Por favor vaya al correo ingresado " + tempUser);
        } catch(error){
            console.error('Error enviando el enlace magico:', error);
            alert("no se pudo enviar el enlace magico, intentalo nuevamente");
        }
    } else {
        alert("Escribe el correo electronico");
    };
});
    
async function sendURL(email){
    try{
    const response = await fetch('http://localhost:3000/request-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error desconocido");
    }

    const result = await response.json();
    console.log("Respuesta del servidor:", result);
    return result;
    } catch (error) {
        console.error("Error en sendURL:", error.message);
        throw error;
    }
}

