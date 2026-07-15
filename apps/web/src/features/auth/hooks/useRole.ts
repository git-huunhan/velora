import { useAuth } from "../model/useAuth";

export function useRole() {
  const { user } = useAuth();

  return {
    role: user?.role ?? null,
    isAdmin: user?.role === "admin",
    isUser: user?.role === "user",
  };
}
