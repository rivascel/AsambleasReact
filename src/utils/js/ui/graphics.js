

export function graphics(approvalVotes, rejectVotes, blankVotes){
    const canvas = document.getElementById('results');
    const ctx = canvas.getContext('2d');

    
        const vote_graph= [approvalVotes, rejectVotes, blankVotes];
    
        const labels = ['Aprueba', 'No Aprueba', 'Blanco'];
        const colors = ['#FF6384', '#36A2EB',' #dc3511 '];

        // Dibujar un gráfico de barras
        const barWidth = 50;
        const gap = 20;
        const offsetX = 20;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        vote_graph.forEach((vote, index) => {
            const x = offsetX + index * (barWidth + gap);
            const barHeight = (vote / Math.max(...vote_graph)) * canvas.height*0.8;

            const porcentaje = (vote / vote_graph.reduce((a,b)=>a+b,0)) * 100;
            // console.log(`Porcentaje de ${labels[index]}: ${porcentaje.toFixed(2)}%`);

            ctx.fillStyle = colors[index];
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            // Etiquetas
            ctx.fillStyle = '#000';
            ctx.fillText(labels[index], x, canvas.height - 5);
            ctx.fillText(porcentaje.toFixed(2) +'%' , x, canvas.height - 15);
        });

}