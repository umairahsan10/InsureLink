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

    const socket = io(baseUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-claim-room", { claimId });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("claim-message-new", (message: ClaimMessage) => {
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
        onMessageReadRef.current?.(data);
      },
    );

    socket.on(
      "user-typing",
      (data: { claimId: string; userId: string; isTyping: boolean }) => {
        onUserTypingRef.current?.(data);
      },
    );

    return () => {
      socket.emit("leave-claim-room", { claimId });
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
