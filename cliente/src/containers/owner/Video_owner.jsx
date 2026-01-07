import React, { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../../components/UserContext";
import { io } from "socket.io-client";
import { getAdmin, joinStreamAsViewer, startLocalStream,
  stopLocalStream, 
  listenForAnswers,
  
     } from '../../hooks/webrtc-client';
import { listenToSignalsFromAdmin, listenToSignals, registerViewer, getAdminStreaming,
          listenToRequests
 } from '../../supabase-client';
import AppContext from '../../context/AppContext';



const VideoGeneral = () => {

  const { apiUrl } = useContext(AppContext);

  const socket11 = io(`${apiUrl}`, {
    withCredentials: true,
    transports: ["websocket"]
  });


  const localRef = useRef();
  const remoteRef = useRef();
  const hasSubscribed = useRef(false);
  const roomId = 'main-room';
  const { email, ownerData, login, checkApprove } = useContext(UserContext);
  const [adminId, setAdminId] = useState(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const ownerInfo = JSON.parse(localStorage.getItem("ownerInfo"));

  socket11.emit("request-stream", email, roomId);

  useEffect(() => {
    // 1️⃣ Validación temprana
    if (!email || !roomId || !ownerInfo?.email) {
      console.warn("Esperando datos para fetch...");
      return;
    }
    
    // setViewerReady(checkApprove); // sincroniza con el contexto
    
    const fetchData = async () => {
      const admin = await getAdmin(roomId);
      try {
        const response = await fetch(`${apiUrl}/api/recover-users-id`, { 
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ roomId: "main-room", userId: email })
        });

        if (!response.ok) throw new Error(`Error ${response.status}`);

        const userData = await response.json();
        const userById = userData.approvedUsersById || [];

        const { unsuscribeChannel } = listenToRequests(roomId, {componentId: 'VideoGeneral'}, (approver) => {
          
          if (approver.status === 'approved') {
            console.log("Viewer aprobado via listener:", approver.user_id);
            if (!viewerReady) setViewerReady(true);
          }
          // unsuscribeChannel().unsubscribe();
        });

        if (userById.includes(email)) {
          console.log("Usuario aprobado para enviar stream...");
          // if (!viewerReady) setViewerReady(true);
        } else {
          console.log("Usuario aun no aprobado");
          // if (viewerReady) setViewerReady(false);
        };

      } catch (error) {
        console.error("Error fetching user", error);
      }
    };
    fetchData();
    
  },[checkApprove, roomId, email, ownerInfo]);


//Corresponde cuando el viewer recibe la trasmision del admin
  useEffect(() => {
    let subscribe=true;
     
    const init= async () => {
      if (!ownerInfo?.email|| !roomId) return

      const admin = await getAdmin(roomId);
      await registerViewer(roomId,email);
      const isStreaming = await getAdminStreaming(roomId);

      if (isStreaming) {
        await joinStreamAsViewer(roomId, ownerInfo.email, admin, remoteRef.current);
      }; 

      socket11.on("stream-ready", async ()=>{
        if (!subscribe) return;
        console.log(`El admin comenzó transmisión`);
        // windows.alert("El administrador ha iniciado la transmisión.");
      });
    };
    init();
    return () => {
      subscribe = false;
    }
    
  },[roomId, ownerInfo?.email]);

    useEffect(() => {
      //  if (!userId) return;
  
      const init = () => {
        const subscription = listenForAnswers(email);
        return () => {
          if (subscription.unsubscribe) {
            console.log("🧹 Cancelando suscripción answers desde el cliente:", email);
            subscription.unsubscribe();
          }
        };
      }
      init();
    }, [roomId, email]);
  


  const openCall = async () => {
    try {
      await startLocalStream(roomId, ownerInfo.email, localRef.current);
      socket11.emit("user-ready", ownerInfo.email, roomId);
      // await listenForAnswers(ownerInfo.email); 

      
      setIsAllowed(true);
    } catch (error) {
        console.error("Error al iniciar llamada:", error);
    }
  }

  const closeCall = () => {
    stopLocalStream(localRef.current);
    setIsAllowed(false);
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