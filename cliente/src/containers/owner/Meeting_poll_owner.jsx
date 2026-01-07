import React, { useState, useEffect, useContext, useRef } from "react";
import { io } from "socket.io-client";
import { UserContext } from "../../components/UserContext";
import AppContext from '../../context/AppContext';


const PollManage = () => {

  const { apiUrl } = useContext(AppContext);

  const socket3 = io(`${apiUrl}`, {
    withCredentials: true,
    transports: ["websocket"]
  });

    const [decisionText, setDecisionText] = useState("Propuesta de ejemplo para ser votada.");
    const [displayTime, setDisplayTime] = useState("00:00");
    const { setVotingEnabled } = useContext(UserContext);
    let flag = false;
  
    useEffect(() => {
      socket3.on('receive-decision', (text) => {
        setDecisionText(text);
      });

      socket3.on('update-cronometer', ({ time }) => {
        if (!flag) {
          setVotingEnabled(true);
          setDisplayTime(time); // Necesitas un estado displayTime
          flag = true;
          return;
          } 
      });

      socket3.on('end-cronometer', () => {
        alert("Tiempo terminado");
        setVotingEnabled(false);
    });  
    

      // Limpieza para evitar múltiples listeners
      return () => {
        socket3.off('receive-decision');
        socket3.off('update-cronometer');
        socket3.off('end-cronometer');
      };
    }, []);

    return (
        <div className="meeting__polling">
            <div className="meeting__polling--cronometer">
              <h3>Cronometro: {displayTime}</h3>
              {/* {votingEnabled ? (
                <p>Opciones habilitadas</p>
              ) : (
                <p>Esperando inicio del cronómetro o ya terminó.</p>
              )} */}

            </div>
            <div className="meeting__poll--summary">
              <h2>Resultados Votación</h2>
                  <canvas id="results" width="300" height="200"></canvas>
                  <div id="statical" hidden></div>
            </div>
        </div>
    );
};
export default PollManage;