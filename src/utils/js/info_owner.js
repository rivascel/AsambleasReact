
const socket2 = io();

const loadError = document.querySelector("#mensajeError");
let globalEmail;

socket2.on("updatedUser", ( email ) => {
    // loadError.innerHTML = email || "Sin nombre"; 
    globalEmail =  email;
    fetchOwnerByEmail(globalEmail);
});


async function fetchOwnerByEmail(email){
    try{
        const response = await fetch('https://localhost:3000/fileOwnerByEmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({email}),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        const ownerData = await response.json();

        document.getElementById("interior").innerHTML = ownerData.owner.interior || '';
        document.getElementById("apartamento").innerHTML = ownerData.owner.apto || '';
        document.getElementById("correo").innerHTML = ownerData.owner.correo || '';
        document.getElementById("participacion").textContent = `${ownerData.participacion}` || '';
        // document.getElementById("resultado").textContent = "Información cargada con éxito";

    } catch(error){
        console.error('Error fetching owner data:', error.message);
        document.getElementById("mensajeError").innerHTML = "Error al cargar la información";
    }
}    
    


