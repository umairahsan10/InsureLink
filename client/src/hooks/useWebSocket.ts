"use client";
import { useEffect, useRef, useState } from "react";

export function useWebSocket(url?: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);

  useEffect(() => {
    if (!url) return;
    const ws = new WebSocket(url);
    socketRef.current = ws;
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (evt) => setLastMessage(evt);
    return () => {
      ws.close();
    };
  }, [url]);

  const send = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
    }
  };

  return { isConnected, lastMessage, send };
}




