import { apiFetch } from "./client";
import { getAccessToken } from "@/lib/auth/session";

// ── Types matching backend response shapes ──────────────────────────────

export interface MessageSender {
  id: string;
  email: string;
  userRole: string;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  filename: string;
  filePath: string;
  fileUrl: string;
  fileSizeBytes: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  claimId: string;
  senderId: string;
  receiverId: string | null;
  messageText: string;
  messageType: "text" | "system" | "attachment";
  isRead: boolean;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  sender: MessageSender;
  attachments: MessageAttachment[];
}

export interface PaginatedMessages {
  data: ChatMessage[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  markedAsRead: number;
}

export interface InlineAttachment {
  filename: string;
  filePath: string;
  fileUrl: string;
  fileSizeBytes: number;
}

export interface SendMessageRequest {
  messageText: string;
  receiverId?: string;
  messageType?: "text" | "system" | "attachment";
  attachmentIds?: string[];
  attachments?: InlineAttachment[];
}

// ── API Functions ────────────────────────────────────────────────────────

const messagePath = (claimId: string) => `/api/v1/claims/${claimId}/messages`;

export const messagingApi = {
  async sendMessage(
    claimId: string,
    data: SendMessageRequest,
  ): Promise<ChatMessage> {
    const response = await apiFetch<ChatMessage>(messagePath(claimId), {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async getMessages(
    claimId: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedMessages> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await apiFetch<PaginatedMessages>(
      `${messagePath(claimId)}?${params}`,
    );
    return response.data;
  },

  async updateMessage(
    claimId: string,
    messageId: string,
    messageText: string,
  ): Promise<ChatMessage> {
    const response = await apiFetch<ChatMessage>(
      `${messagePath(claimId)}/${messageId}`,
      {
        method: "PUT",
        body: JSON.stringify({ messageText }),
      },
    );
    return response.data;
  },

  async deleteMessage(
    claimId: string,
    messageId: string,
  ): Promise<{ message: string; messageId: string }> {
    const response = await apiFetch<{ message: string; messageId: string }>(
      `${messagePath(claimId)}/${messageId}`,
      { method: "DELETE" },
    );
    return response.data;
  },

  async markAsRead(claimId: string): Promise<{ markedCount: number }> {
    const response = await apiFetch<{ markedCount: number }>(
      `${messagePath(claimId)}/read`,
      { method: "PATCH" },
    );
    return response.data;
  },

  async getUnreadCount(claimId: string): Promise<{ unreadCount: number }> {
    const response = await apiFetch<{ unreadCount: number }>(
      `${messagePath(claimId)}/unread-count`,
    );
    return response.data;
  },

  /**
   * Upload a chat attachment file via the standalone upload endpoint.
   */
  async uploadAttachment(
    file: File,
  ): Promise<{ filePath: string; fileUrl: string; fileSizeBytes: number }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "chat-attachments");

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
    const token = getAccessToken();

    const response = await fetch(`${baseUrl}/api/v1/upload`, {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message || "Failed to upload attachment");
    }

    const data = await response.json();
    const payload = data.data || data;
    return {
      filePath: payload.filePath,
      fileUrl: payload.fileUrl,
      fileSizeBytes: payload.fileSizeBytes,
    };
  },
};
