const socket6 = io();

const decisionOffer = document.querySelector('#decision');

// Escuchar el clic para enviar la decisión
document.querySelector("#activeBtn").addEventListener("click", () => {
    socket6.emit('send-decision', decisionOffer.value );
    alert("se envio la pregunta");
    // document.querySelector('#decision').value ="";
});

 