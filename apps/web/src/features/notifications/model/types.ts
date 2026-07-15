export type NotificationType =
  | "project_member_added"
  | "project_member_removed"
  | "task_assigned"
  | "task_commented"
  | "task_status_changed"
  | "task_child_created"
  | "task_unassigned";

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
  metadata: Record<string, unknown> | null;
  project: NotificationProjectSummary | null;
  readAt: string | null;
  task: NotificationTaskSummary | null;
  type: NotificationType;
}

export interface PaginatedNotifications {
  data: NotificationItem[];
  totalCount: number;
  totalPages: number;
}
