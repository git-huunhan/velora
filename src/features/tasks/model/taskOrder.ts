import type { Task } from "./types";

export const TASK_ORDER_GAP = 1024;

export function compareTaskOrder(left: Task, right: Task) {
  if (left.order !== right.order) return left.order - right.order;
  return left.id.localeCompare(right.id);
}

export function calculateTaskOrder(previousOrder?: number, nextOrder?: number) {
  if (previousOrder === undefined && nextOrder === undefined) {
    return TASK_ORDER_GAP;
  }
  if (previousOrder === undefined) return nextOrder! - TASK_ORDER_GAP;
  if (nextOrder === undefined) return previousOrder + TASK_ORDER_GAP;
  return previousOrder + (nextOrder - previousOrder) / 2;
}
