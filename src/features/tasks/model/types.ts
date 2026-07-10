export type TaskStatus =
  | "todo"
  | "in-progress"
  | "review"
  | "done"
  | `custom-${string}`;
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  code: string;
  projectId: string;
  title: string;
  description?: string;
  type?: "task" | "epic" | "bug" | "subtask";
  status: TaskStatus;
  priority: TaskPriority;
  order: number;
  assignee?: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  assigneeId?: string;
  reporterId?: string;
  reporter?: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  labels?: string[];
  isPending?: boolean;
  dueDate?: string;
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TaskUpdateData = Partial<
  Omit<
    Task,
    | "id"
    | "createdAt"
    | "projectId"
    | "code"
    | "assignee"
    | "reporter"
    | "assigneeId"
    | "reporterId"
    | "parentId"
  >
> & {
  assigneeId?: string | null;
  reporterId?: string | null;
  parentId?: string | null;
};

export type TaskFieldUpdater = <Field extends keyof TaskUpdateData>(
  field: Field,
  value: TaskUpdateData[Field],
) => void;

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  order: number;
  isDone: boolean;
  updatedAt?: string;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "To Do", order: 0, isDone: false },
  { id: "in-progress", title: "In Progress", order: 1, isDone: false },
  { id: "review", title: "Review", order: 2, isDone: false },
  { id: "done", title: "Done", order: 3, isDone: true },
];

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  body: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
}

export interface ActivityEntry {
  id: string;
  taskId: string;
  actorId: string;
  actor: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  field: string;
  from: string;
  to: string;
  fromAvatar?: string;
  toAvatar?: string;
  createdAt: string;
  updatedAt?: string;
}
