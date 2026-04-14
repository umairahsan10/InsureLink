'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ClaimMessage, MessageSender, Attachment } from '@/types/messaging';
import { messagingApi, SendMessageRequest, InlineAttachment } from '@/lib/api/messaging';

interface ClaimsMessagingContextType {
  messages: Map<string, ClaimMessage[]>;
  unreadCounts: Map<string, number>;
  sendMessage: (claimId: string, data: SendMessageRequest, sender?: MessageSender, optimisticAttachments?: InlineAttachment[]) => Promise<ClaimMessage | null>;
  markAsRead: (claimId: string) => Promise<void>;
  getUnreadCount: (claimId: string) => number;
  hasUnreadAlert: (claimId: string) => boolean;
  getMessages: (claimId: string) => ClaimMessage[];
  fetchMessages: (claimId: string, page?: number, limit?: number) => Promise<void>;
  fetchUnreadCount: (claimId: string) => Promise<number>;
  addRealtimeMessage: (
    claimId: string,
    message: ClaimMessage,
    options?: { incrementUnread?: boolean; currentUserId?: string },
  ) => void;
  markMessagesReadLocally: (claimId: string) => void;
}

const ClaimsMessagingContext = createContext<ClaimsMessagingContextType | undefined>(undefined);

export function ClaimsMessagingProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Map<string, ClaimMessage[]>>(new Map());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const processedMessageIds = useRef<Set<string>>(new Set());

  const fetchMessages = useCallback(async (claimId: string, page = 1, limit = 50) => {
    try {
      const result = await messagingApi.getMessages(claimId, page, limit);
      setMessages((prev) => {
        const newMap = new Map(prev);
        newMap.set(claimId, result.data);
        // Track all fetched message IDs
        result.data.forEach((m) => processedMessageIds.current.add(m.id));
        return newMap;
      });
      // After fetching, messages sent by others are auto-marked as read by backend
      if (result.markedAsRead > 0) {
        setUnreadCounts((prev) => {
          const newMap = new Map(prev);
          newMap.set(claimId, 0);
          return newMap;
        });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, []);

  const fetchUnreadCount = useCallback(async (claimId: string): Promise<number> => {
    try {
      const result = await messagingApi.getUnreadCount(claimId);
      setUnreadCounts((prev) => {
        const newMap = new Map(prev);
        newMap.set(claimId, result.unreadCount);
        return newMap;
      });
      return result.unreadCount;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }, []);

  const sendMessage = useCallback(
    async (claimId: string, data: SendMessageRequest, sender?: MessageSender, optimisticAttachments?: InlineAttachment[]): Promise<ClaimMessage | null> => {
      // Optimistic update — show message instantly before the API responds
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      if (sender) {
        const optimisticAtts: Attachment[] = (optimisticAttachments || []).map((a, i) => ({
          id: `temp-att-${i}`,
          filename: a.filename,
          filePath: a.filePath,
          fileUrl: a.fileUrl,
          fileSizeBytes: a.fileSizeBytes,
        }));
        const optimistic: ClaimMessage = {
          id: tempId,
          claimId,
          senderId: sender.id,
          receiverId: null,
          messageText: data.messageText,
          messageType: 'text',
          isRead: true,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sender,
          attachments: optimisticAtts,
        };
        processedMessageIds.current.add(tempId);
        setMessages((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(claimId) || [];
          newMap.set(claimId, [...existing, optimistic]);
          return newMap;
        });
      }

      try {
        const newMessage = await messagingApi.sendMessage(claimId, data);
        processedMessageIds.current.add(newMessage.id);
        setMessages((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(claimId) || [];
          // Replace the optimistic placeholder; also drop any Socket.IO duplicate
          const deduped = existing.filter((m) => m.id !== tempId && m.id !== newMessage.id);
          newMap.set(claimId, [...deduped, newMessage]);
          return newMap;
        });
        return newMessage;
      } catch (error) {
        // Remove the optimistic message so the user sees the failure
        if (sender) {
          processedMessageIds.current.delete(tempId);
          setMessages((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(claimId) || [];
            newMap.set(claimId, existing.filter((m) => m.id !== tempId));
            return newMap;
          });
        }
        console.error('Failed to send message:', error);
        return null;
      }
    },
    [],
  );

  const markAsRead = useCallback(async (claimId: string) => {
    try {
      await messagingApi.markAsRead(claimId);
      setUnreadCounts((prev) => {
        const newMap = new Map(prev);
        newMap.set(claimId, 0);
        return newMap;
      });
      setMessages((prev) => {
        const newMap = new Map(prev);
        const claimMessages = newMap.get(claimId) || [];
        const updated = claimMessages.map((msg) => ({ ...msg, isRead: true }));
        newMap.set(claimId, updated);
        return newMap;
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, []);

  /**
   * Add a message received via WebSocket in real time.
   * Skips if we already have it (e.g. from our own send).
   */
  const addRealtimeMessage = useCallback((
    claimId: string,
    message: ClaimMessage,
    options?: { incrementUnread?: boolean; currentUserId?: string },
  ) => {
    if (processedMessageIds.current.has(message.id)) return;
    processedMessageIds.current.add(message.id);

    setMessages((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(claimId) || [];
      // Guard against duplicate if sendMessage already added this message
      if (existing.some((m) => m.id === message.id)) return prev;
      newMap.set(claimId, [...existing, message]);
      return newMap;
    });

    const incrementUnread = options?.incrementUnread ?? true;
    const isFromCurrentUser = !!options?.currentUserId && message.senderId === options.currentUserId;

    // Increment unread count only for incoming messages from other users
    if (incrementUnread && !isFromCurrentUser) {
      setUnreadCounts((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(claimId) || 0;
        newMap.set(claimId, current + 1);
        return newMap;
      });
    }
  }, []);

  /**
   * Mark messages as read locally (after WebSocket read receipt).
   */
  const markMessagesReadLocally = useCallback((claimId: string) => {
    setMessages((prev) => {
      const newMap = new Map(prev);
      const claimMessages = newMap.get(claimId) || [];
      const updated = claimMessages.map((msg) => ({ ...msg, isRead: true }));
      newMap.set(claimId, updated);
      return newMap;
    });
    setUnreadCounts((prev) => {
      const newMap = new Map(prev);
      newMap.set(claimId, 0);
      return newMap;
    });
  }, []);

  const getUnreadCount = useCallback(
    (claimId: string): number => {
      return unreadCounts.get(claimId) || 0;
    },
    [unreadCounts],
  );

  const hasUnreadAlert = useCallback(
    (claimId: string): boolean => {
      return (unreadCounts.get(claimId) || 0) > 0;
    },
    [unreadCounts],
  );

  const getMessages = useCallback(
    (claimId: string): ClaimMessage[] => {
      return messages.get(claimId) || [];
    },
    [messages],
  );

  const value: ClaimsMessagingContextType = {
    messages,
    unreadCounts,
    sendMessage,
    markAsRead,
    getUnreadCount,
    hasUnreadAlert,
    getMessages,
    fetchMessages,
    fetchUnreadCount,
    addRealtimeMessage,
    markMessagesReadLocally,
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

