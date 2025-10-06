export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: string;
  text: string;
  ts: string;
}

export interface ChatThread {
  chatId: string;
  claimId: string;
  messages: ChatMessage[];
}

