import {
  apiRequest,
  clearAuthTokens,
  getRefreshToken,
  setAuthTokens,
} from "@/shared/api/client";

import type { User } from "../model/AuthContext";

interface ApiUser {
  id: string;
  name: string;
  role: User["role"];
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

export async function loginWithPassword(email: string, password: string) {
  clearAuthTokens();

  try {
    const response = await apiRequest<AuthResponse>("/auth/login", {
      body: JSON.stringify({ email, password }),
      method: "POST",
    });
    setAuthTokens(response);
    return response.user;
  } catch (error) {
    clearAuthTokens();
    throw error;
  }
}

export async function getCurrentUser() {
  return apiRequest<ApiUser>("/auth/me");
}

export async function logoutSession() {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    await apiRequest<void>("/auth/logout", {
      body: JSON.stringify({ refreshToken }),
      method: "POST",
    }).catch(() => undefined);
  }

  clearAuthTokens();
}
