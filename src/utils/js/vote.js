
const socket1 = io();

const aprueba = document.querySelector("#aprueba");
const rechaza = document.querySelector("#rechaza");
const statical = document.querySelector("#statical");


//enviar evento

aprueba.addEventListener('click', ()=>{
    socket1.emit("vote1",aprueba.value);
    aprueba.value="";
})

rechaza.addEventListener('click', ()=>{
    socket1.emit("vote2",rechaza.value);
    rechaza.value="";
});

