import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProjectColumn,
  deleteProjectColumn,
  getProjectColumns,
  reorderProjectColumns,
  updateProjectColumn,
} from "../api/workflowApi";
import type { KanbanColumn } from "./types";

export const workflowKeys = {
  byProject: (projectId: string) => ["workflow", projectId] as const,
};

export function useProjectColumns(projectId: string) {
  return useQuery({
    queryKey: workflowKeys.byProject(projectId),
    queryFn: () => getProjectColumns(projectId),
    enabled: !!projectId,
    staleTime: Infinity,
  });
}

export function useCreateColumn(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => createProjectColumn(projectId, title),
    onSuccess: (column) =>
      client.setQueryData<KanbanColumn[]>(
        workflowKeys.byProject(projectId),
        (current = []) => [...current, column],
      ),
  });
}

export function useUpdateColumn(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      columnId,
      data,
    }: {
      columnId: string;
      data: Partial<Pick<KanbanColumn, "title" | "isDone">>;
    }) => updateProjectColumn(projectId, columnId, data),
    onSuccess: (updated) =>
      client.setQueryData<KanbanColumn[]>(
        workflowKeys.byProject(projectId),
        (current = []) =>
          current.map((column) => ({
            ...column,
            ...(column.id === updated.id ? updated : {}),
            isDone: updated.isDone ? column.id === updated.id : column.isDone,
          })),
      ),
  });
}

export function useReorderColumns(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (columnIds: string[]) =>
      reorderProjectColumns(projectId, columnIds),
    onMutate: (columnIds) => {
      const key = workflowKeys.byProject(projectId);
      const previous = client.getQueryData<KanbanColumn[]>(key);
      client.setQueryData<KanbanColumn[]>(key, (current = []) =>
        columnIds.map((id, order) => ({
          ...current.find((column) => column.id === id)!,
          order,
        })),
      );
      return { previous };
    },
    onError: (_error, _ids, context) =>
      client.setQueryData(workflowKeys.byProject(projectId), context?.previous),
  });
}

export function useDeleteColumn(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (columnId: string) => deleteProjectColumn(projectId, columnId),
    onSuccess: (columnId) =>
      client.setQueryData<KanbanColumn[]>(
        workflowKeys.byProject(projectId),
        (current = []) => current.filter((column) => column.id !== columnId),
      ),
  });
}
