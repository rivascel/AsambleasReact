const socket1 = io();

const aprueba = document.querySelector("#aprueba");
const rechaza = document.querySelector("#rechaza");
//const vote = document.querySelector("#vote");

const statical = document.querySelector("#statical");

//enviar evento

aprueba.addEventListener('click', ()=>{
    //const aprueba = document.querySelector("#aprueba");
    socket1.emit("vote1",aprueba.value);
    aprueba.value="";

})

//console.log("aprueba =",aprueba.value);

// socket1.emit("vote2",rechaza.value);
// rechaza.value="";

rechaza.addEventListener('click', ()=>{
    //const rechaza = document.querySelector("#rechaza");
    // socket1.emit("vote1",aprueba.value );
    // aprueba.value="";

    socket1.emit("vote2",rechaza.value );
    rechaza.value="";
    //console.log("rechaza =",rechaza.value);
});


//escuchar el evento que emite el servidor
// if (aprueba){
    socket1.on("vote1", ({user, voto1})=>{
        const resultado_votacion = document.createRange().createContextualFragment
        (`
        <div class="votes">
            <div class="votes-list">
                <div class="vote-info">
                    <span class="username">${user}</span>
                    <span class="vote">${voto1}</span>
                </div>
            </div>
        </div>
        `);
        statical.append(resultado_votacion);
    }) 
// } else {
    socket1.on("vote2", ({user, voto2})=>{
        const resultado_votacion = document.createRange().createContextualFragment
        (`
        <div class="votes">
            <div class="votes-list">
                <div class="vote-info">
                    <span class="username">${user}</span>
                    <span class="vote">${voto2}</span>
                </div>
            </div>
        </div>
        `);
        statical.append(resultado_votacion);
    }) 
// }
