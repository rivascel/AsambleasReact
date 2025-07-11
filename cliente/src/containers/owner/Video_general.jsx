import React, { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../../components/UserContext";
import { io } from "socket.io-client";
import { getAdmin, joinStreamAsViewer, startLocalStream, stoptLocalStream } from '../../hooks/webrtc-client';

const socket11 = io("https://localhost:3000", {
  withCredentials: true,
});

const VideoGeneral = () => {
  const localRef = useRef();
  const remoteRef = useRef();
  const roomId = 'main-room';
  const { email } = useContext(UserContext);
  const [adminId, setAdminId] = useState(null);
  consr [allowed, isAllowed] = useState(false);
  const adminRef = useRef();

  useEffect(() => {
    const fetchAdmin = async () => {
      const admin = await getAdmin(roomId);
      setAdminId(admin);
     };
    fetchAdmin();
  });

  useEffect(() => {
    if (adminId) {
      console.log(`email ${email}, adminId: ${adminId}, roomId: ${roomId}`);
      joinStreamAsViewer(email, roomId, adminId, remoteRef.current);
    }
  },[email]);

  const openCall = async () => {
    startLocalStream(localRef.current);
  }

  const closeCall = () => {
    stoptLocalStream(localRef.current);
  }

  return (
    <div className="space-y-6">
      {/* Transmisión en vivo */}
      <div className="bg-white p-4 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-2">Asamblea en vivo</h2>
        <video
          ref={remoteRef} autoPlay playsInline className="w-full rounded border"
        ></video>
        <h2 className="text-xl font-semibold mb-2">Intervención del copropietario</h2>
        <video
          ref={localRef} autoPlay playsInline className="w-full rounded border"
        ></video>

        <div className="controls">
          {!isAllowed ? (
           <button
            onClick={openCall}
            className="bg-blue-600 text-blue px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Iniciar video
          </button> 
          ):(
          <button
            onClick={closeCall}
            className="bg-red-600 text-blue px-6 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
          >
            Detener video
          </button>  
          )
        }
        </div>

      </div>
    </div>
    )
};

export default VideoGeneral;