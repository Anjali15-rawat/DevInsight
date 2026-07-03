/**
 * Central API Client for DevInsight Frontend.
 * Provides unified fetch wrappers, automatic JWT Authorization header injection,
 * token refreshing on 401 Unauthorized, and structured error throwing.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export class DevInsightApiError extends Error {
  status: number;
  data: any;
  requestId?: string;

  constructor(status: number, message: string, data?: any, requestId?: string) {
    super(message);
    this.name = "DevInsightApiError";
    this.status = status;
    this.data = data;
    this.requestId = requestId;
  }
}

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("devinsight_access_token");
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("devinsight_refresh_token");
};

export const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("devinsight_access_token", accessToken);
  localStorage.setItem("devinsight_refresh_token", refreshToken);
};

export const clearTokens = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("devinsight_access_token");
  localStorage.removeItem("devinsight_refresh_token");
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(url, { ...options, headers });

  // Handle 401 Unauthorized token refresh
  if (response.status === 401 && !endpoint.includes("/auth/")) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      if (newToken) {
        onRefreshed(newToken);
      }
    }

    const retryOriginalRequest = new Promise<T>((resolve, reject) => {
      subscribeTokenRefresh(async (newToken: string) => {
        try {
          headers["Authorization"] = `Bearer ${newToken}`;
          const retryRes = await fetch(url, { ...options, headers });
          if (!retryRes.ok) {
            const errData = await retryRes.json().catch(() => ({}));
            reject(
              new DevInsightApiError(
                retryRes.status,
                errData.message || "Request failed",
                errData,
                retryRes.headers.get("X-Request-ID") || undefined,
              ),
            );
            return;
          }
          const data = await retryRes.json();
          resolve(data as T);
        } catch (err) {
          reject(err);
        }
      });
    });

    return retryOriginalRequest;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new DevInsightApiError(
      response.status,
      errorData.message || errorData.detail || `Request failed with status ${response.status}`,
      errorData,
      response.headers.get("X-Request-ID") || undefined,
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
