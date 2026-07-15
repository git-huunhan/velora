export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum ProjectRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export enum TaskType {
  EPIC = 'epic',
  TASK = 'task',
  BUG = 'bug',
  SUBTASK = 'subtask',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMMENTED = 'task_commented',
  TASK_STATUS_CHANGED = 'task_status_changed',
  TASK_CHILD_CREATED = 'task_child_created',
  TASK_UNASSIGNED = 'task_unassigned',
  PROJECT_MEMBER_ADDED = 'project_member_added',
  PROJECT_MEMBER_REMOVED = 'project_member_removed',
}
