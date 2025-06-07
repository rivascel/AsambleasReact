import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { UserContext } from "../../components/UserContext";

const socket5 = io("http://localhost:3000", {
  withCredentials: true,
});

const AttendeesList = () => {
  // const [receive, setReceive] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [isApproved, setIsApproved] = useState(null);
  const { email } = useContext(UserContext);

  useEffect( ()=>{
    const fetchUsers = async () =>  {
      const response= await fetch("http://localhost:3000/api/recover-users",
            { 
              method: 'POST',
              headers: { 'Content-type':'application/json' },
              body: JSON.stringify({ roomId: "main-room" }),
            });

          const data = await response.json();
          // console.log("users",data);
        
          setUsers(data.pendingUsers);
          setLoading(false);
          };
          fetchUsers();
  },[]);

  const handleApprove = async (userId) => {
    try {
        await fetch("http://localhost:3000/api/approved-users",
          { 
              method: 'POST',
              headers: { 'Content-type':'application/json' },
              body: JSON.stringify({ roomId: "main-room" , userId: userId }),
          });
          
        if (!error) {
        setUsers(prev => 
          prev.map(u => 
            u.user_id === userId ? { ...u, status: 'approved' } : u));
        }
    } catch (err) {
    console.error(err);
    setError("Error al enviar la solicitud.");
    }
  }

  return (
    <div className="bg-white p-4 rounded shadow-md text-center">
      <p className="text-green-600 font-medium">Solicitudes recibidas</p>

      {loading ? (
          <p> Cargando </p>
        ) :  (Array.isArray(users) && users.length > 0 ?
          
            (users
              .map(user => (
              <div key={user.user_id} className="mb-2 p-2 border rounded">
                <p>{user.user_id} </p>
                
                  <button
                    onClick={()=>handleApprove(user.user_id)}
                    className="bg-blue-500 text-red px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Aprobar
                  </button>
              </div>
              ))
            )
            : <p>No hay usuarios pendientes</p>
          )
          }
    </div>
  );
};

export default AttendeesList;

       