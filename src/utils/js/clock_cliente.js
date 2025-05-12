const socket11 = io();

const cronometro = document.querySelector(".cronometro");

// Escuchar cuando se envie la decision

let flag = null;

socket11.on('start-cronometer',  (aprueba, rechaza, blanco, data)  => {
    flag=true;
    if (flag) {
        // initCrono.textContent=data.time;

        document.querySelector('#aprueba').disabled = aprueba;
        document.querySelector('#rechaza').disabled = rechaza;
        document.querySelector('#blanco').disabled = blanco;

        cronometer(data.time);
    }

});    

socket11.on('update-cronometer',  (data)  => {
    // document.querySelector('#hms').textContent = data.time;

    if (flag) {
        cronometer(data.time);    
    }
});  

socket11.on('end-cronometer', () => {

    if (flag){
        // Deshabilitar opciones al terminar el cronómetro
        document.querySelector('#aprueba').disabled = true;
        document.querySelector('#rechaza').disabled = true;
        document.querySelector('#blanco').disabled = true;

        alert("El tiempo para votar ha finalizado.");

        // cronometro.setAttribute('hidden');
        cronometro.hidden = true;
        flag=false;

    }
});


function cronometer(data){
    // Si recibe evento de inicio y actualización del cronómetro
    cronometro.innerHTML = "";
        cronometro.hidden = false;
        const counting = document.createRange().createContextualFragment(`
            <div id="hms">
                <span class="username">${data}</span>
                <img src="../assets/img/hand-up.png" alt="" class="logo">
            </div>
        `);
        cronometro.append(counting);
};