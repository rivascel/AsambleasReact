// ui.js

export function setupUI({ onCreate, onAsk, onJoin, onCamera, onHangup }) {
    document.querySelector('#createBtn')?.addEventListener('click', onCreate);
    document.querySelector('#ask')?.addEventListener('click', onAsk);
    document.querySelector('#cameraBtn')?.addEventListener('click', onCamera);
    document.querySelector('#hangupBtn')?.addEventListener('click', onHangup);

    document.querySelector('#all-users')?.addEventListener('click', (event) => {
        if (event.target && event.target.id === "joinBtn") {
            onJoin();
        }
    });
}

export function setRoomText(roomId) {
    document.querySelector('#currentRoom').innerText = `Current room is ${roomId} - You are the caller!`;
}

export function enableCameraButton(enabled = true) {
    const btn = document.querySelector('#cameraBtn');
    if (btn) btn.disabled = !enabled;
}

export function showAlert(message) {
    alert(message);
}

export function toggleButtonStates({ camera, join, create, hangup }) {
    const cameraBtn = document.querySelector('#cameraBtn');
    const joinBtn = document.querySelector('#joinBtn');
    const createBtn = document.querySelector('#createBtn');
    const hangupBtn = document.querySelector('#hangupBtn');

    if (cameraBtn) cameraBtn.disabled = !camera;
    if (joinBtn) joinBtn.disabled = !join;
    if (createBtn) createBtn.disabled = !create;
    if (hangupBtn) hangupBtn.disabled = !hangup;
}

// Escuchar evento del botón una sola vez
export function askingToJoin(currentUser){
    if (!currentUser) return; // Si no hay usuario actual, salir

    if (!currentAskUsers.includes(currentUser)) {
        currentAskUsers.push(currentUser);
        socket9.emit("wordUser", { user: currentUser, action: "add"} );
        document.querySelector('#ask').textContent = "Cancelar Palabra";
    } else {
        socket9.emit("wordUser", { user: currentUser, action: "remove" });

        document.querySelector('#ask').textContent = "Solicitud Palabra";
    }

    renderUsers();

}

export function answeringAdmin(currentUser){
    if (!currentUser) return; // Si no hay usuario actual, salir

    if (!currentAskUsers.includes(currentUser)) {
        currentAskUsers.push(currentUser);
        socket9.emit("wordUser", { user: currentUser, action: "add"} );
        document.querySelector('#ask').textContent = "Cancelar Palabra";
    } else {
        socket9.emit("wordUser", { user: currentUser, action: "remove" });

        document.querySelector('#ask').textContent = "Solicitud Palabra";
    }

    renderAdmin();

}

//Para el usuario
export function renderUsers(){
    const allUsers = document.querySelector("#all-users");
    // Si el usuario ya está en la lista, lo eliminamos y cambiamos el botón
    allUsers.innerHTML = "";
    currentAskUsers.forEach(user => {
        let safeUserId = user.replace(/[@.]/g, "_");
        const userElement = document.createRange().createContextualFragment(`
            <div class="users" id="user-${safeUserId}">
                <div class="users-body">
                    <div class="user-info">
                        <span class="username" data-user="${user}">${user}</span>
                        <img src="../assets/img/hand-up.png" alt="" class="logo">
                        
                    </div>
                </div>
            </div>
        `);
        allUsers.append(userElement);

        // const userAllow = document.querySelector(`#user-${safeUserId}.username`);
        // if (userAllow){
        //     userAllow.addEventListener("click", () => {
                
        //     });
        // }
    });
};

//Para el administrador
export function renderAdmin(){
    // Si el usuario ya está en la lista, lo eliminamos y cambiamos el botón
    allUsers.innerHTML = "";
    currentAskUsers.forEach(user => {
        let safeUserId = user.replace(/[@.]/g, "_");
        const userElement = document.createRange().createContextualFragment(`
            <div class="users" id="user-${safeUserId}">
                <div class="users-body">
                    <div class="user-info">
                        <span class="username" data-user="${user}">${user}</span>
                        <img src="../assets/img/hand-up.png" alt="" class="logo">
                        <button type="button" id="joinBtn" class="btn 
                        secondary">Unirse a sala</button>
                    </div>
                </div>
            </div>
        `);
        allUsers.append(userElement);

        // const userAllow = document.querySelector(`#user-${safeUserId}.username`);
        // if (userAllow){
        //     userAllow.addEventListener("click", () => {
                
        //     });
        // }
    });
};
