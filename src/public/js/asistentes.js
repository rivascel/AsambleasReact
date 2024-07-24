const socket3 = io();

const allAssistants = document.querySelector("#all-assistants");

socket.on("updateUserList", (users)=>{

    const assistantList = document.createRange().createContextualFragment
    (`
    <div class="assistants">
        <div class="assistants-body">
            <div class="user-info">
                <span class="username">
                    <li>
                    ${
                        users.forEach(user => {
                            user;
                        })
                    }
                    </li>
                </span>
                <span class="time">Hace 1 segundo</span>
            </div>
        </div>
    </div>
    `);

    allAssistants.append(assistantList);
});