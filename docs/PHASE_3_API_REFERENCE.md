# Phase 3 API Reference — File Upload & Messaging Module

**Status:** Implementation Ready  
**Base URL:** `http://localhost:3001/api/v1`  
**Authentication:** All endpoints require JWT — use `@Roles()` guards

---

## Overview

Phase 3 covers two modules:

- **File Upload:** Standalone file upload/delete/metadata endpoints for chat attachments and general uploads. (Claim document upload remains in the Claims controller from Phase 2.)
- **Messaging:** Claim-scoped real-time chat between hospitals and insurers, with REST endpoints and WebSocket events.

---

## File Upload Module

### 1. Upload File

```
POST /v1/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital', 'insurer')`

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | The file to upload (max 10MB) |
| `folder` | string | No | Target folder: `chat-attachments` (default), `general` |

**Accepted MIME Types:**

- `application/pdf`
- `image/jpeg`
- `image/png`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)

**Response:** `201 Created`

```json
{
  "id": "generated-file-id",
  "originalFilename": "report.pdf",
  "filePath": "chat-attachments/1709902345678-abc123.pdf",
  "fileUrl": "https://vvgztikfyvriqoiyyazo.supabase.co/storage/v1/object/public/Insurelink/chat-attachments/1709902345678-abc123.pdf",
  "fileSizeBytes": 245000,
  "mimeType": "application/pdf",
  "uploadedBy": "uuid",
  "createdAt": "ISO 8601 timestamp"
}
```

---

### 2. Get File Metadata

```
GET /v1/upload/{filePath}/metadata
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital', 'insurer', 'corporate', 'admin')`

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `filePath` | string | URL-encoded file path within bucket (e.g., `chat-attachments%2F1709902345678-abc123.pdf`) |

**Response:** `200 OK`

```json
{
  "filePath": "chat-attachments/1709902345678-abc123.pdf",
  "publicUrl": "https://vvgztikfyvriqoiyyazo.supabase.co/storage/v1/object/public/Insurelink/chat-attachments/1709902345678-abc123.pdf",
  "exists": true
}
```

---

### 3. Delete File

```
DELETE /v1/upload/{filePath}
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital', 'insurer')`

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `filePath` | string | URL-encoded file path within bucket |

**Response:** `200 OK`

```json
{
  "message": "File deleted successfully",
  "filePath": "chat-attachments/1709902345678-abc123.pdf"
}
```

---

## Messaging Module

Chat is **claim-scoped** — all messages belong to a specific claim. Only hospitals and insurers involved in a claim can participate in the chat.

### 1. Send Message

```
POST /v1/claims/{claimId}/messages
Content-Type: application/json
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital', 'insurer')` — Must have access to the claim

**Request Body:**

```json
{
  "messageText": "string (required, 1-5000 chars)",
  "receiverId": "uuid (optional — defaults to the other party on the claim)",
  "messageType": "text | document_upload (optional, default: text)",
  "attachmentIds": [
    "uuid (optional — IDs of previously uploaded chat attachments)"
  ]
}
```

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "claimId": "uuid",
  "senderId": "uuid",
  "receiverId": "uuid",
  "messageText": "Please provide the discharge summary",
  "isRead": false,
  "timestamp": "ISO 8601 timestamp",
  "messageType": "text",
  "createdAt": "ISO 8601 timestamp",
  "sender": {
    "id": "uuid",
    "email": "dr.ali@hospital.com",
    "role": "hospital"
  },
  "attachments": []
}
```

**Side Effects:**

- Emits `claim-message-new` WebSocket event to all connected claim participants

---

### 2. Get Messages (Paginated)

```
GET /v1/claims/{claimId}/messages?page=1&limit=50
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital', 'insurer')` — Must have access to the claim

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Messages per page (max 100) |

**Response:** `200 OK` (ordered by timestamp descending — newest first)

```json
{
  "data": [
    {
      "id": "uuid",
      "claimId": "uuid",
      "senderId": "uuid",
      "receiverId": "uuid",
      "messageText": "Please provide the discharge summary",
      "isRead": true,
      "timestamp": "ISO 8601 timestamp",
      "messageType": "text",
      "createdAt": "ISO 8601 timestamp",
      "sender": {
        "id": "uuid",
        "email": "dr.ali@hospital.com",
        "role": "hospital"
      },
      "attachments": [
        {
          "id": "uuid",
          "filename": "discharge-summary.pdf",
          "fileUrl": "https://...",
          "fileSizeBytes": 120000,
          "createdAt": "ISO 8601 timestamp"
        }
      ]
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

**Side Effects:**

- Marks all unread messages from the other party as `isRead: true`
- Emits `claim-message-read` WebSocket event

---

### 3. Update Message (Edit)

```
PUT /v1/claims/{claimId}/messages/{messageId}
Content-Type: application/json
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital', 'insurer')` — Only the **sender** can edit their own message

**Request Body:**

```json
{
  "messageText": "string (required, 1-5000 chars)"
}
```

**Constraints:**

- Only the sender can edit their own message
- `system` type messages cannot be edited
- Attachments cannot be modified via this endpoint

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "claimId": "uuid",
  "senderId": "uuid",
  "receiverId": "uuid",
  "messageText": "Updated message text",
  "isRead": false,
  "timestamp": "ISO 8601 timestamp",
  "messageType": "text",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

---

### 4. Delete Message

```
DELETE /v1/claims/{claimId}/messages/{messageId}
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital', 'insurer')` — Only the **sender** can delete their own message

**Constraints:**

- Only the sender can delete their own message
- `system` type messages cannot be deleted
- Attachments are cascade-deleted with the message

**Response:** `200 OK`

```json
{
  "message": "Message deleted successfully",
  "messageId": "uuid"
}
```

---

### 5. Mark Messages as Read

```
PATCH /v1/claims/{claimId}/messages/read
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital', 'insurer')` — Must have access to the claim

**Description:** Marks all unread messages sent by others in this claim as read.

**Response:** `200 OK`

```json
{
  "markedCount": 5
}
```

**Side Effects:**

- Emits `claim-message-read` WebSocket event

---

### 6. Get Unread Count

```
GET /v1/claims/{claimId}/messages/unread-count
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital', 'insurer')` — Must have access to the claim

**Response:** `200 OK`

```json
{
  "unreadCount": 3
}
```

---

## WebSocket Events

**Gateway:** `ws://localhost:3001` (Socket.IO)  
**CORS:** `origin: *`

### Connection & Room Management

Clients must join a claim-specific room to receive messages for that claim.

**Client → Server: Join Claim Room**

```json
Event: "join-claim-room"
Data: { "claimId": "uuid" }
```

**Client → Server: Leave Claim Room**

```json
Event: "leave-claim-room"
Data: { "claimId": "uuid" }
```

---

### Events

#### 1. `claim-message-new` (Server → Client)

Emitted when a new message is sent in a claim chat.

```json
{
  "id": "uuid",
  "claimId": "uuid",
  "senderId": "uuid",
  "receiverId": "uuid",
  "messageText": "Please upload the discharge summary",
  "isRead": false,
  "timestamp": "ISO 8601 timestamp",
  "messageType": "text",
  "sender": {
    "id": "uuid",
    "email": "dr.ali@hospital.com",
    "role": "hospital"
  },
  "attachments": []
}
```

**Room:** `claim-{claimId}`

---

#### 2. `claim-message-read` (Server → Client)

Emitted when a user reads messages in a claim chat.

```json
{
  "claimId": "uuid",
  "readBy": "uuid",
  "readAt": "ISO 8601 timestamp",
  "markedCount": 5
}
```

**Room:** `claim-{claimId}`

---

#### 3. `user-typing` (Client → Server → Client)

Typing indicator for live chat.

**Client sends:**

```json
Event: "user-typing"
Data: {
  "claimId": "uuid",
  "userId": "uuid",
  "isTyping": true
}
```

**Server broadcasts to room:**

```json
Event: "user-typing"
Data: {
  "claimId": "uuid",
  "userId": "uuid",
  "isTyping": true
}
```

**Room:** `claim-{claimId}` (excludes sender)

---

## Error Responses

All errors follow this format:

```json
{
  "message": "Error description",
  "statusCode": 400 | 401 | 403 | 404 | 413 | 500,
  "error": "BadRequestException | UnauthorizedException | ForbiddenException | NotFoundException"
}
```

### Common Error Messages

| Status | Message                                 | Scenario                          |
| ------ | --------------------------------------- | --------------------------------- |
| `400`  | `Message text is required`              | Empty message body                |
| `400`  | `Invalid file type`                     | Unsupported MIME type             |
| `400`  | `System messages cannot be edited`      | Edit attempt on system message    |
| `400`  | `System messages cannot be deleted`     | Delete attempt on system message  |
| `401`  | `Unauthorized`                          | Missing or invalid JWT            |
| `403`  | `You do not have access to this claim`  | User not party to claim           |
| `403`  | `You can only edit your own messages`   | Edit attempt on other's message   |
| `403`  | `You can only delete your own messages` | Delete attempt on other's message |
| `404`  | `Claim not found`                       | Invalid claim ID                  |
| `404`  | `Message not found`                     | Invalid message ID                |
| `404`  | `File not found`                        | Invalid file path                 |
| `413`  | `File too large (max 10MB)`             | File exceeds size limit           |

---

## Testing with Postman

### Environment Variables

```
BASE_URL = http://localhost:3001/api/v1
AUTH_TOKEN_HOSPITAL = <jwt-from-hospital-login>
AUTH_TOKEN_INSURER = <jwt-from-insurer-login>
CLAIM_ID = <uuid-of-existing-claim>
MESSAGE_ID = <uuid-from-send>
```

### Test Flow

#### File Upload Flow

1. **POST {{BASE_URL}}/upload** → Upload a file (multipart)
2. **GET {{BASE_URL}}/upload/{filePath}/metadata** → Check metadata
3. **DELETE {{BASE_URL}}/upload/{filePath}** → Delete the file

#### Messaging Flow (Hospital ↔ Insurer Chat)

1. **Login as Hospital** → Get JWT
2. **POST {{BASE_URL}}/claims/{{CLAIM_ID}}/messages** → Send message
3. **Login as Insurer** → Get JWT
4. **GET {{BASE_URL}}/claims/{{CLAIM_ID}}/messages** → List messages (auto-marks as read)
5. **POST {{BASE_URL}}/claims/{{CLAIM_ID}}/messages** → Reply
6. **PUT {{BASE_URL}}/claims/{{CLAIM_ID}}/messages/{{MESSAGE_ID}}** → Edit message
7. **DELETE {{BASE_URL}}/claims/{{CLAIM_ID}}/messages/{{MESSAGE_ID}}** → Delete message

#### WebSocket Test (Socket.IO Client)

1. Connect: `io("ws://localhost:3001")`
2. Join room: `socket.emit("join-claim-room", { claimId: "uuid" })`
3. Listen: `socket.on("claim-message-new", (data) => console.log(data))`
4. Send message via REST → Verify WebSocket receives it
5. Typing: `socket.emit("user-typing", { claimId: "uuid", userId: "uuid", isTyping: true })`

---

## Endpoint Summary

| #   | Method | Endpoint                                    | Role                                | Description        |
| --- | ------ | ------------------------------------------- | ----------------------------------- | ------------------ |
| 1   | POST   | `/v1/upload`                                | hospital, insurer                   | Upload file        |
| 2   | GET    | `/v1/upload/:filePath/metadata`             | hospital, insurer, corporate, admin | Get file metadata  |
| 3   | DELETE | `/v1/upload/:filePath`                      | hospital, insurer                   | Delete file        |
| 4   | POST   | `/v1/claims/:claimId/messages`              | hospital, insurer                   | Send message       |
| 5   | GET    | `/v1/claims/:claimId/messages`              | hospital, insurer                   | List messages      |
| 6   | PUT    | `/v1/claims/:claimId/messages/:messageId`   | hospital, insurer                   | Edit own message   |
| 7   | DELETE | `/v1/claims/:claimId/messages/:messageId`   | hospital, insurer                   | Delete own message |
| 8   | PATCH  | `/v1/claims/:claimId/messages/read`         | hospital, insurer                   | Mark as read       |
| 9   | GET    | `/v1/claims/:claimId/messages/unread-count` | hospital, insurer                   | Unread count       |

### WebSocket Events

| Event                | Direction       | Description                |
| -------------------- | --------------- | -------------------------- |
| `join-claim-room`    | Client → Server | Join claim chat room       |
| `leave-claim-room`   | Client → Server | Leave claim chat room      |
| `claim-message-new`  | Server → Client | New message broadcast      |
| `claim-message-read` | Server → Client | Messages read notification |
| `user-typing`        | Bidirectional   | Typing indicator           |

---

## Files Created/Modified

### New Files

| File                                                    | Description         |
| ------------------------------------------------------- | ------------------- |
| `file-upload/dto/upload-response.dto.ts`                | Upload response DTO |
| `messaging/dto/send-message.dto.ts`                     | Send message DTO    |
| `messaging/dto/update-message.dto.ts`                   | Update message DTO  |
| `messaging/dto/message-filter.dto.ts`                   | Query filter DTO    |
| `messaging/repositories/chat-messages.repository.ts`    | Message CRUD        |
| `messaging/repositories/chat-attachments.repository.ts` | Attachment CRUD     |
| `messaging/messaging.gateway.ts`                        | WebSocket handler   |

### Modified Files

| File                                    | Changes                   |
| --------------------------------------- | ------------------------- |
| `file-upload/file-upload.controller.ts` | 3 endpoints implemented   |
| `file-upload/file-upload.module.ts`     | Controller registered     |
| `messaging/messaging.controller.ts`     | 6 endpoints implemented   |
| `messaging/messaging.service.ts`        | Full business logic       |
| `messaging/messaging.module.ts`         | Providers registered      |
| `websockets/gateway.ts`                 | Messaging events added    |
| `websockets/websockets.module.ts`       | Gateway + providers wired |

---

**Last Updated:** March 8, 2026  
**Phase:** 3 (File Upload & Messaging)  
**Previous Phase:** 2 (Claims Core)  
**Next Phase:** 4 (Notifications + Audit + Analytics)
