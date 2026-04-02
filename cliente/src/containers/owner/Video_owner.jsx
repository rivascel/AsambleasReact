import React, { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../../components/UserContext";
import { io } from "socket.io-client";
import { getAdmin, joinStreamAsViewer, startLocalStream, stopLocalStream } from '../../hooks/webrtc-client';
import { registerViewer, listenToRequests, listenToSignals, offStreaming } from '../../supabase-client';
import { handleSignal } from '../../hooks/handleSignal';
import AppContext from '../../context/AppContext';

const VideoGeneral = () => {
// const API_URL = import.meta.env.VITE_API_URL;
  const { apiUrl } = useContext(AppContext);

  const socketRef = useRef(null);
  const localRef = useRef();
  const remoteRef = useRef();
  const roomId = 'main-room';
  const { email, ownerData, login, checkApprove } = useContext(UserContext);
  const [isAllowed, setIsAllowed] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const ownerInfo = JSON.parse(localStorage.getItem("ownerInfo"));

  socketRef.current = io(`${apiUrl}`, {
    withCredentials: true,
    transports: ["websocket"]
  });

  useEffect(() => {
    let unsuscribeChannel;
    // 1️⃣ Validación temprana
    if (!email || !roomId || !ownerInfo?.email) {
      console.warn("Esperando datos para fetch...");
      return;
    }
    
    // setViewerReady(checkApprove); // sincroniza con el contexto
    
    const fetchData = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/recover-users-id`, { 
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ roomId: "main-room", userId: email })
        });

        if (!response.ok) throw new Error(`Error ${response.status}`);

        const userData = await response.json();
        const userById = userData.approvedUsersById || [];

        unsuscribeChannel  = listenToRequests(roomId, {componentId: 'VideoGeneral'}, (approver) => {
          
          if (approver.status === 'approved') {
            // console.log("Viewer aprobado via listener:", approver.user_id);
            if (!viewerReady) setViewerReady(true);
          }
        });

        if (userById.includes(email)) {
          console.log("Usuario aprobado para enviar stream...");
          if (!viewerReady) setViewerReady(true);
        } else {
          console.log("Usuario aun no aprobado");
        };

      } catch (error) {
        console.error("Error fetching user", error);
      }
    };
    fetchData();
    return () => {
      if (unsuscribeChannel) unsuscribeChannel.removeChannel();
    }
    
  },[checkApprove, roomId, email, ownerInfo]);


  useEffect(() => {
    let subscribe;

    //Recibe mensaje de que el usuario fue cancelado para transmitir por el admin y bloquea opción para transmitir
    socketRef.current.on("canceled", async ({ userId, roomId })=>{
      console.log(`viewer cancelado ${userId} en el cuarto ${roomId} para transmitir`);
      setViewerReady(false);
    });

    //2. Escucha todas las señales enviadas por el admin 
    const init= async () => {
      if (!ownerInfo?.email || !roomId) return;

      subscribe = listenToSignals(  
        email,
        async ({ type, payload, from_user, to_user, room_id }) => {

          if (to_user !== email) return;
              await handleSignal({ type, payload, from_user, to_user, room_id }, 'viewer');
              console.log(`tipo de señal ${type} de`, from_user);
        }
      );

      await registerViewer(roomId,email);
      
      socketRef.current.emit("request-stream", { userId: email, roomId });

    };
    init();

    socketRef.current.on("stream-ready", async ()=>{
      console.log(`El admin comenzó transmisión`);
      // windows.alert("El administrador ha iniciado la transmisión.");
      const admin =await  getAdmin(roomId);
      await joinStreamAsViewer
      (
        roomId, 
        ownerInfo.email, 
        admin, 
        remoteRef.current
      );
    });

    return () => {
      socketRef.current.off("stream-ready");
      socketRef.current.off("canceled");
      if (subscribe) subscribe.removeChannel();
      
    }
    
  },[roomId, email]);


  const openCall = async () => {
    try {
      await startLocalStream(roomId, ownerInfo.email, localRef.current);
      socketRef.current.emit("user-ready", ownerInfo.email, roomId);

      setIsAllowed(true);
    } catch (error) {
        console.error("Error al iniciar llamada:", error);
    }
    return () => {
      socketRef.current.disconnect();
    }
  }

  const closeCall = () => {
    stopLocalStream(localRef.current);
    setIsAllowed(false);
    offStreaming(email);
    // if (viewerReady) setViewerReady(false);
  }

  return (
    <div className="space-y-6">
      {/* Transmisión en vivo */}
      <div className="bg-white p-4 rounded shadow-md">

        <h2 className="text-xl font-semibold mb-2">Asamblea en vivo</h2>
        <video ref={remoteRef} autoPlay playsInline className="w-full rounded border"
        ></video>

        <h2 className="text-xl font-semibold mb-2">Intervención del copropietario</h2>
        {viewerReady ? (
          <>
            <video ref={localRef} autoPlay playsInline className="w-full rounded border"
            ></video>

            <div className="controls">
              {!isAllowed ? (
                <button
                  onClick={openCall}
                  className="bg-blue-600 text-blue px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Iniciar llamada
                </button> 
                ):(
                <button
                  onClick={closeCall}
                  className="bg-red-600 text-blue px-6 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                >
                  Detener llamada
                </button>  
                )
              }
            </div>
          </>
        ):(
          <p>No hay petición de intervención</p>
        )

        }

      </div>
    </div>
    )
};

export default VideoGeneral;