import { getProjectKeySync } from "../../projects/api/projectsApi";
import { mockUsers } from "../../users/model/mockUsers";
import type { Task, TaskStatus, TaskUpdateData } from "../model/types";
import {
  calculateTaskOrder,
  compareTaskOrder,
  TASK_ORDER_GAP,
} from "../model/taskOrder";
import { logActivity } from "./commentsApi";
import {
  validateParentAssignment,
  validateTaskDeletion,
} from "../model/taskHierarchy";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const PRIORITIES = ["low", "medium", "high"] as const;
const STATUSES: TaskStatus[] = ["todo", "in-progress", "review", "done"];

let tasksDb: Task[] = Array.from({ length: 60 }).map((_, i) => {
  const projectId = `proj-${(i % 24) + 1}`;
  const assigneeId = `user-${(i % 3) + 1}`;
  const user = mockUsers.find((u) => u.id === assigneeId);

  return {
    id: `task-${i + 1}`,
    code: `${getProjectKeySync(projectId)}-${i + 101}`,
    projectId,
    title:
      i === 0
        ? "Project 1 delivery"
        : i === 24
          ? "Build Project 1 workspace"
          : i === 48
            ? "Validate Project 1 workflow"
            : [
                "Design homepage mockup",
                "Set up CI/CD pipeline",
                "Write unit tests",
                "Fix authentication bug",
                "Implement dark mode",
                "Review pull requests",
                "Update API documentation",
                "Optimize database queries",
                "Deploy to staging",
                "User research interviews",
              ][i % 10],
    description: `Description for task ${i + 1}`,
    type: i < 24 ? "epic" : "task",
    status: STATUSES[i % 4],
    priority: PRIORITIES[i % 3],
    order: (Math.floor(i / 24) + 1) * TASK_ORDER_GAP,
    assigneeId,
    assignee: user
      ? { id: user.id, name: user.name, avatarUrl: user.avatarUrl || "" }
      : undefined,
    labels: i % 2 === 0 ? ["Frontend"] : [],
    dueDate: new Date(Date.now() + i * 86400000).toISOString().split("T")[0],
    parentId:
      i >= 48 ? `task-${i - 23}` : i >= 24 ? `task-${(i % 24) + 1}` : undefined,
    createdAt: new Date(Date.now() - i * 86400000).toISOString().split("T")[0],
  };
});

const projectOneAssignee = mockUsers[0];
tasksDb.push({
  id: "task-61",
  code: `${getProjectKeySync("proj-1")}-161`,
  projectId: "proj-1",
  title: "Fix standalone Project 1 defect",
  description: "A standalone bug that is not attached to an Epic or task.",
  type: "bug",
  status: "todo",
  priority: "high",
  order: 4 * TASK_ORDER_GAP,
  assigneeId: projectOneAssignee?.id,
  assignee: projectOneAssignee
    ? {
        id: projectOneAssignee.id,
        name: projectOneAssignee.name,
        avatarUrl: projectOneAssignee.avatarUrl || "",
      }
    : undefined,
  labels: ["Bug"],
  createdAt: new Date().toISOString().split("T")[0],
});

export async function getTasksByProjectId(projectId: string): Promise<Task[]> {
  await delay(500);
  return tasksDb
    .filter((t) => t.projectId === projectId)
    .sort(compareTaskOrder);
}

export async function updateTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
): Promise<Task> {
  await delay(300);
  const taskIndex = tasksDb.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) throw new Error("Task not found");

  const task = tasksDb[taskIndex];

  const STATUS_LABELS: Record<TaskStatus, string> = {
    todo: "To Do",
    "in-progress": "In Progress",
    review: "Review",
    done: "Done",
  };

  logActivity(
    taskId,
    "status",
    STATUS_LABELS[task.status],
    STATUS_LABELS[newStatus],
  );

  const updatedTask = { ...task, status: newStatus };
  tasksDb[taskIndex] = updatedTask;

  return updatedTask;
}

export async function createTask(
  data: Omit<Task, "id" | "createdAt" | "code" | "assignee" | "order"> & {
    afterTaskId?: string;
    order?: number;
  },
): Promise<Task> {
  await delay(500);
  const { afterTaskId, ...taskData } = data;
  const assignedUser = taskData.assigneeId
    ? mockUsers.find((u) => u.id === taskData.assigneeId)
    : undefined;

  const lastOrder = tasksDb
    .filter(
      (task) =>
        task.projectId === taskData.projectId &&
        task.status === taskData.status,
    )
    .reduce((maximum, task) => Math.max(maximum, task.order), 0);
  const afterTask = afterTaskId
    ? tasksDb.find((task) => task.id === afterTaskId)
    : undefined;
  const orderedLaneTasks = afterTask
    ? tasksDb
        .filter(
          (task) =>
            task.projectId === afterTask.projectId &&
            task.status === afterTask.status,
        )
        .sort(compareTaskOrder)
    : [];
  const afterTaskIndex = afterTask
    ? orderedLaneTasks.findIndex((task) => task.id === afterTask.id)
    : -1;
  const resolvedOrder =
    taskData.order ??
    (afterTask
      ? calculateTaskOrder(
          afterTask.order,
          orderedLaneTasks[afterTaskIndex + 1]?.order,
        )
      : lastOrder + TASK_ORDER_GAP);

  const newTask: Task = {
    ...taskData,
    id: `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    code: `${getProjectKeySync(taskData.projectId)}-${Math.floor(Math.random() * 900) + 100}`,
    assignee: assignedUser
      ? {
          id: assignedUser.id,
          name: assignedUser.name,
          avatarUrl: assignedUser.avatarUrl || "",
        }
      : undefined,
    reporterId: "user-1",
    order: resolvedOrder,
    reporter: mockUsers[0]
      ? {
          id: mockUsers[0].id,
          name: mockUsers[0].name,
          avatarUrl: mockUsers[0].avatarUrl || "",
        }
      : undefined,
    createdAt: new Date().toISOString().split("T")[0],
  };

  const parentValidation = validateParentAssignment(
    newTask,
    newTask.parentId,
    tasksDb,
  );
  if (!parentValidation.valid) throw new Error(parentValidation.reason);

  if (afterTaskId) {
    const index = tasksDb.findIndex((t) => t.id === afterTaskId);
    if (index !== -1) {
      tasksDb = [
        ...tasksDb.slice(0, index + 1),
        newTask,
        ...tasksDb.slice(index + 1),
      ];
      return newTask;
    }
  }

  tasksDb = [newTask, ...tasksDb];
  return newTask;
}

export async function updateTask(
  taskId: string,
  data: TaskUpdateData,
): Promise<Task> {
  await delay(300);
  const taskIndex = tasksDb.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) throw new Error("Task not found");

  const task = tasksDb[taskIndex];

  const STATUS_LABELS: Record<TaskStatus, string> = {
    todo: "To Do",
    "in-progress": "In Progress",
    review: "Review",
    done: "Done",
  };

  // Log changes before applying
  if (data.status && data.status !== task.status) {
    logActivity(
      taskId,
      "status",
      STATUS_LABELS[task.status],
      STATUS_LABELS[data.status],
    );
  }
  if (data.priority && data.priority !== task.priority) {
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    logActivity(taskId, "priority", cap(task.priority), cap(data.priority));
  }
  if (data.assigneeId !== undefined && data.assigneeId !== task.assigneeId) {
    const oldUser = task.assignee?.name ?? "Unassigned";
    const oldAvatar = task.assignee?.avatarUrl;
    const newUserObj =
      data.assigneeId === null
        ? null
        : mockUsers.find((u) => u.id === data.assigneeId);
    const newUser = newUserObj?.name ?? "Unassigned";
    const newAvatar = newUserObj?.avatarUrl;
    logActivity(taskId, "assignee", oldUser, newUser, oldAvatar, newAvatar);
  }
  if (data.dueDate !== undefined && data.dueDate !== task.dueDate) {
    logActivity(taskId, "due date", task.dueDate ?? "—", data.dueDate || "—");
  }
  if (data.reporterId !== undefined && data.reporterId !== task.reporterId) {
    const oldReporter = task.reporter?.name ?? "Unassigned";
    const oldAvatar = task.reporter?.avatarUrl;
    const newReporterObj =
      data.reporterId === null
        ? null
        : mockUsers.find((u) => u.id === data.reporterId);
    const newReporter = newReporterObj?.name ?? "Unassigned";
    const newAvatar = newReporterObj?.avatarUrl;
    logActivity(
      taskId,
      "reporter",
      oldReporter,
      newReporter,
      oldAvatar,
      newAvatar,
    );
  }
  if (data.labels !== undefined) {
    const oldLabels = (task.labels ?? []).join(", ") || "None";
    const newLabels = (data.labels as string[]).join(", ") || "None";
    if (oldLabels !== newLabels) {
      logActivity(taskId, "labels", oldLabels, newLabels);
    }
  }

  const {
    assigneeId: nextAssigneeId,
    reporterId: nextReporterId,
    parentId: nextParentId,
    ...taskFields
  } = data;
  const updatedTask: Task = { ...task, ...taskFields };

  if (nextAssigneeId !== undefined) {
    if (nextAssigneeId === null) {
      updatedTask.assigneeId = undefined;
      updatedTask.assignee = undefined;
    } else {
      updatedTask.assigneeId = nextAssigneeId;
      const user = mockUsers.find((u) => u.id === nextAssigneeId);
      if (user) {
        updatedTask.assignee = {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl || "",
        };
      }
    }
  }

  if (nextReporterId !== undefined) {
    if (nextReporterId === null) {
      updatedTask.reporterId = undefined;
      updatedTask.reporter = undefined;
    } else {
      updatedTask.reporterId = nextReporterId;
      const user = mockUsers.find((u) => u.id === nextReporterId);
      if (user) {
        updatedTask.reporter = {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl || "",
        };
      }
    }
  }

  if (nextParentId !== undefined) {
    updatedTask.parentId = nextParentId ?? undefined;
  }

  if (nextParentId !== undefined || data.type !== undefined) {
    const parentValidation = validateParentAssignment(
      { ...task, ...taskFields },
      updatedTask.parentId,
      tasksDb,
    );
    if (!parentValidation.valid) throw new Error(parentValidation.reason);
  }

  tasksDb[taskIndex] = updatedTask;
  return updatedTask;
}

export async function deleteTask(taskId: string): Promise<void> {
  await delay(300);
  const task = tasksDb.find((candidate) => candidate.id === taskId);
  if (!task) throw new Error("Task not found");
  const deletionValidation = validateTaskDeletion(task, tasksDb);
  if (!deletionValidation.valid) throw new Error(deletionValidation.reason);
  tasksDb = tasksDb.filter((t) => t.id !== taskId);
}
