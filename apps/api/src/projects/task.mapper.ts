import { TaskPriority, TaskType } from '../domain/contracts/enums';
import type { TaskResponse } from '../domain/contracts';
import type { Task, User } from '../generated/prisma/client';
import { toUserSummary } from '../users/user.mapper';

const priorityToApi = {
  HIGH: TaskPriority.HIGH,
  LOW: TaskPriority.LOW,
  MEDIUM: TaskPriority.MEDIUM,
} as const;

const typeToApi = {
  BUG: TaskType.BUG,
  EPIC: TaskType.EPIC,
  SUBTASK: TaskType.SUBTASK,
  TASK: TaskType.TASK,
} as const;

type TaskWithUsers = Task & {
  assignee: User | null;
  reporter: User | null;
};

export function toTaskResponse(task: TaskWithUsers): TaskResponse {
  return {
    assignee: task.assignee ? toUserSummary(task.assignee) : null,
    code: task.code,
    columnId: task.columnId,
    createdAt: task.createdAt.toISOString(),
    description: task.description,
    dueDate: task.dueDate?.toISOString() ?? null,
    id: task.id,
    labels: task.labels,
    parentId: task.parentId,
    priority: priorityToApi[task.priority],
    projectId: task.projectId,
    rank: task.rank,
    reporter: task.reporter ? toUserSummary(task.reporter) : null,
    title: task.title,
    type: typeToApi[task.type],
    updatedAt: task.updatedAt.toISOString(),
  };
}
