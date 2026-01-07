import React, { useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import { listenToRequests } from "../../supabase-client";
import AppContext from '../../context/AppContext'




const AttendeesList = () => {
  const { apiUrl } = useContext(AppContext);
  
  const socket5 = io(`${apiUrl}`, {
    withCredentials: true,
    transports: ["websocket"]
  });


  const roomId = 'main-room';
  const [loading, setLoading] = useState(true);
  const [pendingUsersIds, setPendingUsersIds] = useState([]);
  const [approvedUsersIds, setApprovedUsersIds] = useState([]);
  // const [updatedUsers, setUpdatedUsers] = useState('default');

   // Elimina updatedUsers y usa los estados directamente
  const hasPending = pendingUsersIds.length > 0;
  const hasApproved = approvedUsersIds.length > 0;
  
  useEffect( ()=>{
  let isMounted = true;
    let channelRequests, channelApprovals;

  const fetchUsers = async () => {
      try {
        console.log("🔄 Ejecutando fetchUsers...");
        const [pendingRes, approvedRes] = await Promise.all([
          fetch(`${apiUrl}/api/recover-users`, { 
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            credentials: 'include',
            body: JSON.stringify({ roomId: "main-room" }),
          }),
          fetch(`${apiUrl}/api/searched-users-approved`, { 
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            credentials: 'include',
            body: JSON.stringify({ roomId: "main-room" }),
          })
        ]);

        if (!pendingRes.ok || !approvedRes.ok) {
          throw new Error("Error al cargar los usuarios");
        }

        const pendingUsersJson = await pendingRes.json();
        const approvedUsersJson = await approvedRes.json();
        
        console.log("pendingUsersJson:", pendingUsersJson);
        console.log("approvedUsersJson:", approvedUsersJson);

        const pendingUsers = pendingUsersJson?.pendingUsers || [];
        const approvedUsers = approvedUsersJson?.approvedUsers || [];

        const pendingIds = Array.isArray(pendingUsers) 
          ? pendingUsers.map(user => user?.user_id || user?.id).filter(id => id) 
          : [];

        const approvedIds = Array.isArray(approvedUsers) 
          ? approvedUsers.filter(id => id) 
          : [];
        
        console.log(`📊 Resultado fetchUsers - Pendientes: ${pendingIds.length}, Aprobados: ${approvedIds.length}`);

        if (isMounted) {
          setPendingUsersIds(pendingIds);
          setApprovedUsersIds(approvedIds);
          setLoading(false);
          
          console.log("✅ Estados actualizados:", {
            pending: pendingIds,
            approved: approvedIds
          });
        }
      } catch (error) {
        console.error("Error cargando usuarios:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };


  // Función para manejar cambios
  const handleChange = (type) => {
    console.log(`📡 Cambio detectado en ${type}`);
    if (isMounted) {
      fetchUsers();
    }
  };

    fetchUsers();


// Configurar suscripciones (sin filtrar)
  channelRequests = listenToRequests(
    "main-room",
    // null, // Escuchar todo
    { componentId: 'AttendeesList' },
    () => handleChange('solicitudes'),
    // false
  );

  channelApprovals = listenToRequests(
    "main-room",
    // null, // Escuchar todo
    { componentId: 'AttendeesList' },
    () => handleChange('aprobaciones'),
    // true
  );

  console.log("✅ Suscripciones configuradas");

  // Limpieza
    return () => {
      console.log("🧹 Limpiando efectos...");
      isMounted = false;
      if (channelRequests) {
        console.log("Desuscribiendo channelRequests");
        channelRequests.unsubscribe();
      }
      if (channelApprovals) {
        console.log("Desuscribiendo channelApprovals");
        channelApprovals.unsubscribe();
      }
    };
},[]);



  // Keep only the logging useEffect for debugging
  useEffect(() => {
    console.log("📊 Estado actual:", {
      pendingUsersIds,
      approvedUsersIds,
      hasPending,
      hasApproved,
      loading
    });
  }, [pendingUsersIds, approvedUsersIds, hasPending, hasApproved, loading]);


    const handleApprove = async (userId) => {
    try {
            const response = await fetch(`${apiUrl}/api/approved-users`,
              { 
                  method: 'POST',
                  headers: { 'Content-type':'application/json' },
                  body: JSON.stringify({ roomId: "main-room" , userId: userId }),
              });

                if (response.ok) {
                  console.log(`✅ Usuario ${userId} aprobado en el servidor`);
                  
                  // CORRECCIÓN AQUÍ: Filtrar por ID (string), no por user.user_id
                  setPendingUsersIds(prev => prev.filter(id => id !== userId));
                  
                  // CORRECCIÓN AQUÍ: Agregar a aprobados
                  setApprovedUsersIds(prev => [...prev, userId]);
                  
                  console.log(`✅ Estados locales actualizados: 
                    Pendientes eliminado: ${userId}
                    Aprobados agregado: ${userId}`);
                } else {
                  console.error("❌ Error en la respuesta del servidor");
                }
            } catch (err) {
              console.error("❌ Error al aprobar usuario:", err);
            }
 
    }

  const handleCancel = async (userId) => {
    try {
      console.log(`❌ Intentando cancelar aprobación de: ${userId}`);
      
      const response = await fetch(`${apiUrl}/api/cancel-users`, { 
        method: 'POST',
        headers: { 'Content-type':'application/json' },
        body: JSON.stringify({ userId: userId }),
      });
      
      if (response.ok) {
        console.log(`✅ Aprobación de ${userId} cancelada en el servidor`);
        
        // Actualiza los estados localmente
        setApprovedUsersIds(prev => prev.filter(id => id !== userId));
        
        console.log(`✅ Estado local actualizado: Aprobados eliminado: ${userId}`);
      } else {
        console.error("❌ Error en la respuesta del servidor");
      }
    } catch (err) {
      console.error("❌ Error al cancelar aprobación:", err);
    }
  };
    // Renderizado simplificado
  const renderContent = () => {
    if (loading) {
      return <p>Cargando...</p>;
    }

    if (!hasPending && !hasApproved) {
      return <p className="text-gray-600 mb-2">No hay usuarios pendientes ni aprobados.</p>;
    }


  return (
      <>
        {hasPending && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">Usuarios pendientes</h2>
            {pendingUsersIds.map((userId, index) => (
              <div key={`pending-${userId}-${index}`} className="mb-2 p-2 border rounded">
                <p>{userId}</p>
                <button
                  onClick={() => handleApprove(userId)}
                  className="bg-green-500 text-red px-3 py-1 rounded hover:bg-green-600 mt-1"
                >
                  Aprobar
                </button>
              </div>
            ))}
          </div>
        )}
        
        {hasApproved && (
          <div>
            <h2 className="text-lg font-bold mb-2">Usuarios aprobados</h2>
            {approvedUsersIds.map((userId, index) => (
              <div key={`approved-${userId}-${index}`} className="mb-2 p-2 border rounded">
                <p>{userId}</p>
                <button
                  onClick={() => handleCancel(userId)}
                  className="bg-red-500 text-red px-3 py-1 rounded hover:bg-red-600 mt-1"
                >
                  Cancelar aprobación
                </button>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="bg-white p-4 rounded shadow-md text-center">
      <p className="text-green-600 font-medium mb-4">Solicitudes recibidas</p>
      {renderContent()}
    </div>
  );
};

export default AttendeesList;

       