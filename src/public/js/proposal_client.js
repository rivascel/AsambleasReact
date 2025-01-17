const socket8 = io();
const recDecision = document.querySelector('#decision');
let approvalVotes; 
let rejectVotes;
const canvas_rec = document.getElementById('results');
const ctx_rec = canvas_rec.getContext('2d');

// Escuchar cuando se envie la decision
socket8.on('receive-decision',  data  => {
    recDecision.textContent=data;
});    

// socket8.on('start-cronometer', ({ approval, reject, blank }) => {

//     // document.querySelector('#hms').innerHTML = time;
//     document.querySelector('#aprueba').disabled = approval;
//     document.querySelector('#rechaza').disabled = reject;
//     document.querySelector('#blanco').disabled = blank;
// });


socket8.on('receive-votes', (votes) => {
    console.log('Datos recibidos del servidor:',votes);

    const formattedVotes = votes.data;
    console.log('Datos formateados:',formattedVotes);

    if (Array.isArray(formattedVotes) && formattedVotes.length === 2) {
    const[approvalVotes_rec, rejectVotes_rec]=formattedVotes;

        approvalVotes=approvalVotes_rec;
        rejectVotes=rejectVotes_rec;

        console.log("Votos procesados:", approvalVotes, rejectVotes );

        const vote_rec = [approvalVotes, rejectVotes];
        console.log("votos recibidos",vote_rec);
        console.log('Votos procesados correctamente:',  approvalVotes, rejectVotes );

        // Datos
        const labels = ['Aprueba', 'No Aprueba'];
        const colors = ['#FF6384', '#36A2EB'];

        // Dibujar un gráfico de barras
        const barWidth = 50;
        const gap = 20;
        const offsetX = 20;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        vote_rec.forEach((vote, index) => {
            const x = offsetX + index * (barWidth + gap);
            const barHeight = (vote / Math.max(...vote_rec)) * canvas.height*0.8;
            ctx.fillStyle = colors[index];
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            // Etiquetas
            ctx.fillStyle = '#000';
            ctx.fillText(labels[index], x, canvas.height - 5);
        });
    }
    else {
        console.error("Formato de votos recibido inválido:", votes);
    }
});


    


