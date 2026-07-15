import { ProjectRole as ApiProjectRole } from '../domain/contracts/enums';
import type {
  ProjectCapabilities,
  ProjectMemberResponse,
} from '../domain/contracts';
import type { ProjectMember, User } from '../generated/prisma/client';
import { toUserSummary } from '../users/user.mapper';
import {
  getProjectPermissions,
  ProjectPermission,
} from '../domain/policies/project-permission.policy';

const roleToApi = {
  ADMIN: ApiProjectRole.ADMIN,
  MEMBER: ApiProjectRole.MEMBER,
  OWNER: ApiProjectRole.ADMIN,
  VIEWER: ApiProjectRole.VIEWER,
} as const;

type ProjectMemberWithUser = ProjectMember & { user: User };

function toProjectCapabilities(role: ApiProjectRole): ProjectCapabilities {
  const permissions = new Set(getProjectPermissions(role));

  return {
    canCreateWorkItems: permissions.has(ProjectPermission.CREATE_WORK_ITEMS),
    canDeleteProject: permissions.has(ProjectPermission.DELETE_PROJECT),
    canDeleteWorkItems: permissions.has(ProjectPermission.DELETE_WORK_ITEMS),
    canManageMembers: permissions.has(ProjectPermission.MANAGE_MEMBERS),
    canManageWorkflow: permissions.has(ProjectPermission.MANAGE_WORKFLOW),
    canReadProject: permissions.has(ProjectPermission.READ_PROJECT),
    canReadWorkItems: permissions.has(ProjectPermission.READ_WORK_ITEMS),
    canUpdateProject: permissions.has(ProjectPermission.UPDATE_PROJECT),
    canUpdateWorkItems: permissions.has(ProjectPermission.UPDATE_WORK_ITEMS),
  };
}

export function toProjectMemberResponse(
  member: ProjectMemberWithUser,
): ProjectMemberResponse {
  const role = roleToApi[member.role];

  return {
    capabilities: toProjectCapabilities(role),
    createdAt: member.createdAt.toISOString(),
    projectId: member.projectId,
    affectedAssignedTaskCount: 0,
    role,
    updatedAt: member.updatedAt.toISOString(),
    user: toUserSummary(member.user),
  };
}
