import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { UserContext } from "../../components/UserContext";
import { io } from "socket.io-client";

const socket7 = io("http://localhost:3000", {
  withCredentials: true,
});

const AskToParticipate = () => {
  const [sent, setSent] = useState(true);
  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState(null);
  const { email } = useContext(UserContext);

  useEffect( ()=>{
    if (!email) return;

    const fetchUsers = async () =>  {
      try {
        const res = await fetch("http://localhost:3000/api/recover-users-id", 
            { 
              method: 'POST',
              headers: { 'Content-Type':'application/json' },
              body: JSON.stringify({ roomId: "main-room", userId: email })
            })

        if (!res.ok ) {
          throw new Error("Error al cargar los usuarios");
        }

        const data = await res.json();
        // console.log("Fetched data:", data);
        setReq(data.pendingUsersById || data || []);

      } catch (error) {
        console.error("Error cargando usuarios:", error);
      } finally {
        setLoading(false);
      }

    };
    fetchUsers();
    
  },[email]);

  const handleRequest = async () => {
    try {
      // Ejemplo de envío al backend (ajusta a tu API o Supabase)
      await axios.post("http://localhost:3000/api/request-participation", 
        { roomId: "main-room" }, 
        {
        withCredentials: true, // si usas cookies seguras
      });
      
      setSent(false);

    } catch (err) {
      console.error(err);
      console.log("Error al enviar la solicitud.");
    }
  };

  const cancelRequest = async () => {
    try {
      // Ejemplo de envío al backend (ajusta a tu API o Supabase)
      await axios.post("http://localhost:3000/api/cancel-users", 
        { roomId: "main-room", userId:email }, 
        {withCredentials: true} // si usas cookies seguras
      );
      setSent(true);

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
        ): req.find((r) => r.user_id === email) ? (
                <>
                  <p className="text-gray-600 mb-2">Tu solicitud ({email}) está pendiente de aprobación.</p>
                  <button
                    onClick={cancelRequest}
                    className="bg-blue-600 text-black px-6 py-2 rounded hover:bg-blue-700">
                    Cancelar participación
                  </button>
                </>
                ) : sent ? (
                    <>
                      <p className="text-gray-600 mb-2">No has enviado ninguna solicitud.</p>
                      <button
                            onClick={handleRequest}
                            className="bg-blue-600 text-black px-6 py-2 rounded hover:bg-blue-700"
                          >
                            Solicitar participación
                      </button>
                    </> 
                  ):(
                    <>
                      <p className="text-gray-600 mb-2">Haz enviado una solicitud.</p>
                      <button
                              onClick={cancelRequest}
                              className="bg-blue-600 text-black px-6 py-2 rounded hover:bg-blue-700"
                            >
                              Cancelar solicitud
                        </button>
                    </>
                  )
      }
    </div>
  );
};

export default AskToParticipate;