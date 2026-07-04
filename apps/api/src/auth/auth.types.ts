import type { UserRole } from '../generated/prisma/client';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export type AuthenticatedUser = AccessTokenPayload;
