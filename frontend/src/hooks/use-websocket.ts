import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export function useWebSocket() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user?.user_id) return;

    const wsUrl = `ws://localhost:8000/ws/${user.user_id}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send keepalive ping every 30 seconds
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send("ping");
        }
      }, 30000);

      (ws as any)._pingInterval = pingInterval;
    };

    ws.onmessage = (event) => {
      if (event.data === "pong") return;
      try {
        const payload = JSON.parse(event.data);
        // Live updates — invalidate relevant queries based on event type
        if (payload.type === "notification" || payload.type === "pr_analyzed") {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["bff"] });
          queryClient.invalidateQueries({ queryKey: ["pull-requests"] });
        } else if (payload.type === "knowledge_indexed") {
          queryClient.invalidateQueries({ queryKey: ["knowledge"] });
        } else if (payload.type === "repo_synced") {
          queryClient.invalidateQueries({ queryKey: ["repositories"] });
          queryClient.invalidateQueries({ queryKey: ["bff"] });
        }
      } catch {
        // Ignore raw non-JSON messages
      }
    };

    ws.onclose = () => {
      if ((ws as any)._pingInterval) {
        clearInterval((ws as any)._pingInterval);
      }
    };

    return () => {
      if ((ws as any)._pingInterval) {
        clearInterval((ws as any)._pingInterval);
      }
      ws.close();
    };
  }, [user?.user_id, queryClient]);
}
