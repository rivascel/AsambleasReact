const socket6 = io();

const sent = document.querySelector('#activeBtn');

// Escuchar el clic para enviar la decisión
sent.addEventListener("click", () => {
    const decision = document.querySelector('#decision');
    socket6.emit('send-decision', decision.value );
    // document.querySelector('#decision').value ="";
});

 