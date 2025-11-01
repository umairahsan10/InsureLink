'use client';

import { useState } from 'react';
import { SenderRole } from '@/types/messaging';
import { useClaimsMessaging } from '@/contexts/ClaimsMessagingContext';
import ClaimChatModal from './ClaimChatModal';
import UnreadBadge from './UnreadBadge';

interface MessageButtonProps {
  claimId: string;
  userRole: SenderRole;
}

export default function MessageButton({ claimId, userRole }: MessageButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getUnreadCount, hasUnreadAlert } = useClaimsMessaging();

  const unreadCount = getUnreadCount(claimId, userRole);
  const alert = hasUnreadAlert(claimId, userRole);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="relative inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
        title="Open messages"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <UnreadBadge count={unreadCount} hasAlert={alert} />
      </button>

      <ClaimChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        claimId={claimId}
        userRole={userRole}
      />
    </>
  );
}

