export type SenderRole = 'hospital' | 'insurer';

export interface MessageSender {
  id: string;
  email: string;
  userRole: string;
}

export interface Attachment {
  id: string;
  filename: string;
  filePath: string;
  fileUrl: string;
  fileSizeBytes: number;
  messageId?: string;
  createdAt?: string;
}

export interface ClaimMessage {
  id: string;
  claimId: string;
  senderId: string;
  receiverId: string | null;
  messageText: string;
  messageType: 'text' | 'system' | 'attachment';
  isRead: boolean;
  timestamp: string; // ISO string from backend
  createdAt: string;
  updatedAt: string;
  sender: MessageSender;
  attachments: Attachment[];
}

export interface ClaimMessagingState {
  messages: Map<string, ClaimMessage[]>; // Map<claimId, messages[]>
  unreadCounts: Map<string, number>; // Map<claimId, unreadCount>
}

