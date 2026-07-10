import { getUserAvatarUrl } from "@/features/auth/model/userAvatar";
import { apiRequest } from "@/shared/api/client";

import type { Task, TaskStatus, TaskUpdateData } from "../model/types";

interface ApiUserSummary {
  avatarUrl: string | null;
  id: string;
  name: string;
}

interface ApiTask {
  assignee: ApiUserSummary | null;
  code: string;
  columnId: string;
  createdAt: string;
  description: string;
  dueDate: string | null;
  id: string;
  labels: string[];
  parentId: string | null;
  priority: "low" | "medium" | "high";
  projectId: string;
  rank: string;
  reporter: ApiUserSummary | null;
  title: string;
  type: "task" | "epic" | "bug" | "subtask";
  updatedAt: string;
}

interface ApiTaskList {
  data: ApiTask[];
}

type CreateTaskData = Omit<
  Task,
  "id" | "createdAt" | "code" | "assignee" | "reporter" | "order"
> & {
  afterTaskId?: string;
  order?: number;
};

const taskCache = new Map<string, Task>();

function toUser(user: ApiUserSummary | null) {
  return user
    ? {
        avatarUrl: getUserAvatarUrl(user),
        id: user.id,
        name: user.name,
      }
    : undefined;
}

function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : undefined;
}

function rankToOrder(rank: string, fallback: number) {
  const numericRank = Number(rank.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numericRank) && numericRank > 0
    ? numericRank
    : fallback + 1;
}

function toTask(apiTask: ApiTask, fallbackOrder: number): Task {
  const assignee = toUser(apiTask.assignee);
  const reporter = toUser(apiTask.reporter);
  const task: Task = {
    assignee,
    assigneeId: assignee?.id,
    code: apiTask.code,
    createdAt: apiTask.createdAt,
    description: apiTask.description,
    dueDate: dateOnly(apiTask.dueDate),
    id: apiTask.id,
    labels: apiTask.labels,
    order: rankToOrder(apiTask.rank, fallbackOrder),
    parentId: apiTask.parentId ?? undefined,
    priority: apiTask.priority,
    projectId: apiTask.projectId,
    reporter,
    reporterId: reporter?.id,
    status: apiTask.columnId as TaskStatus,
    title: apiTask.title,
    type: apiTask.type,
    updatedAt: apiTask.updatedAt,
  };
  taskCache.set(task.id, task);
  return task;
}

function toIsoDate(value?: string | null) {
  return value ? new Date(value).toISOString() : value;
}

function toTaskPayload(data: TaskUpdateData) {
  return {
    assigneeId: data.assigneeId,
    columnId: data.status,
    description: data.description,
    dueDate: toIsoDate(data.dueDate),
    labels: data.labels,
    parentId: data.parentId,
    priority: data.priority,
    reporterId: data.reporterId,
    title: data.title,
    type: data.type,
  };
}

function getCachedTaskOrThrow(taskId: string) {
  const task = taskCache.get(taskId);
  if (!task) throw new Error("Task must be loaded before it can be changed");
  return task;
}

export function getCachedTaskProjectId(taskId: string): string | undefined {
  return taskCache.get(taskId)?.projectId;
}
export async function getTasksByProjectId(projectId: string): Promise<Task[]> {
  const response = await apiRequest<ApiTaskList>(
    `/projects/${projectId}/tasks`,
  );
  return response.data.map((task, index) => toTask(task, index));
}

export async function updateTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
): Promise<Task> {
  const task = getCachedTaskOrThrow(taskId);
  if (task.status === newStatus) return task;
  return moveTask(taskId, {
    targetColumnId: newStatus,
    targetParentId: task.parentId ?? null,
  });
}

export async function createTask(data: CreateTaskData): Promise<Task> {
  const { status, ...taskData } = data;
  const created = await apiRequest<ApiTask>(
    `/projects/${data.projectId}/tasks`,
    {
      body: JSON.stringify({
        assigneeId: taskData.assigneeId ?? null,
        columnId: status,
        description: taskData.description ?? "",
        dueDate: toIsoDate(taskData.dueDate) ?? null,
        labels: taskData.labels ?? [],
        parentId: taskData.parentId ?? null,
        priority: taskData.priority ?? "medium",
        title: taskData.title,
        type: taskData.type ?? "task",
      }),
      method: "POST",
    },
  );
  return toTask(created, Number.MAX_SAFE_INTEGER);
}

export async function updateTask(
  taskId: string,
  data: TaskUpdateData,
): Promise<Task> {
  const task = getCachedTaskOrThrow(taskId);
  const updated = await apiRequest<ApiTask>(
    `/projects/${task.projectId}/tasks/${taskId}`,
    {
      body: JSON.stringify(toTaskPayload(data)),
      method: "PATCH",
    },
  );
  return toTask(updated, task.order);
}

export async function moveTask(
  taskId: string,
  data: {
    afterTaskId?: string;
    beforeTaskId?: string;
    targetColumnId: TaskStatus;
    targetParentId?: string | null;
  },
): Promise<Task> {
  const task = getCachedTaskOrThrow(taskId);
  const moved = await apiRequest<ApiTask>(
    `/projects/${task.projectId}/tasks/${taskId}/move`,
    {
      body: JSON.stringify({
        afterTaskId: data.afterTaskId,
        beforeTaskId: data.beforeTaskId,
        expectedUpdatedAt: task.updatedAt,
        targetColumnId: data.targetColumnId,
        targetParentId: data.targetParentId ?? null,
      }),
      method: "POST",
    },
  );
  return toTask(moved, task.order);
}

export async function deleteTask(taskId: string): Promise<void> {
  const task = getCachedTaskOrThrow(taskId);
  await apiRequest<void>(`/projects/${task.projectId}/tasks/${taskId}`, {
    method: "DELETE",
  });
  taskCache.delete(taskId);
}
