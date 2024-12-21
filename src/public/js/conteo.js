// const socket8 = io();
const approval = document.querySelector("#aprueba");
const reject = document.querySelector("#rechaza");
const blank = document.querySelector("#blanco");
const decision = document.querySelector('#decision').value.trim();
const calc = document.querySelector("#calculo");

const canvas = document.getElementById('results');
const ctx = canvas.getContext('2d');

let building,apartment, mail, proposal,globalNewDict;

//Array de diccionarios
let votes=[{"interior":"","apartmento":"","correo":"","proposicion":"","aprueba":0}];

calc.addEventListener('click', countVotes);

function registro(vote){
    let building = document.querySelector("#interior").value;
    let apartment = document.querySelector("#apartamento").value;
    let mail = document.querySelector("#correo").value;
    let proposal = document.querySelector("#decision").value;
    let newDict={interior:building,apartamento:apartment,correo:mail,proposicion:proposal,aprueba:vote};
    
    globalNewDict = newDict;
    poll(newDict);
}

function selectedVote(){
    const radios = document.getElementsByName('myRadio');
    let selectedValue
    for (const radio of radios) {
        let selectedValue;
        if (radio.checked) {
            selectedValue = parseInt(radio.value);
            registro(selectedValue);
            break;
        }
    }
    return selectedValue;
}

function updateStatus() {
    if (approval.checked) {
        reject.disabled = true;
        blank.disabled = true;
    } else if(reject.checked){
        approval.disabled = true;
        blank.disabled = true;
    }else {
        reject.disabled = true;
        approval.disabled = true;
    }
  }

approval.addEventListener('change', updateStatus)
reject.addEventListener('change', updateStatus)
blank.addEventListener('change', updateStatus)

function poll(globalNewDict){
    const res = fetch('http://localhost:3000/routes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(globalNewDict)
        // body: globalNewDict,

    })
    .then(response => response)
    .then(result => result )
    .catch(error => {
        console.error('Error:', error);
    });
};

async function countVotes() {
    try {
        // Hacer una solicitud al servidor para recuperar los datos
        const response = await fetch('http://localhost:3000/file')  // Asegúrate de que esta ruta devuelva los datos del archivo TXT
        if (!response.ok) {
            throw new Error(`Error al recuperar los datos: ${response.status}`);
        }
       
        const votesData = await response.json(); // Suponiendo que el servidor devuelve un JSON con los datos
        if (!Array.isArray(votesData)) {
            throw new Error("La respuesta del servidor no es un arreglo.");
        }
        
        console.log("Tipo de votesData:", typeof votesData);
        console.log("Datos recuperados:", votesData);

        // Calcular la suma de los votos registrados por propuesta y por atributo 1 o 2

        // Filtrar los datos según la propuesta seleccionada (decision)
        const filteredVotes = votesData.filter(vote => vote.proposicion.trim() === decision);
        console.log("votos filtrados",filteredVotes);

        // Calcular la suma de los votos para "aprueba" con valores 1 y 2
        const approvalVotes = filteredVotes.reduce((sum, vote) => sum + (vote.aprueba === 1 ? 1 : 0), 0);
        console.log("Total de votos a favor (aprueba = 1):", approvalVotes);

        const rejectVotes = filteredVotes.reduce((sum, vote) => sum + (vote.aprueba === 2 ? 1 : 0), 0);
        console.log("Total de votos en contra (aprueba = 2):", rejectVotes);


        // Datos
        const votes = [approvalVotes, rejectVotes];
        const labels = ['Aprueba', 'No Aprueba'];
        const colors = ['#FF6384', '#36A2EB'];

        // Dibujar un gráfico de barras
        const barWidth = 50;
        const gap = 20;
        const offsetX = 20;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        votes.forEach((vote, index) => {
            const x = offsetX + index * (barWidth + gap);
            const barHeight = (vote / Math.max(...votes)) * canvas.height*0.8;
            ctx.fillStyle = colors[index];
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            // Etiquetas
            ctx.fillStyle = '#000';
            ctx.fillText(labels[index], x, canvas.height - 5);
        });

        return { approvalVotes, rejectVotes };
        }    catch (error) {
            console.error("Error al contar los votos:", error);
            return null;
        }
}
