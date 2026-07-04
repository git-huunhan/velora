import { UserRole as ApiUserRole } from '../domain/contracts/enums';
import type { UserResponse, UserSummary } from '../domain/contracts';
import type { User } from '../generated/prisma/client';

export function toUserSummary(
  user: Pick<User, 'avatarUrl' | 'displayName' | 'id'>,
): UserSummary {
  return {
    avatarUrl: user.avatarUrl,
    id: user.id,
    name: user.displayName,
  };
}

export function toUserResponse(user: User): UserResponse {
  return {
    ...toUserSummary(user),
    createdAt: user.createdAt.toISOString(),
    email: user.email,
    role: user.role === 'ADMIN' ? ApiUserRole.ADMIN : ApiUserRole.USER,
    updatedAt: user.updatedAt.toISOString(),
  };
}
