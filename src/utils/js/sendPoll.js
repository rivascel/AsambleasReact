// const socket7 = io();
const approval = document.querySelector("#aprueba");
const reject = document.querySelector("#rechaza");
const blank = document.querySelector("#blanco");
const decision = document.querySelector('#decision');

const canvas = document.getElementById('results');
const ctx = canvas.getContext('2d');

let building,apartment, mail, proposal,globalNewDict;

//Array de diccionarios
let votes=[{"interior":"","apartmento":"","correo":"","proposicion":"","aprueba":0}];

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
    const res= fetch('http://localhost:3000/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalNewDict)
        // body: globalNewDict,

    })
    .then(response => response)
    .then(result => result )
    .catch(error => {
        console.error('Error:', error);
    });
};

