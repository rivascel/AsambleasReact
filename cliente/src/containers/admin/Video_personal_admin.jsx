import React, { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../../components/UserContext";
import { io } from "socket.io-client";
import { startLocalStream } from '../../hooks/webrtc-client';


const VideoPersonal = () => {
  const { email } = useContext(UserContext);
  const [isCallActive, setIsCallActive] = useState(false);
  const [remoteVideo, setRemoteVideo]=useState(false);
  const socketRef = useRef(null);


  useEffect(()=>{
  // Configurar Socket.io
    socketRef.current = io("https://localhost:3000", {
      withCredentials: true,
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  },[]);

  const openCall = async () => {
    try {
      // 1. Obtener stream local
      await initWebRTCAsCaller(socketRef);
      
      // 2. Crear conexión peer
      await startLocalStream();

      
      setIsCallActive(true);
    } catch (error) {
      console.error("Error al iniciar llamada:", error);
    }
  };

  const hangUpCall = async () => {
    try {
      await axios.post("https://localhost:3000/api/close-call", 
        { userId: email }, 
        { withCredentials: true }
      );
      setIsCallActive(false);
    } catch (error) {
      console.error("Error al colgar llamada:", error);
    }
  };

  const createRoom = async () => {
    try {
      await axios.post("https://localhost:3000/api/create-room", 
        { roomId: "main-room" }, 
        { withCredentials: true }
      );
      setIsCallActive(false);
    } catch (error) {
      console.error("Error al colgar llamada:", error);
    }
  };

  return (
<div className="space-y-6">
      <div className="bg-white p-4 rounded shadow-md">
        <h3 className="text-lg font-medium mb-2">Video llamada</h3>
        
        <div className="flex gap-4 mb-4">
          <video id="localVideo" autoPlay playsInline muted className="w-1/2 rounded border"></video>
          <video id="remoteVideo" autoPlay playsInline className="w-1/2 rounded border"></video>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={openCall}
            disabled={isCallActive}
            className="bg-blue-600 text-blue px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Activar Llamada
          </button>
          <button
            onClick={hangUpCall}
            disabled={!isCallActive}
            className="bg-red-600 text-blue px-6 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
          >
            Colgar Llamada
          </button>
          <button
            onClick={createRoom}
            className="bg-red-600 text-blue px-6 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
          >
            Crear cuarto
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPersonal;