import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { io } from "socket.io-client";
import Ask from '../containers/owner/Ask';
import Chat from '../containers/Chat';
import Graph from '../containers/Graph';
import VideoOwner from '../containers/owner/Video_owner';
import MeetingPollOwner from '../containers/owner/Meeting_poll_owner';
import Questions from '../containers/owner/Questions';
import { UserContext } from "../components/UserContext";
import AppContext from '../context/AppContext';


const Section = ({ title, children }) => (
  <div className="bg-white p-4 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <div>{children}</div>
  </div>
);

const DashBoardOwner = () => {
  const { apiUrl } = useContext(AppContext);

  const socket5 = io(`${apiUrl}`, {
    withCredentials: true,
    transports: ["websocket"]
  });


  // const [email, setEmail] = useState(null);
  const [error, setError] = useState(null);
  // const [quorum, setQuorum] = useState(null);
  const [votesData, setVotesData] = useState({}); // lista de todos los propietarios
  const { email, login, setQuorum, setApprovalVotes, setRejectVotes, setBlankVotes } = useContext(UserContext);
  
    useEffect(() => {
    axios.get(`${apiUrl}/api/owner-data`, {
      withCredentials: true,
      })
      .then((res) => {
            // email;
            login(res.data.email); // ✅ Actualiza el contexto global
      })
      .catch((err) => {
        console.error(err);
        setError("No autorizado. Redirigiendo...");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      });
    }, []);

  useEffect(() => {
    if (!email) return;
    
    axios.post(`${apiUrl}/api/fileOwnerByEmail`, 
            { email },
            { withCredentials: true },
        )
        .then((response) => {

         // 3. Mapea los nombres del archivo a los que usa tu aplicación
            const ownerData = {
                email: response.data.owner.correo,  // "correo" en el archivo -> "email" en tu app
                interior: response.data.owner.interior,
                apartamento: response.data.owner.apto,  // "apto" en el archivo -> "apartamento" en tu app
                participacion: response.data.participacion,
                alias: response.data.owner.alias
            };

            // 3. Guarda los datos en el contexto
            login(email, ownerData); // Pasa los datos al login
          })
        .catch(error =>{
          console.error("Error", error);
        })
  }, [email]); 

  useEffect(() => {
    const handleUpdate = () => {
      fetchOwners();
    };

    socket5.on("updateConnectedUsers",  handleUpdate);
    return () => socket5.off("updateConnectedUsers", handleUpdate);
  }, [email]);      

  useEffect(() => {
    const handleUpdateVotes = (data) => {
        setApprovalVotes(data.approval);
        setRejectVotes(data.reject);
        setBlankVotes(data.blank);
    };

    socket5.on('send-votes', handleUpdateVotes);

    return () => {
        socket5.off('send-votes', handleUpdateVotes);
    };
}, [setApprovalVotes, setRejectVotes, setBlankVotes]);

   
  const fetchOwners = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/emailFile`, {
        withCredentials: true,
      });
      if (Array.isArray(response.data)) {
        setVotesData(response.data);
        calcularQuorum(response.data);
      } else {
        console.error("❌ El endpoint no devolvió un array.");
      }
    } catch (err) {
      console.error("Error al obtener todos los propietarios:", err);
    }
  };

  const calcularQuorum = (data) => {
    if (!data.length) return;

    const SumItems = data.reduce((acumulator, objeto) => acumulator + parseInt(objeto.participacion), 0);
      for (let i = 0; i < data.length; i++) {
          
        if (data[i].correo.trim() === email) {
            const quorumPercentage = (parseInt(data[i].participacion) / SumItems) * 100;
            // console.log("quorumPercentage",quorumPercentage);
            setQuorum(quorumPercentage); // Actualiza el estado del quorum
            break;
          }
         else {
          console.log(`No se encontró el correo: ${email}`);
        }
      }
  };
    if (error) return <p>{error}</p>;


  return (
    <>
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Bienvenido al panel del propietario</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Section title="Transmisión General">
            <VideoOwner />
          </Section>

          <Section title="Preguntas Recibidas">
            <Questions />
          </Section>

          <Section title="Pedir la Palabra">
            <Ask />
          </Section>

          <Section title="Votación">
            <MeetingPollOwner />
          </Section>

          <Section title="Chat">
            <Chat />
          </Section>

          <Section title="Gráficos">
            {/* <VoteUpdater /> */}
            <Graph />
          </Section>
        </div>
      </div>
    </>
  );

};

export default DashBoardOwner;