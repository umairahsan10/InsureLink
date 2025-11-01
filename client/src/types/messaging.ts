export type SenderRole = 'hospital' | 'insurer';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  data: string; // base64 encoded
  size: number; // in bytes
}

export interface ClaimMessage {
  id: string;
  claimId: string;
  sender: SenderRole;
  receiver: SenderRole;
  text: string;
  attachments: Attachment[];
  timestamp: number; // Unix timestamp in milliseconds
  read: boolean;
}

export interface ClaimMessagingState {
  messages: Map<string, ClaimMessage[]>; // Map<claimId, messages[]>
  unreadCounts: Map<string, number>; // Map<claimId, unreadCount>
  lastMessageTimestamps: Map<string, number>; // Map<claimId, timestamp>
}

