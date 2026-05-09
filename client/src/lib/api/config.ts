// Single source of truth for the backend API base URL.
// In production, set NEXT_PUBLIC_API_BASE_URL in your hosting platform (e.g., Render).
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

// WebSocket (Socket.IO) connects to the same origin by default.
export const WS_URL = API_BASE_URL;
