import type { ReactNode } from "react";
import { useRole } from "../hooks/useRole";

interface RoleGuardProps {
  allowedRoles: ("admin" | "user")[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { role } = useRole();

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
