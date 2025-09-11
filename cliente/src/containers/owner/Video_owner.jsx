import React, { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../../components/UserContext";
import { io } from "socket.io-client";
import { getAdmin, joinStreamAsViewer, startLocalStream,
  stopLocalStream, 
  listenForAnswers
     } from '../../hooks/webrtc-client';

const socket11 = io("https://localhost:3000", {
  withCredentials: true,
});

const VideoGeneral = () => {
  const localRef = useRef();
  const remoteRef = useRef();
  const roomId = 'main-room';
  const { email, ownerData, login } = useContext(UserContext);
  const [adminId, setAdminId] = useState(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const adminRef = useRef();
  const username = email;
  
  const ownerInfo = JSON.parse(localStorage.getItem("ownerInfo"));
  //   if (ownerInfo) {
  //   // console.log("Email del usuario:", ownerInfo.email);
  // }

  useEffect(() => {
    const fetchAdmin = async () => {
    const admin = await getAdmin(roomId);
    // console.log("Admin",admin);
    setAdminId(admin);

    // if (remoteRef.current) {
    //   remoteRef.current.srcObject = new MediaStream();
    // }

    if (admin) {
      // console.log(`email ${ownerInfo.email}, adminId: ${admin}, roomId: ${roomId}`);
      joinStreamAsViewer(roomId, ownerInfo.email, admin, remoteRef.current);
    }
     };
    fetchAdmin();
   
  },[remoteRef.current?.srcObject]);

  const openCall = async () => {
    try {
      const adminId = await getAdmin(roomId);
      await startLocalStream(roomId, ownerInfo.email, localRef.current);
      // await createOfferToAdmin(roomId, ownerInfo.email, pc);
      listenForAnswers(ownerInfo.email); 
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
      </div>
    </div>
    )
};

export default VideoGeneral;