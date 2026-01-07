import { useEffect } from "react";
import { supabase } from "../supabaseClient";
import { addViewerToBroadcast } from "../webrtc/WebRTCManager";

export default function useAdminBroadcastSync(userId, roomId, localStream) {
  useEffect(() => {
    if (!userId || !localStream) return;

    const channel = supabase
      .channel("new-viewers")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "active_users",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const viewerId = payload.new.user_id;
          if (viewerId !== userId) {
            console.log("Nuevo viewer conectado:", viewerId);
            await addViewerToBroadcast(localStream, userId, roomId, viewerId);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, localStream, roomId]);
}
