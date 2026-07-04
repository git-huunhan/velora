import { TaskType } from '../contracts/enums';

export interface HierarchyTask {
  id: string;
  projectId: string;
  type: TaskType;
  parentId: string | null;
}

export type HierarchyValidation =
  | { valid: true }
  | { code: string; reason: string; valid: false };

function invalid(code: string, reason: string): HierarchyValidation {
  return { code, reason, valid: false };
}

function createsCycle(
  taskId: string,
  parentId: string,
  tasks: HierarchyTask[],
): boolean {
  let current = tasks.find((task) => task.id === parentId);
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    if (current.id === taskId) {
      return true;
    }

    visited.add(current.id);
    current = current.parentId
      ? tasks.find((task) => task.id === current?.parentId)
      : undefined;
  }

  return false;
}

export function validateParentAssignment(
  task: HierarchyTask,
  parentId: string | null,
  tasks: HierarchyTask[],
): HierarchyValidation {
  if (!parentId) {
    return task.type === TaskType.SUBTASK
      ? invalid('SUBTASK_PARENT_REQUIRED', 'A subtask must have a parent.')
      : { valid: true };
  }

  const parent = tasks.find((candidate) => candidate.id === parentId);
  if (!parent) {
    return invalid('PARENT_NOT_FOUND', 'The parent work item was not found.');
  }
  if (parent.id === task.id) {
    return invalid('SELF_PARENT', 'A work item cannot parent itself.');
  }
  if (parent.projectId !== task.projectId) {
    return invalid(
      'CROSS_PROJECT_PARENT',
      'Parent and child must belong to the same project.',
    );
  }
  if (createsCycle(task.id, parent.id, tasks)) {
    return invalid('HIERARCHY_CYCLE', 'This assignment would create a cycle.');
  }
  if (task.type === TaskType.EPIC) {
    return invalid('EPIC_HAS_PARENT', 'An epic cannot have a parent.');
  }

  if (task.type === TaskType.TASK || task.type === TaskType.BUG) {
    return parent.type === TaskType.EPIC
      ? { valid: true }
      : invalid(
          'INVALID_EPIC_CHILD',
          'A task or bug can only be assigned to an epic.',
        );
  }

  return parent.type === TaskType.TASK || parent.type === TaskType.BUG
    ? { valid: true }
    : invalid(
        'INVALID_SUBTASK_PARENT',
        'A subtask must belong to a task or bug.',
      );
}

export function validateTaskDeletion(
  taskId: string,
  tasks: HierarchyTask[],
): HierarchyValidation {
  return tasks.some((task) => task.parentId === taskId)
    ? invalid(
        'WORK_ITEM_HAS_CHILDREN',
        'Move or delete child work items first.',
      )
    : { valid: true };
}
