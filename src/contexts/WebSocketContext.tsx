import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuthenticatedUser } from "../hooks/useAuthenticatedUser";
import { getWsToken } from "../utils/wsToken";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
// The STOMP endpoint is registered at /ws on the backend's servlet root (see
// WebSocketConfig#registerStompEndpoints), not under /api/v1 — so derive the socket base
// by stripping the REST client's own "/api/v1" suffix rather than hardcoding a second URL.
const WS_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

type SubscribeCallback = (message: IMessage) => void;

interface WebSocketContextValue {
  connected: boolean;
  /** Subscribe to a STOMP topic; returns an unsubscribe function. No-ops (and returns a no-op) while disconnected. */
  subscribe: (destination: string, callback: SubscribeCallback) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  connected: false,
  subscribe: () => () => {},
});

// App-wide STOMP-over-SockJS connection, live for the lifetime of an authenticated
// session (see MessagingController/AnalyticsController's Tag docs and WebSocketConfig on
// the backend for the topics this feeds: /topic/conversations/{id} and
// /topic/notifications/{userId}). Reconnects automatically on drop
// (Client#reconnectDelay); consumers subscribe/unsubscribe per-topic via `subscribe`
// rather than touching the underlying client, and re-subscribe themselves after a
// reconnect by keying their effect off `connected`.
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthenticatedUser();
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const token = user ? getWsToken() : null;
    if (!user || !token) {
      setConnected(false);
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws?token=${encodeURIComponent(token)}`),
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
      onStompError: () => setConnected(false),
    });
    clientRef.current = client;
    client.activate();

    return () => {
      setConnected(false);
      clientRef.current = null;
      client.deactivate();
    };
    // Re-run only when the identity of the logged-in user changes (login/logout) — the
    // token itself doesn't change without a user change in this app's auth model.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const value = useMemo<WebSocketContextValue>(
    () => ({
      connected,
      subscribe: (destination, callback) => {
        const client = clientRef.current;
        if (!client || !client.connected) return () => {};
        let sub: StompSubscription | null = client.subscribe(destination, callback);
        return () => {
          try {
            sub?.unsubscribe();
          } catch {
            // socket may already be closed/deactivated — nothing to clean up
          }
          sub = null;
        };
      },
    }),
    [connected]
  );

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = () => useContext(WebSocketContext);
