export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum ProjectRole {
  OWNER = 'owner',
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
