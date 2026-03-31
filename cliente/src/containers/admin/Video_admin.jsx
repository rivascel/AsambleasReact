import React, { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../../components/UserContext";
import { io } from "socket.io-client";
import { startBroadcasting, stopLocalStream, joinStreamAsAdmin,listenForApprovals,createOfferToViewer,getLocalStream
 } from "../../hooks/webrtc-manager";
import { listenToSignals, getActiveAdmin } from '../../supabase-client';
 import { handleSignal } from '../../hooks/handleSignal';
 import AppContext from '../../context/AppContext';

 

const VideoGeneral = () => {
  const { apiUrl } = useContext(AppContext);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const localRef = useRef();
  const socketRef = useRef(null);
  const remoteRef = useRef();
  const { email } = useContext(UserContext);
  const [stream, setStream] = useState(false);
  const roomId="main-room";
  const [remote, setRemote] = useState(false);
  // const [userId, setUserId] = useState(null);
  
  const ownerInfo = JSON.parse(localStorage.getItem("ownerInfo"));

  socketRef.current = io(`${apiUrl}`, {
    withCredentials: true,
    transports: ["websocket"]
  });

  useEffect(() => {
    if (!roomId) return;
    let subscribe;

    // socketRef.current.on("approved", async ({ userId, roomId })=>{
      // console.log(`un nuevo viewer aprobado ${userId} en el cuarto ${roomId}`);

      // const admin = await getActiveAdmin(roomId);
      
    // });

    //1. Escucha cuando un viewer inicia transmisión previa aprobación del Admin
    socketRef.current.on("stream-ready-user", async ()=>{
      console.log(`El usuario comenzó transmisión`);
      await joinStreamAsAdmin
      (
        roomId, 
        email, 
        remoteRef.current
      );
    });

    //2. Función que escucha si existe una aprobación de viewer para activar pantalla y escucha todas las señales
    const init = async () => {
      // let admin = email;
      const exists = listenForApprovals(roomId);

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

    //3. recibe mensaje que existe nuevo viewer luego de iniciar transmisión y le crear oferta solo a él.
    socketRef.current.on("listen-user", async ({ userId, roomId })=>{
      const stream = getLocalStream();
      
      if (!stream) {
        console.log(`los siguientes usuarios estan conectados ${userId} pero no hay stream local para crear oferta`);
        return;
      }
      createOfferToViewer(roomId, email, stream);
    });

    return () => {
        socketRef.current.off("request-stream-approved");
        socketRef.current.off("listen-user");
        if (subscribe) subscribe.removeChannel();
        
      }

  },[roomId, email]);
  
  //Este inicia transmisión del admin e informa a los usuarios conectados
  useEffect(() => {
    const init = async () => {

      if (stream && localRef.current /*&& userStreaming*/) {
        await startBroadcasting(roomId, email, localRef.current);
        const admin = await getActiveAdmin(roomId);
        socketRef.current.emit("admin-ready", admin, roomId);
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