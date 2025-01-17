const socket10 = io();
const approval = document.querySelector("#aprueba");
const reject = document.querySelector("#rechaza");
const blank = document.querySelector("#blanco");
const decision = document.querySelector('#decision').value;

const calc = document.querySelector("#calculo");

const canvas = document.getElementById('results');
const ctx = canvas.getContext('2d');

let building,apartment, mail, proposal,globalNewDict;

let globalVoteSend;

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

if (approval || reject || blank) {
    approval.addEventListener('change', updateStatus)
    reject.addEventListener('change', updateStatus)
    blank.addEventListener('change', updateStatus)
}

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
        const response = await fetch('http://localhost:3000/file');  // Asegúrate de que esta ruta devuelva los datos del archivo TXT
        const res = await fetch('http://localhost:3000/dataFile');
        if (!response.ok) {
            throw new Error(`Error al recuperar los datos: ${response.status} ${res.status}`);
        }
        
        const ownerData = await res.json();
        const votesData = await response.json(); // Suponiendo que el servidor devuelve un JSON con los datos
        
        if (!Array.isArray(votesData) && !Array.isArray(ownerData)) {
            throw new Error("La respuesta del servidor no es un arreglo.");
        }
        
        // console.log("Tipo de votesData:", typeof ownerData);
        // console.log("Datos recuperados:", ownerData);

        for (let i = 0; i < votesData.length; i++) {
            let found = false; // Bandera para verificar si encontramos el correo en ownerData
            
            for (let j = 0; j < ownerData.length; j++) { 
                if (votesData[i].correo.trim() === ownerData[j].correo.trim()) {
                    // console.log(`Voto ${i}: ${votesData[i].correo}, Data ${j}: ${ownerData[j].correo}`);
                    found = true; // Se encontró una coincidencia

                    votesData[i].participacion = ownerData[j].participacion;
                    
                    // console.log("Consolidado Votacion",votesData);
                    break; // Salir del bucle interno si ya encontramos el correo
                }
            }
        
            if (!found) {
                console.log(`No se encontró el correo: ${votesData[i].correo}`);
            }
        }

        // console.log(`Decision: [${decision.trim()}]`);

        // Calcular la suma de los votos registrados por propuesta y por atributo 1 o 2
        // console.log("Valor de decisión:", decision);

        const filteredVotes = votesData.filter(vote => vote.proposicion.trim() === decision.trim());
        console.log("votos filtrados",filteredVotes);

        const contarVotosApprobal = (votos) => {
            return votos.reduce((total, voto) => {
                if (voto.aprueba === 1 && voto.participacion === 0) {
                    return total + 1;  // Cuenta el voto
                } else if (voto.aprueba === 1 && voto.participacion !== 0) {
                    return total + (1 * voto.participacion);  // Multiplica por participación
                } else {
                    return total;
                }
            }, 0);
        };
        
        const contarVotosReject = (votos) => {
            return votos.reduce((total, voto) => {
                if (voto.aprueba === 2 && voto.participacion === 0) {
                    return total + 1;
                } else if (voto.aprueba === 2 && voto.participacion !== 0) {
                    return total + (1 * voto.participacion);
                } else {
                    return total;
                }
            }, 0);
        };
        
        const contarVotosBlank = (votos) => {
            return votos.reduce((total, voto) => {
                if (voto.aprueba === 0 && voto.participacion === 0) {
                    return total + 1;
                } else if (voto.aprueba === 0 && voto.participacion !== 0) {
                    return total + (1 * voto.participacion);
                } else {
                    return total;
                }
            }, 0);
        };

        const approvalVotes = contarVotosApprobal(filteredVotes);
        // console.log("approvalVotes", approvalVotes);

        const rejectVotes = contarVotosReject(filteredVotes);
        // console.log("rejectVotes", rejectVotes);

        const blankVotes = contarVotosBlank(filteredVotes);
        // console.log("blankVotes", blankVotes);
        
        // Datos
        const vote_send= [approvalVotes, rejectVotes, blankVotes];
        const labels = ['Aprueba', 'No Aprueba', 'Blanco'];
        const colors = ['#FF6384', '#36A2EB',' #dc3511 '];

        socket10.emit('send-votes', vote_send)
        // console.log("send-votes", vote_send)

        // Dibujar un gráfico de barras
        const barWidth = 50;
        const gap = 20;
        const offsetX = 20;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        vote_send.forEach((vote, index) => {
            const x = offsetX + index * (barWidth + gap);
            const barHeight = (vote / Math.max(...vote_send)) * canvas.height*0.8;

            const porcentaje = (vote / vote_send.reduce((a,b)=>a+b,0)) * 100;
            // console.log(`Porcentaje de ${labels[index]}: ${porcentaje.toFixed(2)}%`);

            ctx.fillStyle = colors[index];
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            // Etiquetas
            ctx.fillStyle = '#000';
            ctx.fillText(labels[index], x, canvas.height - 5);
            ctx.fillText(porcentaje.toFixed(2) +'%' , x, canvas.height - 15);
        });

        return { approvalVotes, rejectVotes, blankVotes };

    } catch (error) {
    console.error("Error al contar los votos:", error);
    return null;
    };
};