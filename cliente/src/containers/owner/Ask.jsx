import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { UserContext } from "../../components/UserContext";
import { io } from "socket.io-client";
import { listenToApprovals } from '../../supabase-client';

const socket7 = io("https://localhost:3000", {
  withCredentials: true,
});

const AskToParticipate = () => {
  const roomId = 'main-room';
  const [loading, setLoading] = useState(true);
  const { email, setCheckApprove } = useContext(UserContext);
  const [req, setReq] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [requestStatus , setRequestStatus] = useState('none');


  useEffect(() => {
    if (!email) return;
    const channel = listenToApprovals(roomId, email, (set) => {
      console.log("Aprobaciones recibidas en tiempo real:", set);

      if (set._deleted) {
        console.log("🗑️ _deleted detectado, datos completos:", set);
        console.log("🗑️ user_id:", set.user_id, "email:", email);

        if (set.user_id === email) {
          console.log("📛 DELETE detectado");
          setRequestStatus('none');
        } else {
          console.log("❌ No coincide user_id");
        }
        return;
      }

      if (set.user_id === email) {
        setRequestStatus(set.status); // 'pending' o 'approved'
        console.log("✅ Solicitud actualizada a:", set.status);
      } else {
        setRequestStatus('none');
      }

    });  
    return () => {
      channel.unsubscribe();
    }
    
  }, [email, roomId /*, requestStatus*/]);


  useEffect( ()=>{
    if (!email) return;

    const fetchUsers = async () =>  {
      try {
        const [pendingRes, approvedRes] = await Promise.all([
          fetch("https://localhost:3000/api/recover-users-id", { 
              method: 'POST',
              headers: { 'Content-Type':'application/json' },
              body: JSON.stringify({ roomId: "main-room", userId: email }),
            })
        ]);

        if (!pendingRes.ok /* || !approvedRes.ok */) {
          throw new Error("Error al cargar los usuarios");
        }

        const pendingData = await pendingRes.json();

        const pendingUsersById = pendingData.pendingUsersById || [];
        const approvedUsersById = pendingData.approvedUsersById || [];

        if (Array.isArray(pendingUsersById) && pendingUsersById.includes(email)) {
          // setReq(true);
          // setRequestStatus('pending');
        } else if (Array.isArray(approvedUsersById) && approvedUsersById.includes(email)) {
          // setIsApproved(true);
          // setCheckApprove(true);
          // setRequestStatus('approved');
        }

        return { pendingUsersById, approvedUsersById /*, approvedUsers*/};

      } catch (error) {
        console.error("Error cargando usuarios:", error);
        return { pendingUsersById: [], approvedUsersById: [] /*, approvedUsers: []*/ };
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
    
  },[email]);

  const handleRequest = async () => {
    try {
      // Ejemplo de envío al backend (ajusta a tu API o Supabase)
      await axios.post("https://localhost:3000/api/request-participation", 
        { roomId: "main-room" }, 
        {
        withCredentials: true, // si usas cookies seguras
      });
      
      // setReq(true);
      setRequestStatus('pending');

    } catch (err) {
      console.error(err);
      console.log("Error al enviar la solicitud.");
    }
  };

  const cancelRequest = async () => {
    try {
      // Ejemplo de envío al backend (ajusta a tu API o Supabase)
      await axios.post("https://localhost:3000/api/cancel-users", 
        { roomId: "main-room", userId:email }, 
        {withCredentials: true} // si usas cookies seguras
      );
      setRequestStatus('none');
      // setReq(false);

    } catch (err) {
      console.error(err);
      console.log("Error al enviar la solicitud.");
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow-md text-center">
      <h3 className="text-lg font-semibold mb-4">¿Solicitudes enviadas?</h3>

      {loading ? (
        <p> Cargando </p>
        ): 
        //   requestStatus === 'none' ? (
        //   <>
        //     <p className="text-gray-600 mb-2">No has enviado ninguna solicitud.</p>
        //     <button onClick={handleRequest} className="bg-blue-600 text-black px-6 py-2 rounded hover:bg-blue-700">
        //       Solicitar participación
        //     </button>
        //   </>
        // ) : requestStatus === 'pending' ? (
        //   <>
        //     <p className="text-gray-600 mb-2">Tu solicitud ({email}) está pendiente de aprobación.</p>
        //     <button onClick={cancelRequest} className="bg-blue-600 text-black px-6 py-2 rounded hover:bg-blue-700">
        //       Cancelar participación
        //     </button>
        //   </>
        // ) : requestStatus === 'approved' ? (
        //   <>
        //     <p className="text-green-600 font-medium">¡Tu solicitud ha sido aprobada! Puedes activar la cámara</p>
        //   </>
        // ) : (
        //   <>
        //     <p className="text-gray-600 mb-2">No has enviado ninguna solicitud.</p>
            
        //   </>
        //   )

        (() => 
          {
            switch (requestStatus) {
              case 'none':
                return (
                  <>
                    <p className="text-gray-600 mb-2">No has enviado ninguna solicitud.</p>
                    <button 
                      onClick={handleRequest} 
                      className="bg-blue-600 text-black px-6 py-2 rounded hover:bg-blue-700"
                    >
                      Solicitar participación
                    </button>
                  </>
                );
              
              case 'pending':
                return (
                  <>
                    <p className="text-gray-600 mb-2">Tu solicitud ({email}) está pendiente de aprobación.</p>
                    <button 
                      onClick={cancelRequest} 
                      className="bg-blue-600 text-black px-6 py-2 rounded hover:bg-blue-700"
                    >
                      Cancelar participación
                    </button>
                  </>
                );
              
              case 'approved':
                return (
                  <>
                    <p className="text-green-600 font-medium">¡Tu solicitud ha sido aprobada! Puedes activar la cámara</p>
                  </>
                );
              
              default:
                return (
                  <>
                    <p className="text-gray-600 mb-2">No has enviado ninguna solicitud.</p>
                  </>
                );
            }
          }
        )()
      }
    </div>
  );
};

export default AskToParticipate;