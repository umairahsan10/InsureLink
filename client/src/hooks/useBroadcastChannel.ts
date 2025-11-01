'use client';

import { useEffect, useRef, useCallback } from 'react';

interface BroadcastMessage {
  type: 'claim-message' | 'mark-read';
  claimId: string;
  data?: unknown;
}

export function useBroadcastChannel(
  channelName: string,
  onMessage?: (message: BroadcastMessage) => void
) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // Check if BroadcastChannel is supported
    if (typeof BroadcastChannel === 'undefined') {
      // Fallback to localStorage events
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === `broadcast-${channelName}` && e.newValue) {
          try {
            const message = JSON.parse(e.newValue) as BroadcastMessage;
            onMessage?.(message);
          } catch (error) {
            console.error('Error parsing broadcast message:', error);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }

    // Use BroadcastChannel API
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      onMessage?.(event.data as BroadcastMessage);
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [channelName, onMessage]);

  const postMessage = useCallback(
    (message: BroadcastMessage) => {
      if (channelRef.current) {
        channelRef.current.postMessage(message);
      } else if (typeof BroadcastChannel === 'undefined') {
        // Fallback: use localStorage
        try {
          localStorage.setItem(
            `broadcast-${channelName}`,
            JSON.stringify(message)
          );
          localStorage.removeItem(`broadcast-${channelName}`);
        } catch (error) {
          console.error('Error posting broadcast message:', error);
        }
      }
    },
    [channelName]
  );

  return { postMessage };
}

