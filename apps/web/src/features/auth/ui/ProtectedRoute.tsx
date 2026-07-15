import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../model/useAuth";

export function ProtectedRoute() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
