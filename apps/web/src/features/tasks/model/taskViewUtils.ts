import type { Task } from "./types";

export interface TaskFilterOptions {
  searchQuery: string;
  parentIds: string[];
  assigneeIds: string[];
  priorities: string[];
  statuses: string[];
  workTypes: string[];
  labels: string[];
  hideEpics?: boolean;
  supportNoParent?: boolean;
  labelMatch?: "all" | "any";
}

export function filterTasks(tasks: Task[], options: TaskFilterOptions) {
  const search = options.searchQuery.toLowerCase();
  return tasks.filter((task) => {
    if (options.hideEpics && task.type === "epic") return false;
    if (
      search &&
      !task.title.toLowerCase().includes(search) &&
      !task.description?.toLowerCase().includes(search) &&
      !task.code.toLowerCase().includes(search)
    )
      return false;

    if (options.parentIds.length > 0) {
      const noParent =
        options.supportNoParent &&
        options.parentIds.includes("no-parent") &&
        !task.parentId;
      const parent =
        !!task.parentId && options.parentIds.includes(task.parentId);
      if (!noParent && !parent) return false;
    }
    if (options.assigneeIds.length > 0) {
      const unassigned =
        options.assigneeIds.includes("unassigned") && !task.assigneeId;
      const assigned =
        !!task.assigneeId && options.assigneeIds.includes(task.assigneeId);
      if (!unassigned && !assigned) return false;
    }
    if (
      options.priorities.length > 0 &&
      !options.priorities.includes(task.priority)
    )
      return false;
    if (options.statuses.length > 0 && !options.statuses.includes(task.status))
      return false;
    if (
      options.workTypes.length > 0 &&
      (!task.type || !options.workTypes.includes(task.type))
    )
      return false;
    if (options.labels.length > 0) {
      const matches =
        options.labelMatch === "any"
          ? options.labels.some((label) => task.labels?.includes(label))
          : options.labels.every((label) => task.labels?.includes(label));
      if (!matches) return false;
    }
    return true;
  });
}

export function flattenTaskTree(tasks: Task[], collapsedIds: Set<string>) {
  const childrenByParent = new Map<string, Task[]>();
  const roots: Task[] = [];
  const taskIds = new Set(tasks.map((task) => task.id));
  tasks.forEach((task) => {
    if (!task.parentId || !taskIds.has(task.parentId)) {
      roots.push(task);
      return;
    }
    const children = childrenByParent.get(task.parentId) ?? [];
    children.push(task);
    childrenByParent.set(task.parentId, children);
  });

  const result: { task: Task; depth: number; hasChildren: boolean }[] = [];
  const visit = (nodes: Task[], depth: number) => {
    nodes.forEach((task) => {
      const children = childrenByParent.get(task.id) ?? [];
      result.push({ task, depth, hasChildren: children.length > 0 });
      if (!collapsedIds.has(task.id)) visit(children, depth + 1);
    });
  };
  visit(roots, 0);
  return result;
}

export function orderTaskTree<RenderItem extends { task: Task }>(
  items: RenderItem[],
  rowOrder: string[],
) {
  if (rowOrder.length === 0) return items;
  const itemById = new Map(items.map((item) => [item.task.id, item]));
  const ordered = rowOrder
    .map((id) => itemById.get(id))
    .filter((item): item is RenderItem => item !== undefined);
  const orderedIds = new Set(rowOrder);
  items.forEach((item) => {
    if (!orderedIds.has(item.task.id)) ordered.push(item);
  });
  return ordered;
}

export function mergeServerTasks(localTasks: Task[], serverTasks: Task[]) {
  const serverById = new Map(serverTasks.map((task) => [task.id, task]));
  const merged = localTasks
    .filter((task) => serverById.has(task.id))
    .map((task) => ({ ...serverById.get(task.id)! }));
  const localIds = new Set(localTasks.map((task) => task.id));
  serverTasks.forEach((task) => {
    if (!localIds.has(task.id)) merged.push(task);
  });
  return merged;
}
