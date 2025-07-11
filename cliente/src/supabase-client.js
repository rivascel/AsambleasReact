import { createClient } from '@supabase/supabase-js';

// import { createOfferToViewer, handleOffer, handleAnswer, handleIceCandidate } from "./hooks/webrtc-manager";

const SUPABASE_URL = 'https://hhmqduncjwddwptghsaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobXFkdW5jandkZHdwdGdoc2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODQ0NTIsImV4cCI6MjA1NzQ2MDQ1Mn0.0IC33LEBv1O4QO9ctymNJu7nMjzXqk1P3Un9gf8WYds';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function registerViewer(fromUserId, roomId) {
  const { error } = await supabase.from("active_users").upsert([
    {
      user_id: fromUserId,
      room_id: roomId,
      created_at: new Date().toISOString(),
    },
  ]);
  if (error) console.error("Error registrando viewer:", error);
}

export const offerToViewer = async (roomId, fromUser, toUser, offer) => {
  const { error } = await supabase.from('webrtc_signaling').insert([
    {
      room_id: roomId,
      from_user: fromUser,
      to_user: toUser,
      type: 'offer',
      payload: offer,
      created_at: new Date().toISOString()
    }
  ]);
  
  if (error) throw new Error('Error sending offer: ' + error.message);
};

export const answerToAdmin = async (roomId, fromUser, toUser, answer) => {
  const { error } = await supabase.from('webrtc_signaling').insert([
    {
      room_id: roomId,
      from_user: fromUser,
      to_user: toUser,
      type: 'answer',
      payload: answer,
      created_at: new Date().toISOString()
    }
  ]);
  
  if (error) throw new Error('Error sending answer: ' + error.message);
};

export const candidateViewer = async (roomId, fromUser, toUser, candidate) => {
  if (!candidate) return;
  
  const { error } = await supabase.from('webrtc_signaling').insert([
    {
      room_id: roomId,
      from_user: fromUser,
      to_user: toUser,
      type: 'ice-candidate',
      payload: candidate,
      created_at: new Date().toISOString()
    }
  ]);
  
  if (error) throw new Error('Error sending ICE candidate: ' + error.message);
};

export const candidateAdmin = async (roomId, fromUser, toUser, candidate) => {
  if (!candidate) return;
  
  const { error } = await supabase.from('webrtc_signaling').insert([
    {
      room_id: roomId,
      from_user: fromUser,
      to_user: toUser,
      type: 'ice-candidate',
      payload: candidate,
      created_at: new Date().toISOString()
    }
  ]);
  
  if (error) throw new Error('Error sending ICE candidate: ' + error.message);
};


  export const listenForNewViewers = (roomId, adminId, callback) => {

  return supabase
    .channel(`offers-${roomId}-${adminId}`)

    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'active_users',
        filter: `room_id=eq.${roomId}`

      },
      (payload) => {
        console.log('Recibido sin filto:', payload);
        console.log('Evento recibido:', payload);
        if (payload.new.user_id !== adminId) {
          console.log('Nuevo viewer válido:', payload.new.user_id);
          callback(payload.new.user_id)
        }
      }
    )
    .subscribe((status) => {
    console.log("Estado de suscripción:", status);
  });
};

export const listenForAnswers = (roomId, userId, callback) => {
  return supabase
    .channel(`answers-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'webrtc_signaling',
        filter: `to_user=eq.${userId},type=eq.answer`
      },
      payload => callback(payload.new)
    )
    .subscribe();
};

export const listenForIceCandidates = (roomId, userId, callback) => {
  return supabase
    .channel(`ice-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'webrtc_signaling',
        filter: `to_user=eq.${userId},type=eq.ice-candidate`
      },
      payload => callback(payload.new)
    )
    .subscribe();
};

// Add these two new functions to your supabase-client.js file

/**
 * A viewer sends this request to an admin to initiate a video stream.
 */
export const sendJoinRequest = async (viewerId, roomId, adminId) => {
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

/**
 * An admin listens for new viewers joining the room.
 */
export const listenForJoinRequests = (adminId, callback) => {
  return supabase
    .channel(`joins-for-admin-${adminId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'webrtc_signaling',
        filter: `to_user=eq.${adminId},type=eq.join` // Filter for 'join' messages to the admin
      },
      payload => callback(payload.new)
    )
    .subscribe();
};

export async function registerAdminIsActive(adminId, roomId) {
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

    if (error) {
    console.error("❌ Error consultando admin activo:", error);
    return null;
  }
  return data?.user_id ?? null;
}