import React, { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../../components/UserContext";
import { io } from "socket.io-client";
import { startBroadcasting, stopLocalStream, 
  joinStreamAsAdmin,
  // getAdmin,
  listenForApprovals,
  createOfferToViewer,
  getLocalStream
 } from "../../hooks/webrtc-manager";
import { listenToSignals, getActiveAdmin

 } from '../../supabase-client';
 import { handleSignal } from '../../hooks/handleSignal';
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
  const [userId, setUserId] = useState(null);
  
  const ownerInfo = JSON.parse(localStorage.getItem("ownerInfo"));

  // Corresponde cuando el admin escucha las transmisiones de los viewers aprobados
  useEffect(() => {
    if (!roomId) return;
    let subscribe;
    let subscription;

    socket10.on("request-stream-approved", async (viewer, roomId)=>{
      console.log(`un nuevo viewer ${viewer} en el cuarto ${roomId}`);

      await joinStreamAsAdmin
      (
        roomId, 
        admin, 
        remoteRef.current
      );


    });
    //recibe la señal para conectar con el viewer aprobado y llama a la función para crear oferta
    socket10.on("listen-user", async (userId, roomId)=>{
      const stream = getLocalStream();
      
      if (!stream) {
        console.error("No hay stream activo para ",userId);
        return;
      }
      createOfferToViewer(roomId, email, stream);
    });

    const init = async () => {
    
      let admin = email;
      console.log("Admin para escuchar transmisiones:", admin);

      const exists = listenForApprovals(roomId, email);
      if (exists) {
        setRemote(true);
      } else {
        return;
      };

      subscribe = listenToSignals(  
        email,
        async ({ type, payload, from_user, to_user, room_id }) => {

          if (to_user !== email) return;
              await handleSignal({ type, payload, from_user, to_user, room_id }, 'admin');
              console.log(`tipo de señal ${type} de`, from_user);
        }
      )
    }
    init();
    return () => {
        socket10.off("request-stream-approved");
        socket10.off("listen-user");
        if (subscribe) subscribe.removeChannel();
        if (subscription) {
          console.log("🧹 Cancelando suscripción answers de:", email);
          subscription.removeChannel();
        }
      }

  },[roomId, userId]);
  
  //Este inicia transmisión del admin y escucha respuestas
  useEffect(() => {
    const init = async () => {

      if (stream && localRef.current /*&& userStreaming*/) {
        //en esta funcion llama a receiving stream
        await startBroadcasting(roomId, email, localRef.current);
        const admin = await getActiveAdmin(roomId);

        socket10.emit("admin-ready", admin, roomId);

        // console.log("email del admin:", email);
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
        offStreaming(email);
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