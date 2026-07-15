import { useEffect, useState, type ReactNode } from "react";

import { AuthContext, type User } from "./AuthContext";
import {
  getCurrentUser,
  loginWithPassword,
  logoutSession,
} from "../api/authApi";
import { getAccessToken, getRefreshToken } from "@/shared/api/client";

interface AuthProviderProps {
  children: ReactNode;
}

let currentUserRequest: Promise<User> | null = null;

function getCurrentUserOnce() {
  currentUserRequest ??= getCurrentUser().finally(() => {
    currentUserRequest = null;
  });

  return currentUserRequest;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!getAccessToken() && !getRefreshToken()) {
      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    getCurrentUserOnce()
      .then((currentUser) => {
        if (!mounted) return;
        setUser(currentUser);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        localStorage.removeItem("user");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setUser(null);
    localStorage.removeItem("user");

    try {
      const currentUser = await loginWithPassword(email, password);
      setUser(currentUser);
      return { success: true };
    } catch (error) {
      setUser(null);
      localStorage.removeItem("user");
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Invalid email or password",
      };
    }
  };

  const logout = async () => {
    await logoutSession();
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
