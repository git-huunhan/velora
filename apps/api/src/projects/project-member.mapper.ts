import { ProjectRole as ApiProjectRole } from '../domain/contracts/enums';
import type { ProjectMemberResponse } from '../domain/contracts';
import type { ProjectMember, User } from '../generated/prisma/client';
import { toUserSummary } from '../users/user.mapper';

const roleToApi = {
  ADMIN: ApiProjectRole.ADMIN,
  MEMBER: ApiProjectRole.MEMBER,
  OWNER: ApiProjectRole.OWNER,
  VIEWER: ApiProjectRole.VIEWER,
} as const;

type ProjectMemberWithUser = ProjectMember & { user: User };

export function toProjectMemberResponse(
  member: ProjectMemberWithUser,
): ProjectMemberResponse {
  return {
    createdAt: member.createdAt.toISOString(),
    projectId: member.projectId,
    role: roleToApi[member.role],
    updatedAt: member.updatedAt.toISOString(),
    user: toUserSummary(member.user),
  };
}
