import type { KanbanColumnResponse } from '../domain/contracts';
import type { KanbanColumn } from '../generated/prisma/client';

export function toKanbanColumnResponse(
  column: KanbanColumn,
): KanbanColumnResponse {
  return {
    createdAt: column.createdAt.toISOString(),
    id: column.id,
    isDone: column.isDone,
    name: column.name,
    projectId: column.projectId,
    rank: column.rank,
    updatedAt: column.updatedAt.toISOString(),
  };
}
