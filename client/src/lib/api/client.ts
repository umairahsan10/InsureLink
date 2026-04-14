import { getAccessToken, getRefreshToken, setTokens } from "@/lib/auth/session";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiResponse<T> = {
  data: T;
  status: number;
};

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
      const res = await fetch(`${baseUrl}/api/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await res.json();
      const newAccessToken = data.data?.access_token || data.access_token;
      const newRefreshToken = data.data?.refresh_token || data.refresh_token;

      if (newAccessToken && newRefreshToken) {
        setTokens(newAccessToken, newRefreshToken);
        // Update the cookie for middleware
        document.cookie = `auth_token=${newAccessToken}; path=/; max-age=86400`;
        return newAccessToken;
      }

      throw new Error("Invalid token response");
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { method?: HttpMethod } = {},
): Promise<ApiResponse<T>> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
  const url = `${baseUrl}${path}`;
  let token = getAccessToken();

  // Only set Content-Type to application/json if body is not FormData
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  let res = await fetch(url, {
    credentials: "include",
    headers,
    ...options,
  });

  // If unauthorized and not already trying to refresh, attempt token refresh
  if (
    res.status === 401 &&
    !path.includes("/auth/refresh-token") &&
    !path.includes("/auth/login")
  ) {
    try {
      const newToken = await refreshAccessToken();
      // Retry the request with new token
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, {
        credentials: "include",
        headers,
        ...options,
      });
    } catch (error) {
      // Refresh failed, clear session and redirect to login
      if (typeof window !== "undefined") {
        localStorage.clear();
        document.cookie =
          "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }
  }

  if (!res.ok) {
    const text = await res.text();

    // Try to parse error response as JSON
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const errorData = JSON.parse(text);
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // If JSON parsing fails, use the raw text
      if (text) {
        errorMessage = text;
      }
    }

    const error = new Error(errorMessage);
    (error as any).statusCode = res.status;
    throw error;
  }
  const contentType = res.headers.get("content-type");
  const raw =
    contentType && contentType.includes("application/json")
      ? await res.json()
      : await res.text();
  // The server's TransformInterceptor wraps every response as { data: T, statusCode, message }
  // Unwrap it so callers receive T directly.
  const data =
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    "data" in raw &&
    "statusCode" in raw
      ? raw.data
      : raw;
  return { data: data as T, status: res.status };
}
