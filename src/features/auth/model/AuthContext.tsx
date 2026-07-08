import { createContext } from "react";

export interface User {
  id: string;
  name: string;
  role: "admin" | "user";
}

export interface AuthContextValue {
  isLoading: boolean;
  user: User | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
