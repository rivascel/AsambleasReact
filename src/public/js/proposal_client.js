const socket8 = io();
const recDecision = document.querySelector('#decision');

// Escuchar cuando se envie la decision
    socket8.on('receive-decision',  (data)  => {
        const decisionVar = document.createRange().createContextualFragment
            (`
            ${data}
            `);
        recDecision.append(decisionVar);
    });    

