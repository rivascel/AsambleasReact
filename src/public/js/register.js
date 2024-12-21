const socket3 = io();

    const login = document.querySelector("#login");
    const user = document.querySelector("#username");


    login.addEventListener("click", ()=>{
        const userValue = user.value.trim();
        if (userValue != ""){
            document.cookie = `username=${userValue}`;
            // Emitir el valor del input al servidor cuando cambie
            socket3.emit("userUpdated", { value: userValue  });
            document.location.href="/owner";
            console.log("usuario ingresado", userValue)
        }
        else {
            alert("Escribe un nombre de usuario");
        };
        });
        


    

    