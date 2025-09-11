import React, { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../../components/UserContext";
import { io } from "socket.io-client";
import { startBroadcasting, stopLocalStream, 
  listenForAnswers,
  joinStreamAsAdmin,
  getAdmin
 } from "../../hooks/webrtc-manager";

const socket10 = io("https://localhost:3000", {
  withCredentials: true,
});

// const script = document.createElement("script");
// script.src = "https://cdn.metered.ca/sdk/frame/1.4.3/sdk-frame.min.js";
// document.body.appendChild(script);

const VideoGeneral = () => {

  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const localRef = useRef();
  const remoteRef = useRef();
  const { email } = useContext(UserContext);
  const roomId="main-room";

  const ownerInfo = JSON.parse(localStorage.getItem("ownerInfo"));

  useEffect(() => {
    const fetchAdmin = async () => {
    const admin = await getAdmin(roomId);
    // console.log("Admin",admin);

    // if (remoteRef.current) {
    //   remoteRef.current.srcObject = new MediaStream();
    // }

    if (admin) {
      // console.log(`email ${ownerInfo.email}, adminId: ${admin}, roomId: ${roomId}`);
      joinStreamAsAdmin(roomId, ownerInfo.email, admin, remoteRef.current);
    }
      };
    fetchAdmin();
  },[remoteRef.current?.srcObject]);


    const openBroadcasting = async () => {
      try {
        // 1. Obtener stream local
        await startBroadcasting(roomId, email, localRef.current);
        //Funcion que escucha las respuestas 

        await listenForAnswers(email);

        setIsBroadcasting(true);

      } catch (error) {
        console.error("Error al iniciar llamada:", error);
      }
    };
  
    const hangUpBroadcasting = async () => {
      try {
        stopLocalStream(email, localRef.current);
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
        
        <div className="flex gap-4 mb-4">
          <video ref={localRef} autoPlay playsInline muted className="rounded border"></video>
        </div>

        <h3 className="text-lg font-medium mb-2">Intervencion de copropietario</h3>

        <div className="flex gap-4 mb-4">
          <video ref={remoteRef} autoPlay playsInline muted className="rounded border"></video>
        </div>

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
        
      </div>
    </div>
    )
};

export default VideoGeneral;