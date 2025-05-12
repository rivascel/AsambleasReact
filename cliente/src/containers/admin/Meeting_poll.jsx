import React, { useState } from "react";


const PollManage = () => {
    const [decisionText, setDecisionText] = useState("Propuesta de ejemplo para ser votada.");
    const [minutes, setMinutes] = useState(0);

    return (
        <div class="meeting__poll">
                <div className="meeting__poll--decision">
                    <h2>Votación puntos de la agenda</h2>
                    <h3>Decisión a ser votada</h3>
                    <textarea id="decision" value={setDecisionText} rows={4}>Aprueba el punto 1 de la agenda</textarea>
                    <button type="button" id="activeBtn" class="btn 
                    secondary">Activar pregunta votación</button>  
                </div>
                <div class="meeting__poll--cronometer">
                    <div id="hms"></div>
                    <h3>Ingreso los minutos para votar:</h3>
                    <input type="number" id="minute" name="minuto" class="crono" value={setMinutes}/>
                    <button type="button" id="startBtn" class="btn 
                    secondary" className="crono">Inicie cronometro</button>
                </div>
                <div class="meeting__poll--summary">
                    <h2>Resultados Votación</h2>
                        <canvas id="results" width="300" height="200"></canvas>
                        <div id="statical" hidden></div>
                        <button type="button" class="btn primary"
                        id="calculo">Conteo</button>
                        <button type="button" class="btn primary"
                        id="ocultar">Ocultar</button>
                </div>
            </div>
    );
};
export default PollManage;