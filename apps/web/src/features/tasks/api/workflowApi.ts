import { apiRequest } from "@/shared/api/client";

import type { KanbanColumn, TaskStatus } from "../model/types";

interface ApiKanbanColumn {
  createdAt: string;
  id: string;
  isDone: boolean;
  name: string;
  projectId: string;
  rank: string;
  updatedAt: string;
}

interface ApiKanbanColumnList {
  data: ApiKanbanColumn[];
}

const columnCache = new Map<string, KanbanColumn[]>();

function rankToOrder(rank: string, fallback: number) {
  const numericRank = Number(rank.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numericRank) && numericRank > 0
    ? numericRank
    : fallback;
}

function toColumn(apiColumn: ApiKanbanColumn, fallbackOrder: number) {
  return {
    id: apiColumn.id as TaskStatus,
    isDone: apiColumn.isDone,
    order: rankToOrder(apiColumn.rank, fallbackOrder),
    title: apiColumn.name,
    updatedAt: apiColumn.updatedAt,
  } satisfies KanbanColumn;
}

async function refreshProjectColumns(projectId: string) {
  const response = await apiRequest<ApiKanbanColumnList>(
    `/projects/${projectId}/columns`,
  );
  const columns = response.data
    .map((column, index) => toColumn(column, index))
    .sort((a, b) => a.order - b.order);
  columnCache.set(projectId, columns);
  return columns;
}

function getCachedColumn(projectId: string, columnId: string) {
  return columnCache.get(projectId)?.find((column) => column.id === columnId);
}

export async function getProjectColumns(projectId: string) {
  return refreshProjectColumns(projectId);
}

export async function createProjectColumn(projectId: string, title: string) {
  const created = await apiRequest<ApiKanbanColumn>(
    `/projects/${projectId}/columns`,
    {
      body: JSON.stringify({ name: title.trim() }),
      method: "POST",
    },
  );
  await refreshProjectColumns(projectId);
  return toColumn(created, Number.MAX_SAFE_INTEGER);
}

export async function updateProjectColumn(
  projectId: string,
  columnId: string,
  data: Partial<Pick<KanbanColumn, "title" | "isDone">>,
) {
  const updated = await apiRequest<ApiKanbanColumn>(
    `/projects/${projectId}/columns/${columnId}`,
    {
      body: JSON.stringify({
        isDone: data.isDone,
        name: data.title,
      }),
      method: "PATCH",
    },
  );
  await refreshProjectColumns(projectId);
  return toColumn(updated, getCachedColumn(projectId, columnId)?.order ?? 0);
}

export async function reorderProjectColumns(
  projectId: string,
  columnIds: string[],
) {
  const current =
    columnCache.get(projectId) ?? (await refreshProjectColumns(projectId));
  const previousIndexById = new Map(
    current.map((column, index) => [String(column.id), index]),
  );
  const movedColumnId = columnIds.reduce<string | null>(
    (candidate, id, index) => {
      const previousIndex = previousIndexById.get(id);
      if (previousIndex === undefined || previousIndex === index)
        return candidate;
      if (!candidate) return id;

      const candidateDistance = Math.abs(
        (previousIndexById.get(candidate) ?? index) -
          columnIds.indexOf(candidate),
      );
      const distance = Math.abs(previousIndex - index);
      return distance > candidateDistance ? id : candidate;
    },
    null,
  );

  if (!movedColumnId) return current;

  const movedIndex = columnIds.indexOf(movedColumnId);
  const movedColumn = current.find(
    (column) => String(column.id) === movedColumnId,
  );
  if (!movedColumn?.updatedAt) return current;

  await apiRequest<ApiKanbanColumn>(
    `/projects/${projectId}/columns/${movedColumnId}/move`,
    {
      body: JSON.stringify({
        afterColumnId: movedIndex > 0 ? columnIds[movedIndex - 1] : undefined,
        beforeColumnId:
          movedIndex < columnIds.length - 1
            ? columnIds[movedIndex + 1]
            : undefined,
        expectedUpdatedAt: movedColumn.updatedAt,
      }),
      method: "POST",
    },
  );

  return refreshProjectColumns(projectId);
}

export async function deleteProjectColumn(projectId: string, columnId: string) {
  await apiRequest<void>(`/projects/${projectId}/columns/${columnId}`, {
    method: "DELETE",
  });
  await refreshProjectColumns(projectId);
  return columnId;
}
