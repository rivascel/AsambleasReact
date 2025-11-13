import React, { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../../components/UserContext";
import { io } from "socket.io-client";
import { getAdmin, joinStreamAsViewer, startLocalStream,
  stopLocalStream, 
  listenForAnswers
     } from '../../hooks/webrtc-client';
import { listenToSignalsFromAdmin, listenToSignals } from '../../supabase-client';

const socket11 = io("https://localhost:3000", {
  withCredentials: true,
});

const VideoGeneral = () => {
const localRef = useRef();
  const remoteRef = useRef();
  const hasSubscribed = useRef(false);
  const roomId = 'main-room';
  const { email, ownerData, login, checkApprove } = useContext(UserContext);
  const [adminId, setAdminId] = useState(null);
  const [listen, setListen]=useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  // const [viewerReady, setViewerReady] = useState(checkApprove);
  const [viewerReady, setViewerReady] = useState(false);
  const [signalreceived, setSignalreceived] = useState(false);
  
  const ownerInfo = JSON.parse(localStorage.getItem("ownerInfo"));


  // let userId;
  // socket11.on("approve",userId => {
  //   console.log("Usuario aprobado:", userId);
  // });

  useEffect(() => {
    // 1️⃣ Validación temprana
    if (!email || !roomId || !ownerInfo?.email) {
      console.warn("Esperando datos para fetch...");
      return;
    }
    
    // setViewerReady(checkApprove); // sincroniza con el contexto
    
    const fetchData = async () => {
      const admin = await getAdmin(roomId);
      // setAdminId(admin);
      // console.log("Admin",admin);

      try {
        const response = await fetch("https://localhost:3000/api/recover-users-id", { 
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ roomId: "main-room", userId: email })
        });

        if (!response.ok) throw new Error(`Error ${response.status}`);

        const userData = await response.json();
        const userById = userData.approvedUsersById || [];

        if (userById.includes(email)) {
          console.log("Usuario aprobado para enviar stream...");
          if (!viewerReady) setViewerReady(true);
        } else {
          console.log("Usuario aun no aprobado");
          if (viewerReady) setViewerReady(false);
        };

      } catch (error) {
        console.error("Error fetching user", error);
      }
    };
    fetchData();
    
  },[checkApprove, roomId, email, ownerInfo]);


//Corresponde cuando el viewer recibe la trasmision del admin
  useEffect(() => {
    // 1️⃣ Validación temprana
    if (!ownerInfo?.email|| !roomId) {
      console.warn("Esperando datos para fetch...");
      return;
    }
    if (hasSubscribed.current) {
      console.log("✅ Suscripción ya establecida, no se repite.");
      return; // ✅ evita dobles suscripciones (estricto o re-render)
    }
    hasSubscribed.current = true;
     
    const init= async () => {
      const admin = await getAdmin(roomId);
      console.log("Viewer listo para recibir stream del admin:", ownerInfo.email);
        joinStreamAsViewer(roomId, ownerInfo.email, admin, remoteRef.current);
        // setSignalreceived(true);
        // setListen(true);
    };
    init();
        
  
  // const fetchData = async () => {
    // const channel = listenToSignals(ownerInfo.email, async (payload) => {
    //   if (payload.to_user === ownerInfo.email && payload?.type === "offer") {
    //     console.log("📡 Oferta recibida del admin:", payload);

    //     // const admin = await getAdmin(roomId);
    //     // joinStreamAsViewer(roomId, ownerInfo.email, admin, remoteRef.current);
    //     // setSignalreceived(true);
    //     // setListen(true);
        
    //   };
    // });
    //   return () => {
    //     // console.log("❌ Cancelando suscripción");
    //     channel?.unsubscribe?.();
    //   };
  // };
  // fetchData();
  },[roomId, email]);

  useEffect(()=>{

    listenForAnswers(ownerInfo.email); 

  },[roomId, email])



  const openCall = async () => {
    try {
      const adminId = await getAdmin(roomId);
      await startLocalStream(roomId, ownerInfo.email, localRef.current);
      // await createOfferToAdmin(roomId, ownerInfo.email, pc);
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