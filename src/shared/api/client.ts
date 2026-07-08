const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

const ACCESS_TOKEN_KEY = "velora.accessToken";
const REFRESH_TOKEN_KEY = "velora.refreshToken";
let refreshRequest: Promise<boolean> | null = null;

export class ApiError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? "Request failed",
      response.status,
      payload?.code,
    );
  }

  return payload as T;
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    body: JSON.stringify({ refreshToken }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    clearAuthTokens();
    return false;
  }

  const tokens = await response.json();
  setAuthTokens(tokens);
  return true;
}

async function refreshAccessTokenOnce() {
  refreshRequest ??= refreshAccessToken().finally(() => {
    refreshRequest = null;
  });

  return refreshRequest;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAccessToken();

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const canRefresh =
    response.status === 401 &&
    path !== "/auth/login" &&
    path !== "/auth/logout" &&
    path !== "/auth/refresh" &&
    path !== "/auth/register";

  if (!canRefresh) {
    return parseResponse<T>(response);
  }

  const refreshed = await refreshAccessTokenOnce();
  if (!refreshed) return parseResponse<T>(response);

  const retryHeaders = new Headers(headers);
  const nextToken = getAccessToken();
  if (nextToken) {
    retryHeaders.set("Authorization", `Bearer ${nextToken}`);
  }

  return parseResponse<T>(
    await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: retryHeaders,
    }),
  );
}
