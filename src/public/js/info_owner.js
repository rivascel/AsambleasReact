
const socket2 = io();

const coprop = document.querySelector("#copropietario");
let globalEmail;

socket2.on("updatedUser", ( email ) => {
    coprop.innerHTML = email || "Sin nombre";
    globalEmail =  email;
    fetchOwnerByEmail(globalEmail);
});

async function fetchOwnerByEmail(email){
    try{
        const response = await fetch('http://localhost:3000/fileOwnerByEmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({email}),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        const ownerData = await response.json();

        document.getElementById("interior").value = ownerData.owner.interior || '';
        document.getElementById("apartamento").value = ownerData.owner.apto || '';
        document.getElementById("correo").value = ownerData.owner.correo || '';
        document.getElementById("resultado").textContent = "Información cargada con éxito";
    
    } catch(error){
        console.error('Error fetching owner data:', error.message);
        document.getElementById("copropietario").textContent = "Error al cargar la información";
    }
}    
    
// const emailFromCookie = document.cookie.split('; ').find(row => row.startsWith('username='))?.split('=')[1];
// if (emailFromCookie) {
//     fetchOwnerByEmail(emailFromCookie);
// }

