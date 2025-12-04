import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { UserContext } from "../../components/UserContext";
import { listenToRequests } from "../../supabase-client";
import { is } from "type-is";

const socket5 = io("https://localhost:3000", {
  withCredentials: true,
});

const AttendeesList = () => {
  const roomId = 'main-room';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [pendingUsers, setPendingUsers] = useState(null);
  const [isPending, setIsPending] = useState(null);
  const [isApproved, setIsApproved] = useState(null);
  const [check, setCheck] = useState(false);
  const [updatedUsers, setUpdatedUsers] = useState(false);
  // const [refreshTrigger, setRefreshTrigger] = useState(0);

  // let pendingUsers;
  // let approvedUsers; 
  let pendingUsersIds = [];
  let approvedUsersIds = [];

  useEffect( ()=>{
  // let channel;
  let isMounted = true;

  const fetchUsers = async () =>  {
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        fetch("https://localhost:3000/api/recover-users", { 
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({ roomId: "main-room" }),
          }),
        fetch("https://localhost:3000/api/searched-users-approved", { 
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({ roomId: "main-room" }),
          })
      ]);

      if (!pendingRes.ok || !approvedRes.ok) {
        throw new Error("Error al cargar los usuarios");
      }

      const pendingUsersJson = await pendingRes.json();
      const approvedUsersJson = await approvedRes.json();
      console.log("Usuarios pendientes recibidos:", pendingUsersJson);

      const pendingUsers = pendingUsersJson?.pendingUsers || [];
      
      const approvedUsers = approvedUsersJson?.approvedUsers || [];

      console.log(`pending users:`, pendingUsers);
      console.log(`approved users:`, approvedUsers);

      console.log(`pending ${pendingUsers}, approved ${approvedUsers}`);
      console.log("Estructura completa de pendingUsersJson:", pendingUsersJson);
      console.log("Tipo de pendingUsersJson:", typeof pendingUsersJson);
      console.log("pendingUsersJson.pendingUsers:", pendingUsersJson.pendingUsers);
      console.log("Es array pendingUsersJson.pendingUsers?", Array.isArray(pendingUsersJson.pendingUsers));

      // pendingUsersIds = pendingUsers.map(user => user.user_id);
      // approvedUsersIds = approvedUsers.map(user => user.user_id);
      // console.log(`pendingIds ${pendingUsersIds}, approvedIds ${approvedUsersIds}`);

      // Extrae los IDs (solo si hay usuarios)
      const pendingUsersIds = Array.isArray(pendingUsers) 
          ? pendingUsers.map(user => user?.user_id || user?.id).filter(id => id) 
          : [];

      const approvedUsersIds = Array.isArray(approvedUsers) 
          ? approvedUsers.map(user => user?.user_id || user?.id).filter(id => id) 
          : [];
      
      console.log(`pendingIds:`, pendingUsersIds);
      console.log(`approvedIds:`, approvedUsersIds);

      // if (!isMounted) return;

      // setIsPending(pendingUsers.pendingUsers || pendingUsers || []);
      // setIsApproved(approvedUsers.approvedUsers || approvedUsers || []);

      // Verifica si hay al menos un ID en alguno de los arrays

      if (pendingUsersIds.length > 0 || approvedUsersIds.length > 0) {
          console.log("recuperando usuarios...");
          
          // Actualiza los estados con los IDs
          setIsPending(pendingUsersIds);
          setIsApproved(approvedUsersIds);
          
          console.log("Usuarios pendientes actualizados:", pendingUsersIds);
          console.log("Usuarios aprobados actualizados:", approvedUsersIds);
      } else {
          console.log("No se encontraron usuarios pendientes o aprobados");
      }



      // if (pendingUsersIds !== '' &&  approvedUsersIds !== '') {
      //   console.log("recuperando usuarios...");
        // setUpdatedUsers(true);

        // setIsPending(pendingUsers.pendingUsers || pendingUsers || []);
        // setIsApproved(approvedUsers.approvedUsers || approvedUsers || []);

        // setIsPending(pendingUsersIds || []);
        // setIsApproved(approvedUsersIds || []);
        // console.log("Usuarios pendientes actualizados:", isPending);

      // } else {
      //   // setUpdatedUsers(false);
      //   return;
      // };

    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

    // Ejecutar la carga inicial
  fetchUsers();
},[roomId,updatedUsers]);

  useEffect( ()=>{

    const init =  async () => {

      const channel = listenToRequests(roomId, pendingUsersIds, (data) => {
        console.log("📡 Evento recibido de pendientes en admin:", data);

        // ⭐ Refrescamos manualmente cuando llega un evento
        if (channel) setUpdatedUsers(true);
        console.log("canal de pendientes:");
      });

      const channel2 =  listenToRequests(roomId, approvedUsersIds, (data) => {
      console.log("📡 Evento recibido de aprobados en admin:", data);
      
        // ⭐ Refrescamos manualmente cuando llega un evento
      if (channel2) setUpdatedUsers(true);
        console.log("canal de aprobados:");
      });

    }

    init();

      // Cleanup: ejecutar solo cuando se desmonte el componente
      let channel, channel2;
    return () => {
      console.log("🧹 Limpiando listener del admin");
      if (channel || channel2) {
        channel.unsubscribe();
        channel2.unsubscribe();
      }
    };
  }, [roomId]);



    const handleApprove = async (userId) => {
    try {
          const response = await fetch("https://localhost:3000/api/approved-users",
            { 
                method: 'POST',
                headers: { 'Content-type':'application/json' },
                body: JSON.stringify({ roomId: "main-room" , userId: userId }),
            });

            setIsPending(prev => prev.filter(user => user.user_id !== userId));
            // setIsApproved(prev => [...prev, userId]);

      } catch (err) {
      console.error(err);
      console.log("Error al enviar la solicitud.");
      }
    }

  const handleCancel = async (email) => {
    try {
        await fetch("https://localhost:3000/api/cancel-users",
          { 
              method: 'POST',
              headers: { 'Content-type':'application/json' },
              body: JSON.stringify({ userId: email }),
          });
          // Actualiza los estados localmente
          setIsApproved(prev => prev.filter(id => id !== email));
              
    } catch (err) {
    console.error(err);
    console.log("Error al enviar la solicitud.");
    }
  }

  return (
    <div className="bg-white p-4 rounded shadow-md text-center">
      <p className="text-green-600 font-medium">Solicitudes recibidas</p>

      {loading ? (
          <p> Cargando </p>
        ) : updatedUsers ?(
          <>
            <h2 className="text-lg font-bold">Usuarios pendientes</h2>
            
              {isPending.length > 0 ? (
                isPending.map(user => (
                  <div key={user?.user_id} className="mb-2 p-2 border rounded">
                    <p>{user.user_id} </p>
                    <button
                      onClick={()=>handleApprove(user.user_id)}
                      className="bg-blue-500 text-red px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Aprobar
                    </button>
                  </div>
                  ))
                  ) : (
                      <p>No hay usuarios pendientes</p>
                )
              } 
              
            <h2 className="text-lg font-bold mt-4">Usuarios aprobados</h2>
              {isApproved.length > 0 ? (
                isApproved.map((email, index) => (
                    <div key={`approved-${ index }`} className="mb-2 p-2 border rounded">
                      <p>{email} </p>
                      <button
                        onClick={()=>handleCancel(email)}
                        className="bg-blue-500 text-red px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Cancelar aprobacion
                      </button>
                    </div>
                )) 
              ) : ( <p>No hay usuarios pendientes</p>
            )}
          </>
          ) : (
            <p>No hay actualizaciones de usuarios</p>
          )
    }
    </div>
  );
};

export default AttendeesList;

       