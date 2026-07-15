import type { Task } from "./types";

export type ParentValidation =
  | { valid: true }
  | { valid: false; reason: string };

export function getTaskParent(task: Task, tasks: Task[]) {
  return task.parentId
    ? tasks.find((candidate) => candidate.id === task.parentId)
    : undefined;
}

export function isSubtask(task: Task, tasks: Task[]) {
  const parentType = getTaskParent(task, tasks)?.type;
  return parentType === "task" || parentType === "bug";
}

function isDescendant(candidateId: string, taskId: string, tasks: Task[]) {
  let current = tasks.find((task) => task.id === candidateId);
  const visited = new Set<string>();

  while (current?.parentId && !visited.has(current.id)) {
    if (current.parentId === taskId) return true;
    visited.add(current.id);
    current = tasks.find((task) => task.id === current?.parentId);
  }

  return false;
}

export function validateParentAssignment(
  task: Task,
  parentId: string | undefined,
  tasks: Task[],
): ParentValidation {
  if (!parentId) {
    return isSubtask(task, tasks)
      ? { valid: false, reason: "A subtask must have a parent task." }
      : { valid: true };
  }

  const parent = tasks.find((candidate) => candidate.id === parentId);
  if (!parent) return { valid: false, reason: "Parent task was not found." };
  if (parent.id === task.id)
    return { valid: false, reason: "A work item cannot parent itself." };
  if (parent.projectId !== task.projectId)
    return { valid: false, reason: "Parent must belong to the same project." };
  if (isDescendant(parent.id, task.id, tasks))
    return { valid: false, reason: "This parent would create a cycle." };
  if (task.type === "epic")
    return { valid: false, reason: "An Epic cannot have a parent." };

  if (parent.type === "epic") {
    return task.type === "task" || task.type === "bug"
      ? { valid: true }
      : { valid: false, reason: "An Epic can contain only Tasks or Bugs." };
  }

  if (
    (parent.type !== "task" && parent.type !== "bug") ||
    isSubtask(parent, tasks)
  ) {
    return {
      valid: false,
      reason: "A subtask must belong to a regular Task or Bug.",
    };
  }

  if (task.type !== "task") {
    return { valid: false, reason: "Only a Task can become a subtask." };
  }

  return { valid: true };
}

export function getValidParentTasks(task: Task, tasks: Task[]) {
  const taskIsSubtask = isSubtask(task, tasks);
  return tasks.filter(
    (candidate) =>
      candidate.id !== task.parentId &&
      (taskIsSubtask
        ? candidate.type === "task" || candidate.type === "bug"
        : candidate.type === "epic") &&
      validateParentAssignment(task, candidate.id, tasks).valid,
  );
}

export function validateTaskDeletion(task: Task, tasks: Task[]) {
  return tasks.some((candidate) => candidate.parentId === task.id)
    ? {
        valid: false as const,
        reason: "Move or delete child work items first.",
      }
    : { valid: true as const };
}
