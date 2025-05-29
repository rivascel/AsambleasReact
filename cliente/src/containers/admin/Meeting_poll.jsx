import React, { useState, useEffect, useContext,useRef } from "react";
import { io } from "socket.io-client";
import { UserContext } from "../../components/UserContext";

const socket3 = io("http://localhost:3000", {
  withCredentials: true,
});

const PollingManage = () => {

    const intervalo = useRef(null);

    const [finalMinute, setFinalMinute] = useState(0);
    const [displayTime, setDisplayTime] = useState("00:00");
    const { setVotingEnabled } = useContext(UserContext);

    const initCronometer = () => {
        let minute = 0;
        let second = 0;
        setDisplayTime("00:00");

        socket3.emit('start-cronometer', { 
            time: `${minute}:00` 
        });

        intervalo.current = setInterval(()=>{
        second++;
        if (second === 60) {
            minute++;
            second = 0;
        }

        if (minute >= finalMinute) {
            parar();
            alert("El tiempo terminó");

            socket3.emit('end-cronometer');
        }

        const sAux = second < 10 ? "0" + second : second;
        const mAux = minute < 10 ? "0" + minute : minute;

        // Actualizar el cronómetro
        const time = mAux + ":" + sAux;
        setDisplayTime(time);

        // Enviar el cronómetro actualizado a los clientes
        socket3.emit('update-cronometer', { time });

        function parar() {
            if (intervalo.current) {
                clearInterval(intervalo.current);
                intervalo.current= null;
            }
        }
        }, 100);
    };
    return (
        <div className="bg-white p-4 rounded shadow-md space-y-4">
            <div className="meeting__polling--cronometer">
                <h3>Ingreso los minutos para votar:</h3>
                <input 
                   type="number" 
                   name="minuto" 
                   value={finalMinute}
                   onChange={(e) => setFinalMinute(parseInt(e.target.value))}
                />

                <h3>Cronómetro actual: {displayTime}</h3>
                <button 
                    onClick={initCronometer}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                        Inicie cronometro
                </button>
            </div>
            <div className="meeting__polling--summary">
                <h2>Resultados Votación</h2>
                    <canvas id="results" width="300" height="200"></canvas>
                    <div id="statical" hidden></div>
                    <button type="button" 
                    id="calculo">Conteo</button>
                    <button type="button" 
                    id="ocultar">Ocultar</button>
            </div>
        </div>
    );
};
export default PollingManage;