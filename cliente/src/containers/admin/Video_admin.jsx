import React, { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../../components/UserContext";
import { io } from "socket.io-client";
import { startBroadcasting, stopLocalStream, 
  listenForAnswers,
  joinStreamAsAdmin,
  getAdmin,
  listenForApprovals
 } from "../../hooks/webrtc-manager";
import { listenToApprovals, listenToSignals } from '../../supabase-client';

const socket10 = io("https://localhost:3000", {
  withCredentials: true,
});

const VideoGeneral = () => {

  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const localRef = useRef();
  const remoteRef = useRef();
  const channelRef = useRef(null);
  const { email } = useContext(UserContext);
  const [stream, setStream] = useState(false);
  const [listen, setListen]=useState(false);
  const roomId="main-room";
  const listeningRef = useRef(false);
  const [remote, setRemote] = useState(false);

  const ownerInfo = JSON.parse(localStorage.getItem("ownerInfo"));
  let admin;


  // Corresponde cuando el admin escucha las transmisiones de los viewers aprobados
  useEffect(() => {
    if (!roomId) return;
    let channel;

    const init = async () => {
      try{
        let admin = email;
        console.log("Admin para escuchar transmisiones:", admin);

        const exists = await listenForApprovals(roomId);
        if (exists) {
          setRemote(true);
        };
        await joinStreamAsAdmin(roomId, admin /*, viewerId,*/, remoteRef.current);
        console.log("✅ Admin listo para recibir streams y 👂 Escuchando transmisiones de viewers aprobados");

        // channel = listenToSignals(admin, async (signal) => {
        // }
        //   // console.log("📩 Señal recibida completa:", signal);

        //   if (signal.type === "offer") {
        //     console.log("Oferta recibida de viewer aprobado:", signal.from_user);
        //     let viewerId = signal.from_user;
        //     if (admin) {
        //       if (!remoteRef.current) {
        //         console.warn("remoteRef.current todavía NO está listo");
        //         return;
        //       }
        //       // console.log(`email ${ownerInfo.email}, adminId: ${admin}, roomId: ${roomId}`);
        //       await listenForApprovals(roomId);
        //       await joinStreamAsAdmin(roomId, admin, viewerId, remoteRef.current);
        //       console.log("✅ Admin listo para recibir streams y 👂 Escuchando transmisiones de viewers aprobados");
        //     }
        //   }

        //   if (signal.type === "answer") {
        //     console.log("💬 Respuesta (answer) recibida:", signal.payload);
        //   }

        //   if (signal.type === "ice-candidate") {
        //     console.log("❄️ ICE Candidate recibido:", signal.payload);
        //   }

        // });  

        } catch (error) {
        console.error("❌ Error inicializando listener de señales:", error);
        }
      }
      init();
      return () => {
      if (channel) {
        console.log("🧹 Cerrando canal de señales de admin");
        if (channel) channel.unsubscribe();
      }
    };
  },[roomId, email]);
  
  useEffect(() => {
      
    const init = async () => {
      admin = await getAdmin(roomId);
      console.log("email del admin:", email);

      if (stream && localRef.current) {
        await startBroadcasting(roomId, email, localRef.current);
        listenForAnswers(admin);
      }
    };

    init();
  }, [stream]);

  
  useEffect( () => {
    
    if (!admin) return;

    // Evita múltiples listeners
    if (listeningRef.current) return;
    listeningRef.current = true;

    const init = async () => {
      admin = getAdmin(roomId);
      console.log("email del admin:", email);

      console.log("👂 Iniciando listener global de respuestas para admin:", admin);

      // const subscription = 
      listenForAnswers(admin);

      return () => {
        // console.log("🧹 Limpiando listener de respuestas");
        // if (subscription && subscription.unsubscribe) {
        //   subscription.unsubscribe();
        // }
        listeningRef.current = false;
      };
    }
    init();
  }, [admin]);


    const openBroadcasting = async () => {
      try {
        // 1. Obtener stream local
        // await startBroadcasting(roomId, email, localRef.current);
        //Funcion que escucha las respuestas 
        setStream(true);

        // await listenForAnswers(admin);

        setIsBroadcasting(true);

      } catch (error) {
        console.error("Error al iniciar llamada:", error);
      }
    };
  
    const hangUpBroadcasting = async () => {
      try {
        setStream(false);
        stopLocalStream(localRef.current, admin);
        setIsBroadcasting(false);
      } catch (error) {
        console.error("Error al colgar llamada:", error);
      }
    };
  
  return (
    <div className="space-y-6">
  {/* 

      {/* Transmisión en vivo */}
      <div className="bg-white p-4 rounded shadow-md">

        <h3 className="text-lg font-medium mb-2">Transmisión de Asamblea</h3>
        
        {stream ? (
          <>
            <div className="flex gap-4 mb-4">
              <video ref={localRef} autoPlay playsInline muted className="rounded border"></video>
            </div>
          </>
          
          ):(
            <>
            <p className="text-red-600 font-medium mb-4">No hay transmisión en vivo en este momento.</p>
            </>
          )
        }

        <div className="controls">
          {!isBroadcasting ? (
            <button
              onClick={openBroadcasting}
              className="bg-blue-600 text-blue px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Iniciar transmisión
            </button> 
            ):(
            <button
              onClick={hangUpBroadcasting}
              className="bg-red-600 text-blue px-6 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              Detener transmisión
            </button>  
            )
          }
        </div>

        <h3 className="text-lg font-medium mb-2">Intervencion de copropietario</h3>
      
      {
        remote ? (
          <div className="flex gap-4 mb-4">
          <video ref={remoteRef} autoPlay playsInline muted className="rounded border"></video>
        </div>
        ):(
          <p className="text-red-600 font-medium mb-4">No hay intervencion en este momento.</p>
        )
      }

        
        
      </div>
    </div>
    )
    
};

export default VideoGeneral;