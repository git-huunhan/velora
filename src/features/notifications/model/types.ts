export type NotificationType =
  | "project_member_added"
  | "task_assigned"
  | "task_commented"
  | "task_status_changed";

export interface NotificationUserSummary {
  avatarUrl?: string;
  id: string;
  name: string;
}

export interface NotificationProjectSummary {
  id: string;
  key: string;
  name: string;
}

export interface NotificationTaskSummary {
  code: string;
  columnName?: string | null;
  id: string;
  title: string;
  type: "task" | "epic" | "bug" | "subtask";
}

export interface NotificationItem {
  actor: NotificationUserSummary | null;
  createdAt: string;
  id: string;
  message: string;
  metadata: Record<string, unknown> | null;
  project: NotificationProjectSummary | null;
  readAt: string | null;
  task: NotificationTaskSummary | null;
  title: string;
  type: NotificationType;
}

export interface PaginatedNotifications {
  data: NotificationItem[];
  totalCount: number;
  totalPages: number;
}
