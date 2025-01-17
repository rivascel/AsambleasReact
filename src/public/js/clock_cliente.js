const socket11 = io();

const initCrono = document.querySelector("#hms");
const valueCrono = document.querySelector("#hms");
// const aprueba_cli = document.querySelector("#aprueba");
// const rechaza_cli = document.querySelector("#rechaza");
// const blanco_cli = document.querySelector("#blanco");

// Escuchar cuando se envie la decision
socket11.on('start-cronometer',  (time, aprueba, rechaza, blanco)  => {
    initCrono.textContent=data.time;
// Mostrar la decisión y el tiempo inicial
    // document.querySelector('#hms').innerHTML = time;
    // document.querySelector('#aprueba').innerHTML = approval;
    // document.querySelector('#rechaza').innerHTML = reject;
    // document.querySelector('#blanco').innerHTML = blank;

    document.querySelector('#aprueba').disabled = aprueba;
    document.querySelector('#rechaza').disabled = rechaza;
    document.querySelector('#blanco').disabled = blanco;
});    


socket11.on('update-cronometer',  (data)  => {
    document.querySelector('#hms').textContent = data.time;
});  

socket11.on('end-cronometer', () => {
    // Deshabilitar opciones al terminar el cronómetro
    document.querySelector('#aprueba').disabled = true;
    document.querySelector('#rechaza').disabled = true;
    document.querySelector('#blanco').disabled = true;

    alert("El tiempo para votar ha finalizado.");
});