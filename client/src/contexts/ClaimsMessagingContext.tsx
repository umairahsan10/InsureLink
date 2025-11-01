'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ClaimMessage, SenderRole, Attachment } from '@/types/messaging';
import { useBroadcastChannel } from '@/hooks/useBroadcastChannel';

interface BroadcastMessageType {
  type: 'claim-message' | 'mark-read';
  claimId: string;
  data?: unknown;
}

interface ClaimsMessagingContextType {
  messages: Map<string, ClaimMessage[]>;
  sendMessage: (
    claimId: string,
    text: string,
    attachments: Attachment[],
    sender: SenderRole,
    receiver: SenderRole
  ) => void;
  markAsRead: (claimId: string, userRole: SenderRole) => void;
  getUnreadCount: (claimId: string, userRole: SenderRole) => number;
  hasUnreadAlert: (claimId: string, userRole: SenderRole) => boolean;
  getMessages: (claimId: string) => ClaimMessage[];
}

const ClaimsMessagingContext = createContext<ClaimsMessagingContextType | undefined>(undefined);

export function ClaimsMessagingProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Map<string, ClaimMessage[]>>(new Map());
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Handle incoming broadcast messages from other tabs  
  const handleBroadcastMessage = useCallback((message: BroadcastMessageType): void => {
    if (message.type === 'claim-message' && message.data) {
      const newMessage = message.data as ClaimMessage;
      
      // Prevent processing the same message twice
      if (processedMessageIds.current.has(newMessage.id)) {
        return;
      }
      processedMessageIds.current.add(newMessage.id);

      setMessages((prev) => {
        const newMap = new Map(prev);
        const claimMessages = newMap.get(newMessage.claimId) || [];
        newMap.set(newMessage.claimId, [...claimMessages, newMessage]);
        return newMap;
      });
    } else if (message.type === 'mark-read' && message.claimId) {
      // Handle mark as read from other tabs
      setMessages((prev) => {
        const newMap = new Map(prev);
        const claimMessages = newMap.get(message.claimId) || [];
        const updated = claimMessages.map((msg) => ({ ...msg, read: true }));
        newMap.set(message.claimId, updated);
        return newMap;
      });
    }
  }, []);

  const { postMessage } = useBroadcastChannel('claim-messaging', handleBroadcastMessage);

  const sendMessage = useCallback(
    (
      claimId: string,
      text: string,
      attachments: Attachment[],
      sender: SenderRole,
      receiver: SenderRole
    ) => {
      const newMessage: ClaimMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        claimId,
        sender,
        receiver,
        text,
        attachments,
        timestamp: Date.now(),
        read: false,
      };

      // Mark as processed to prevent duplicates
      processedMessageIds.current.add(newMessage.id);

      // Add to local state
      setMessages((prev) => {
        const newMap = new Map(prev);
        const claimMessages = newMap.get(claimId) || [];
        newMap.set(claimId, [...claimMessages, newMessage]);
        return newMap;
      });


      // Broadcast to other tabs
      postMessage({
        type: 'claim-message' as const,
        claimId,
        data: newMessage as unknown,
      });
    },
    [postMessage]
  );

  const markAsRead = useCallback(
    (claimId: string, userRole: SenderRole) => {
      setMessages((prev) => {
        const newMap = new Map(prev);
        const claimMessages = newMap.get(claimId) || [];
        const updated = claimMessages.map((msg) => {
          // Mark as read if message is for current user
          if (msg.receiver === userRole) {
            return { ...msg, read: true };
          }
          return msg;
        });
        newMap.set(claimId, updated);
        return newMap;
      });

      // Broadcast mark as read to other tabs
      postMessage({
        type: 'mark-read' as const,
        claimId,
      });
    },
    [postMessage]
  );

  const getUnreadCount = useCallback(
    (claimId: string, userRole: SenderRole): number => {
      const claimMessages = messages.get(claimId) || [];
      return claimMessages.filter(
        (msg) => msg.receiver === userRole && !msg.read
      ).length;
    },
    [messages]
  );

  const hasUnreadAlert = useCallback(
    (claimId: string, userRole: SenderRole): boolean => {
      const claimMessages = messages.get(claimId) || [];
      const unreadMessages = claimMessages.filter(
        (msg) => msg.receiver === userRole && !msg.read
      );

      if (unreadMessages.length === 0) return false;

      // Find oldest unread message
      const oldestUnread = unreadMessages.reduce((oldest, msg) =>
        msg.timestamp < oldest.timestamp ? msg : oldest
      );

      // Check if older than 24 hours
      const hoursSinceOldest = (Date.now() - oldestUnread.timestamp) / (1000 * 60 * 60);
      return hoursSinceOldest > 24;
    },
    [messages]
  );

  const getMessages = useCallback(
    (claimId: string): ClaimMessage[] => {
      return messages.get(claimId) || [];
    },
    [messages]
  );

  const value: ClaimsMessagingContextType = {
    messages,
    sendMessage,
    markAsRead,
    getUnreadCount,
    hasUnreadAlert,
    getMessages,
  };

  return (
    <ClaimsMessagingContext.Provider value={value}>
      {children}
    </ClaimsMessagingContext.Provider>
  );
}

export function useClaimsMessaging() {
  const context = useContext(ClaimsMessagingContext);
  if (context === undefined) {
    throw new Error('useClaimsMessaging must be used within a ClaimsMessagingProvider');
  }
  return context;
}

