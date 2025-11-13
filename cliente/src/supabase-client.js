import { createClient } from '@supabase/supabase-js';
import { CHAR_CARRIAGE_RETURN } from 'picomatch/lib/constants';

const SUPABASE_URL = 'https://hhmqduncjwddwptghsaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobXFkdW5jandkZHdwdGdoc2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODQ0NTIsImV4cCI6MjA1NzQ2MDQ1Mn0.0IC33LEBv1O4QO9ctymNJu7nMjzXqk1P3Un9gf8WYds';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function registerViewer(roomId, viewerId ) {

  if (!viewerId) {
    console.error("viewerId es null, no se puede registrar");
    return;
  }
  const { error } = await supabase.from("active_users").upsert([
    {
      user_id: viewerId,
      room_id: roomId,
      is_admin:false,
      created_at: new Date().toISOString(),
    },
  ]);
  if (error) console.error("Error registrando viewer:", error);
}


// Simulación para detectar viewers (desde tabla active_users)
export const getAllViewersAndListen = async (roomId, onNewViewer) => {
  const viewers = new Set(); // Usamos Set para evitar duplicados

  const { data: currentViewers, error} = await supabase
    .from("active_users")
    .select("*")
    .eq("room_id",roomId)
    .eq("is_admin",false)

     if (error) {
      console.error("Error obteniendo viewers:", error);
      throw error;
    }
    
    currentViewers?.forEach((viewer)=>{
      viewers.add(viewer.user_id)
      onNewViewer?.(viewer.user_id);
    });

    const channel = supabase
    .channel(`active_users_${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "active_users",
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        if (!payload.new.is_admin) {
          viewers.add(payload.new.user_id);
          onNewViewer?.(payload.new.user_id);
        }
      }
    )
    .subscribe((status)=>{
      console.log("Estado de suscripción:", status);
    });

  return {
    viewers: Array.from(viewers), // Convertimos a array para facilidad de uso
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}
//=========================== send signal
export async function sendSignal({ room_id, from_user, to_user, type, payload }) {
  try {

    if (!from_user || !room_id) {
      throw new Error("from_user o roomId es requerido");
    }

    // Aseguramos que payload sea un objeto JSON válido
    const jsonPayload = typeof payload === "string" ? JSON.parse(payload) : payload;

    const { error } = await supabase.from("webrtc_signaling").insert([
      {
        room_id,
        from_user,
        to_user,
        type  ,
        payload: {
                  ...jsonPayload,
                  sdpMLineIndex: Number(jsonPayload.sdpMLineIndex) || 0
                }
      },
    ]);

    if (error) { 
      console.error("❌ Error al insertar señal:", error);
    } else {
      // console.log(`✅ Señal (${type}) enviada de ${from_user} → ${to_user}`);
    }
  } catch (e){
    console.error("🧨 Excepción:", e);
  }
}

export const listenToApprovals = async (room, onNewViewer) => {

  const approvers = new Set(); // Usamos Set para evitar duplicados

  const { data: currentApprovers, error} = await supabase
    .from("requests")
    .select("*")
    .eq("room_id",room)
    .eq("status","approved")

     if (error) {
      console.error("Error obteniendo approvers:", error);
      throw error;
    }

    currentApprovers?.forEach((approver)=>{
      approvers.add(approver.user_id);
      onNewViewer?.(approver);
    });
    

  const channel = supabase
    .channel(`Signals-${room}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'requests',
        filter: `room_id=eq.${room}`,
        filter: `status=eq.approved`

      },
      (payload) => {
        const newApprover = payload.new;
        if (!approvers.has(newApprover.user_id)) {
          approvers.add(newApprover.user_id);
          onNewViewer?.(newApprover);
        }
      }
    )
    .subscribe((status) => {
      console.log("Estado de suscripción:", status);
    });

    return {
          // () => channel.unsubscribe();
    
      // return  () => channel.unsubscribe();
      approvers: Array.from(approvers), // Convertimos a array para facilidad de uso
      
      // removeChannel: () => supabase.removeChannel(channel),
      unsubscribe: () => supabase.unsubscribe(channel)
    };

};


//===================================================
//Permite escuchar las señales como ofertas 
// const activeChannels = {};
// export const listenToSignals = (userId, callback) => {
//   if (!userId) return;

//   if (activeChannels[userId]) {
//     console.log(`🔁 Reusando canal Signals-${userId}`);
//     return activeChannels[userId];
//   }

//   console.log(`🟢 Escuchando señales desde tabla para: ${userId}`);
//   const channel = supabase
//     .channel(`Signals-${userId}`)
//     .on(
//       'postgres_changes',
//       {
//         event: 'INSERT',
//         schema: 'public',
//         table: 'webrtc_signaling',
//         filter: `to_user=eq.${userId}`,
//       },
//       (payload) => {
//         console.log("🔔 Señal detectada en tabla:", payload.new);
//         callback(payload.new);
//       }
//     )
//     .subscribe((status) => {
//       console.log(`Estado de suscripción Signals-${userId}:`, status);
//     });

//   activeChannels[userId] = channel;
// };

export const listenToSignals = (userId, callback) => {
  if (!userId) return;

  const channel = supabase
    .channel(`Signals-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'webrtc_signaling',
        filter: `to_user=eq.${userId}`,
      },
      (payload) => {
        console.log("🔔 Señal detectada en tabla:", payload.new);
        callback(payload.new);
      }
    )
    .subscribe((status) => {
      console.log(`Estado de suscripción Signals-${userId}:`, status);
    });

};

//Los vieweres escuchan las señales del admin y envian la respuesta (answers)
export const listenToSignalsFromAdmin = async (userId, callback) => {

    if (!userId) {
      console.error("Usuario no definido aun"); 
      return;
    }
    const channel = supabase
    .channel(`Signals-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'webrtc_signaling',
        filter: `to_user=eq.${userId}`
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe((status) => {
    console.log("Estado de suscripción:", status);

    return {
      removeChannel: () => supabase.removeChannel(channel)
    }
  });

};


//Los vieweres escuchan las señales del admin y envian la respuesta (answers)

export const listenToSignalsFromViewer = async (userId, callback) => {

  if (!userId) {
    console.error("Usuario no definido aun"); 
    return;
  }

  const channel = supabase
  .channel(`Signals-${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'webrtc_signaling',
      filter: `to_user=eq.${userId}`

    },
    (payload) => {
      const signal = payload.new;
      if (!signal) return;
      // callback(payload.new)

       // Solo procesar señales que vayan al admin
        if (signal.to_user === userId && (signal.type === "offer" || signal.type === "ice-candidate")) {
          console.log("📩 Señal de viewer -> admin:", signal.type, "de", signal.from_user);
          callback(signal);
        }

    }
  )
  .subscribe((status) => {
  console.log("Estado de suscripción:", status);

  return {
    removeChannel: () => supabase.removeChannel(channel)
  }
  });
};

export const sendJoinRequest = async (roomId, viewerId, adminId) => {
  const { error } = await supabase.from('webrtc_signaling').upsert([
    {
      room_id: roomId,
      from_user: viewerId, // The viewer's ID
      to_user: adminId,     // The admin's ID
      type: 'join',
      payload: { message: 'Requesting to join stream' }, // Payload can be simple
      created_at: new Date().toISOString()
    }
  ]);

  if (error) throw new Error('Error sending join request: ', error.message);
};

export async function registerAdminIsActive(roomId, adminId) {
  try {
    const { error } = await supabase.from('active_users').upsert([
      {
        user_id: adminId,
        room_id: roomId,
        is_admin: true,
        created_at: new Date().toISOString(),
      }
    ]);
    if (error) {console.error("Error registering admin as active:", error)}
    else {console.log("✅ Admin registrado como activo");};
  } catch (error) {
    console.error("❌ Excepción en registerAdminIsActive:", error);
  }  
}

export async function deleteAdmin(adminId) {
  const { error } = await supabase
    .from('active_users')
    .delete()
    .eq('user_id', adminId);
  if (error) {console.error("Error deleting admin:", error)}
  else {console.log("✅ Admin eliminado");};
}

export async function getActiveAdmin(roomId){
  const { data, error } = await supabase
    .from('active_users')
    .select('user_id')
    .eq('room_id', roomId)
    .eq('is_admin', true)
    .single();

    // console.log("data", data);

    if (error) {
    console.error("❌ Error consultando admin activo:", error);
    return null;
    }
  return data?.user_id ?? null;
}

