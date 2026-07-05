import { ProjectStatus as ApiProjectStatus } from '../domain/contracts/enums';
import type { ProjectResponse } from '../domain/contracts';
import type { Project } from '../generated/prisma/client';

const statusMap = {
  ACTIVE: ApiProjectStatus.ACTIVE,
  COMPLETED: ApiProjectStatus.COMPLETED,
  PLANNING: ApiProjectStatus.PLANNING,
} as const;

export function toProjectResponse(project: Project): ProjectResponse {
  return {
    archivedAt: project.archivedAt?.toISOString() ?? null,
    avatarUrl: project.avatarUrl,
    createdAt: project.createdAt.toISOString(),
    description: project.description,
    endDate: project.endDate?.toISOString() ?? null,
    id: project.id,
    key: project.key,
    name: project.name,
    startDate: project.startDate?.toISOString() ?? null,
    status: statusMap[project.status],
    updatedAt: project.updatedAt.toISOString(),
  };
}
