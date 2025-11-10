export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiResponse<T> = {
  data: T;
  status: number;
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { method?: HttpMethod } = {}
): Promise<ApiResponse<T>> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }
  const contentType = res.headers.get("content-type");
  const data = contentType && contentType.includes("application/json") ? await res.json() : (await res.text());
  return { data: data as T, status: res.status };
}








