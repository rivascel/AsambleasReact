var table = document.getElementsByClassName('registerApt');
var agregaVoto = document.getElementById('admin');
 
var intApar = [];
intApar.push({
    interior: 1,
    apartamento: 201,
    decision: "Renovar",
    voto:"Si"
});
intApar.push({
    interior: 2,
    apartamento: 301,
    decision: "Renovar",
    voto:"No"
});
intApar.push({
    interior: 4,
    apartamento: 401,
    decision: "Modificar",
    voto:"Si"
});
intApar.push({
    interior: 5,
    apartamento: 601,
    decision: "Modificar",
    voto:"No"
});
intApar.push({
    interior: 1,
    apartamento: 201,
    decision: "Modificar",
    voto:"Si"
});
var tabla = document.getElementById('lista');
var boton = document.getElementById("agregar");
var guardar = document.getElementById("guardar");
var data =[];
//boton.addEventListener("click",agregar);
//guardar.addEventListener("click",save);
function agregar(){
    var interior = document.getElementById('interior').value;
    var apartamento = document.getElementById('apartamento').value;
    var decision = document.getElementsByClassName("show").value;
    var voto = document.getElementsByClassName("primary-button").value;
    /* data.push({
        "interior":interior,
        "apartamento":apartamento,
        "decision": decision,
        "voto":voto
    }); */
    var fila = '<tr><td>'+interior+'</td>'
    '<td>'+apartamento+'</td>'
    '<td>'+decision+'</td>'
    '<td>'+voto+'</td></tr>';
/* $('#lista').append(fila);
$('#interior').val('');
$('#apartamento').val(''); */
tabla.appendChild(fila);
/* interior.val('');
apartamento.val(''); */

    
}


/* function save(){

} */