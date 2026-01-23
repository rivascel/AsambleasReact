import React, { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../../components/UserContext";
import { io } from "socket.io-client";
import { startBroadcasting, stopLocalStream, 
  listenForAnswers,
  joinStreamAsAdmin,
  getAdmin,
  listenForApprovals,
  // handleSignal
 } from "../../hooks/webrtc-manager";
import { getViewerStreaming

 } from '../../supabase-client';
 import AppContext from '../../context/AppContext';

const VideoGeneral = () => {
// const API_URL = import.meta.env.VITE_API_URL;
  const { apiUrl } = useContext(AppContext);

  const socket10 = io(`${apiUrl}`, {
    withCredentials: true,
    transports: ["websocket"]
  });

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
  const [userId, setUserId] = useState(null);
  
  // sessionId = `${roomId}:${adminId}:${viewerId}`

  // let userStreaming = null;

  const ownerInfo = JSON.parse(localStorage.getItem("ownerInfo"));

  socket10.on("request-stream-approved", (viewer, roomId)=>{
    console.log(`un nuevo viewer ${viewer} en el cuarto ${roomId}`);
    // setUserId(viewer);
  });

  socket10.on("stream-ready-user", async (userId, roomId)=>{
    console.log(`El usuario ${userId} comenzó transmisión en ${roomId}`);
    setUserId(userId);
  });


  // Corresponde cuando el admin escucha las transmisiones de los viewers aprobados
  useEffect(() => {
    if (!roomId) return;
    let suscribe;

    const init = async () => {
      try{
        let admin = email;
        console.log("Admin para escuchar transmisiones:", admin);

        const exists = listenForApprovals(roomId, email);
        if (exists) {
          setRemote(true);
        } else {
          return;
        };

        const userStreaming = await getViewerStreaming(userId);
        if (userStreaming) {
          await joinStreamAsAdmin(roomId, admin /*, viewerId,*/, remoteRef.current);
          console.log("✅ Admin listo para recibir streams y 👂 Escuchando transmisiones de viewers aprobados");
        };
      } catch (error) {
        console.error("❌ Error inicializando listener de señales:", error);
      }
      return () => {
        suscribe=false;
      }
    }
    init();

  },[roomId, userId]);
  
  //Este inicia transmisión del admin y escucha respuestas
  useEffect(() => {
      
    const init = async () => {

      if (stream && localRef.current /*&& userStreaming*/) {
        //en esta funcion llama a receiving stream
        await startBroadcasting(roomId, email, localRef.current);
        const admin = await getAdmin(roomId);

        socket10.emit("admin-ready", admin, roomId);

        console.log("email del admin:", email);
        const subscription = listenForAnswers(email);
        
        
        return () => {
            unsubscribe?.();
          if (subscription.unsubscribe) {
            console.log("🧹 Cancelando suscripción answers de:", email);
            subscription.unsubscribe();
          }
        };
      }

    };

    init();
  }, [stream]);

  const openBroadcasting = async () => {
      try {
        // 1. Obtener stream local
        setStream(true);
        setIsBroadcasting(true);

      } catch (error) {
        console.error("Error al iniciar llamada:", error);
      }
    };
  
    const hangUpBroadcasting = async () => {
      try {
        setStream(false);
        stopLocalStream(localRef.current);
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