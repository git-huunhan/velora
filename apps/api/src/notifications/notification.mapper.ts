import { NotificationType, TaskType } from '../domain/contracts/enums';
import type { NotificationResponse } from '../domain/contracts';
import type {
  KanbanColumn,
  Notification,
  Project,
  Task,
  User,
} from '../generated/prisma/client';
import { toUserSummary } from '../users/user.mapper';

const typeToApi = {
  PROJECT_MEMBER_ADDED: NotificationType.PROJECT_MEMBER_ADDED,
  TASK_ASSIGNED: NotificationType.TASK_ASSIGNED,
  TASK_COMMENTED: NotificationType.TASK_COMMENTED,
  TASK_STATUS_CHANGED: NotificationType.TASK_STATUS_CHANGED,
} as const;

const taskTypeToApi = {
  BUG: TaskType.BUG,
  EPIC: TaskType.EPIC,
  SUBTASK: TaskType.SUBTASK,
  TASK: TaskType.TASK,
} as const;
type NotificationWithContext = Notification & {
  actor: User | null;
  project: Pick<Project, 'id' | 'key' | 'name'> | null;
  task:
    | (Pick<Task, 'id' | 'code' | 'title' | 'type'> & {
        column: Pick<KanbanColumn, 'name'> | null;
      })
    | null;
};

function toMetadata(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function toNotificationResponse(
  notification: NotificationWithContext,
): NotificationResponse {
  return {
    actor: notification.actor ? toUserSummary(notification.actor) : null,
    createdAt: notification.createdAt.toISOString(),
    id: notification.id,
    message: notification.message,
    metadata: toMetadata(notification.metadata),
    project: notification.project
      ? {
          id: notification.project.id,
          key: notification.project.key,
          name: notification.project.name,
        }
      : null,
    readAt: notification.readAt?.toISOString() ?? null,
    task: notification.task
      ? {
          code: notification.task.code,
          columnName: notification.task.column?.name ?? null,
          id: notification.task.id,
          title: notification.task.title,
          type: taskTypeToApi[notification.task.type],
        }
      : null,
    title: notification.title,
    type: typeToApi[notification.type],
  };
}
