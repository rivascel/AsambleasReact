
const socket5 = io();

// let minFinal= parseInt(document.querySelector('#minute').value, 10); //aseguramos que es un numero
// const sent = document.querySelector("#startBtn").addEventListener("click",cronometrar);
// document.querySelector(".stop").addEventListener("click",parar);
// document.querySelector(".reiniciar").addEventListener("click",reiniciar);

let seg=0, min=0, intervalo;
let minFinal; // Asegurarse de que el valor se tome al hacer clic en iniciar

document.getElementById("hms").innerHTML="00:00";

// Manejar el evento de inicio del cronómetro
document.querySelector("#startBtn").addEventListener("click", () => {
    minFinal = parseInt(document.querySelector('#minute').value, 10);
    if (isNaN(minFinal) || minFinal <= 0) {
        alert("Por favor, introduce un número válido para los minutos.");
        return;
    }
    // Reinicia valores
    seg = 0;
    min = 0;
    parar();
    intervalo = setInterval(escribir, 10);

    // Enviar a los clientes que el cronómetro ha iniciado
    socket5.emit('start-cronometer', { time: `${min}:00`});
});

function escribir(){
    seg++;
    if (seg === 60) {
        min++;
        seg = 0;
    }

    if (min >= minFinal) {
        parar();
        alert("El tiempo terminó");
    }

    const sAux = seg < 10 ? "0" + seg : seg;
    const mAux = min < 10 ? "0" + min : min;

    // Actualizar el cronómetro
    const time = mAux + ":" + sAux;
    document.getElementById("hms").innerHTML = time;

    // Enviar el cronómetro actualizado a los clientes
    socket5.emit('update-cronometer', { time });

}
function parar() {
    if (intervalo) {
        clearInterval(intervalo);
    }

// Escuchar cuando se inicia el cronómetro
socket5.on('start-cronometer', ({ time }) => {
    // Mostrar la decisión y el tiempo inicial
    document.querySelector('#hms').innerHTML = time;
});

// Escuchar actualizaciones del cronómetro
socket5.on('update-cronometer', ({ time }) => {
    document.querySelector('#hms').innerHTML = time;
});

}