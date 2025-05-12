const socket8 = io();
import { graphics } from './ui/graphics.js';
const recDecision = document.querySelector('#decision');
let approvalVotes; 
let rejectVotes;
let blankVotes;

const ocultar = document.querySelector("#work--resume");

// Escuchar cuando se envie la decision
socket8.on('receive-decision',  data  => {
    recDecision.textContent=data;
});    

socket8.on('receive-votes',  vote_send    => {
    // ocultar.hidden= true;
    console.log('Datos recibidos del servidor:',vote_send);

    let formattedVotes = vote_send;

    if (Array.isArray(formattedVotes) && formattedVotes.length === 3) {
        const[approvalVotes_rec, rejectVotes_rec, blankVotes_rec]=formattedVotes;

        approvalVotes=approvalVotes_rec;
        rejectVotes=rejectVotes_rec;
        blankVotes= blankVotes_rec;

        console.log("Votos procesados:", approvalVotes, rejectVotes, blankVotes );

        const vote_rec = [approvalVotes, rejectVotes, blankVotes];
        console.log("votos recibidos",vote_rec);
        console.log('Votos procesados correctamente:',  approvalVotes, rejectVotes, blankVotes );

        // Dibujar un gráfico de barras
        socket8.on('receive-votes', vote_send);
        graphics(approvalVotes, rejectVotes, blankVotes);

    }
    else {
        console.error("Formato de votos recibido inválido:", votes);
    }


});

socket8.on('ocultar', (data) => {
    console.log("ocultar", data);
    ocultando(data);
});


function ocultando(data

){
    // Si recibe evento de inicio y actualización del cronómetro
    ocultar.innerHTML = "";
    ocultar.hidden = false;
        const hidding = document.createRange().createContextualFragment(`
            <div id="work--resume">
                <h2>Resultados Votación</h2>
                <canvas id="results" width="300" height="200"></canvas>

                <span class="username">${data}</span>
                <img src="../assets/img/hand-up.png" alt="" class="logo">
            </div>
        `);
        cronometro.append(hidding);
};

    


