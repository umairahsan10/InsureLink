"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/auth/session";
import { ClaimMessage } from "@/types/messaging";

interface UseClaimSocketOptions {
  claimId: string | null;
  onNewMessage?: (message: ClaimMessage) => void;
  onMessageRead?: (data: {
    claimId: string;
    readBy: string;
    readAt: string;
    markedCount: number;
  }) => void;
  onUserTyping?: (data: {
    claimId: string;
    userId: string;
    isTyping: boolean;
  }) => void;
}

export function useClaimSocket({
  claimId,
  onNewMessage,
  onMessageRead,
  onUserTyping,
}: UseClaimSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Store callbacks in refs to avoid re-connecting on handler change
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageReadRef = useRef(onMessageRead);
  const onUserTypingRef = useRef(onUserTyping);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);
  useEffect(() => {
    onMessageReadRef.current = onMessageRead;
  }, [onMessageRead]);
  useEffect(() => {
    onUserTypingRef.current = onUserTyping;
  }, [onUserTyping]);

  useEffect(() => {
    if (!claimId) return;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
    const token = getAccessToken();

    // Guard against empty token
    if (!token) {
      console.warn("[useClaimSocket] No auth token available");
      return;
    }

    const socket = io(baseUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[useClaimSocket] Connected to server");
      setIsConnected(true);
      // Join the room after connection
      socket.emit("join-claim-room", { claimId }, (response: any) => {
        console.log("[useClaimSocket] Room join response:", response);
      });
    });

    socket.on("disconnect", (reason: string) => {
      console.log("[useClaimSocket] Disconnected:", reason);
      setIsConnected(false);
    });

    socket.on("room-joined", (data: any) => {
      console.log("[useClaimSocket] Successfully joined room:", data);
    });

    socket.on("claim-message-new", (message: ClaimMessage) => {
      console.log("[useClaimSocket] New message received:", message.id);
      onNewMessageRef.current?.(message);
    });

    socket.on(
      "claim-message-read",
      (data: {
        claimId: string;
        readBy: string;
        readAt: string;
        markedCount: number;
      }) => {
        console.log("[useClaimSocket] Message read receipt:", data);
        onMessageReadRef.current?.(data);
      },
    );

    socket.on(
      "user-typing",
      (data: { claimId: string; userId: string; isTyping: boolean }) => {
        onUserTypingRef.current?.(data);
      },
    );

    socket.on("error", (error: any) => {
      console.error("[useClaimSocket] Socket error:", error);
    });

    socket.on("connect_error", (error: any) => {
      console.error("[useClaimSocket] Connection error:", error.message);
    });

    return () => {
      try {
        socket.emit("leave-claim-room", { claimId });
      } catch (error) {
        console.error("[useClaimSocket] Error leaving room:", error);
      }
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [claimId]);

  const emitTyping = useCallback(
    (userId: string, isTyping: boolean) => {
      if (socketRef.current?.connected && claimId) {
        socketRef.current.emit("user-typing", {
          claimId,
          userId,
          isTyping,
        });
      }
    },
    [claimId],
  );

  return { isConnected, emitTyping };
}
