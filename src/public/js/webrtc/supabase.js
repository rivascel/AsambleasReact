// supabase.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = 'https://hhmqduncjwddwptghsaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobXFkdW5jandkZHdwdGdoc2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODQ0NTIsImV4cCI6MjA1NzQ2MDQ1Mn0.0IC33LEBv1O4QO9ctymNJu7nMjzXqk1P3Un9gf8WYds';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let approved='approved';

export async function createRoom(roomId, offer) {
    const { error } = await supabase
        .from('rooms')
        .insert([{ room_id: roomId, offer, candidates: [] }]);
    if (error) throw error;
}

//El usuario se une a la sala
export async function requestToJoinRoom(roomId, userId) {
    const { error } = await supabase
      .from('requests')
      .insert([{ user_id: userId, status: 'pending', room_id: roomId }]);
  
    if (error) {
      console.error("Error sending request:", error);
      return;
    }
  
    console.log(`Request sent for room: ${roomId}. Waiting for admin approval.`);
  }
  
export async function getPendingRequest(roomId) {
    const { data, error } = await supabase
        .from('requests')
        .select('user_id')
        .eq('room_id', roomId)
        .eq('status', 'pending')
        .single();
        // .maybeSingle();
    if (error) throw error;
    return data?.user_id;
}

export async function approveUser(userId, roomId, approved='approved') {
    const { error } = await supabase
        .from('requests')
        .update({ status: 'approved' })
        .eq('user_id', userId)
        .eq('room_id', roomId);
    if (error) throw error;

    const { data, error: fetchError } = await supabase
        .from('requests')
        .select('user_id')
        .eq('user_id', userId)
        .eq('status', approved)
        .single();

    if (fetchError) throw fetchError;

    const newCandidates = data?.userId || [];
    newCandidates.push(userId);

    const { error: updateError } = await supabase
        .from('rooms')
        .update({ candidates: newCandidates })
        .eq('room_id', roomId);

    if (updateError) throw updateError;
}


export function listenForApproval(userId, roomId, callback) {
    return supabase
        .channel('room-approval')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'requests',
                filter: `user_id=eq.${userId}`,
            },
            (payload) => {
                if (payload.new.status === 'approved' && payload.new.room_id === roomId) {
                    callback();
                }
            }
        )
        .subscribe();
}

export async function deleteCandidate(userId) {
    // Primero, obtén los datos actuales
    const { data: roomData, error: roomFetchError } = await supabase
      .from('rooms')
      .select('candidates')
      .overlaps('candidates', [userId])
      .maybeSingle();
    if (roomFetchError) throw roomFetchError;
  
    if (!roomData) {
        console.warn('No se encontró ninguna sala que contenga al usuario.');
       
    } else {
    const updatedCandidatesRoom = (roomData?.candidates).filter(id => id !== userId);

    const { error: roomUpdateError } = await supabase
        .from('rooms')
        .update({ candidates: updatedCandidatesRoom })
        .overlaps('candidates', [userId]);
    if (roomUpdateError) throw roomUpdateError;
    }
      
  
    // Repite para requests
    const { data: requestData, error: requestFetchError } = await supabase
      .from('requests')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (requestFetchError) throw requestFetchError;
  
    if (!requestData) {
        console.warn('No se encontró ninguna sala que contenga al usuario.');
        
      } else {
        
        const { error: requestUpdateError } = await supabase
          .from('requests')
          .delete()
          .eq('user_id', userId);
        if (requestUpdateError) throw requestUpdateError;
        console.log(`Request del usuario "${userId}" eliminada correctamente.`);
    }
}
  

