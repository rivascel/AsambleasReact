import React, { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../../components/UserContext";
import { io } from "socket.io-client";
import { startBroadcasting, stopLocalStream, 
  listenForAnswers,
  joinStreamAsAdmin,
  getAdmin,
  listenForApprovals,
  createOfferToViewer,
  // handleSignal
 } from "../../hooks/webrtc-manager";
import { listenToSignals, getAllViewersAndListen, subscribeToSignals, getViewerStreaming

 } from '../../supabase-client';
 import AppContext from '../../context/AppContext';



const VideoGeneral = () => {

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
  // const [newViewer, setNewViewer] = useState(null);
  const [userId, setUserId] = useState(null);
  

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
  
  useEffect(() => {
      
    const init = async () => {
      const admin = await getAdmin(roomId);
      console.log("email del admin:", email);

      if (stream && localRef.current) {
        await startBroadcasting(roomId, email, localRef.current);
        socket10.emit("admin-ready", admin, roomId);

        const subscription = listenForAnswers(email);
        console.log("👂 Escuchando ofertas y ices :", email );
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

  useEffect(() => {
     if (!userId) return;

    const init = () => {
      const subscription = listenForAnswers(email);
      return () => {
        if (subscription.unsubscribe) {
          console.log("🧹 Cancelando suscripción answers de:", email);
          subscription.unsubscribe();
        }
      };
    }
    init();
  }, [roomId, email]);


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