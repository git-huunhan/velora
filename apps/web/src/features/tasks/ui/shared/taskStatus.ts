import type { KanbanColumn, TaskStatus } from "../../model/types";

export interface TaskStatusPresentation {
  label: string;
  triggerClassName: string;
  dotClassName: string;
}

export const TASK_STATUS_PRESENTATION: Record<
  TaskStatus,
  TaskStatusPresentation
> = {
  todo: {
    label: "To Do",
    triggerClassName:
      "bg-violet-500/15 border-violet-500/40 text-violet-700 dark:text-violet-300 hover:bg-violet-500/25",
    dotClassName: "bg-violet-500 dark:bg-violet-400",
  },
  "in-progress": {
    label: "In Progress",
    triggerClassName:
      "bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-500/25",
    dotClassName: "bg-blue-500 dark:bg-blue-400",
  },
  review: {
    label: "Review",
    triggerClassName:
      "bg-yellow-500/15 border-yellow-500/40 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/25",
    dotClassName: "bg-yellow-600 dark:bg-yellow-400",
  },
  done: {
    label: "Done",
    triggerClassName:
      "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25",
    dotClassName: "bg-emerald-600 dark:bg-emerald-400",
  },
};

export const TASK_STATUS_ENTRIES = Object.entries(TASK_STATUS_PRESENTATION) as [
  TaskStatus,
  TaskStatusPresentation,
][];
export const DEFAULT_TASK_STATUS_PRESENTATION: TaskStatusPresentation = {
  label: "Status",
  triggerClassName:
    "bg-muted border-border text-muted-foreground hover:bg-muted/80",
  dotClassName: "bg-muted-foreground",
};

export function getTaskStatusPresentation(status: TaskStatus) {
  return TASK_STATUS_PRESENTATION[status] ?? DEFAULT_TASK_STATUS_PRESENTATION;
}
export function getTaskStatusClassName(status: TaskStatus) {
  return getTaskStatusPresentation(status).triggerClassName;
}
function normalizeStatusLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function findTaskStatusColumn(
  status: string,
  columns: KanbanColumn[] = [],
) {
  const exactColumn = columns.find((column) => column.id === status);
  if (exactColumn) return exactColumn;

  const fallbackPresentation = TASK_STATUS_PRESENTATION[status as TaskStatus];
  if (!fallbackPresentation) return undefined;

  const normalizedLabel = normalizeStatusLabel(fallbackPresentation.label);
  return columns.find(
    (column) => normalizeStatusLabel(column.title) === normalizedLabel,
  );
}

export function getTaskStatusLabel(
  status: string,
  columns: KanbanColumn[] = [],
) {
  const column = findTaskStatusColumn(status, columns);
  if (column) return column.title;

  const presentation = TASK_STATUS_PRESENTATION[status as TaskStatus];
  return presentation?.label ?? DEFAULT_TASK_STATUS_PRESENTATION.label;
}

export function getTaskStatusPresentationWithColumns(
  status: string,
  columns: KanbanColumn[] = [],
) {
  const column = findTaskStatusColumn(status, columns);
  const columnTitleStatus = column
    ? (Object.entries(TASK_STATUS_PRESENTATION).find(
        ([, presentation]) =>
          normalizeStatusLabel(presentation.label) ===
          normalizeStatusLabel(column.title),
      )?.[0] as TaskStatus | undefined)
    : undefined;
  const presentation = getTaskStatusPresentation(
    columnTitleStatus ?? (status as TaskStatus),
  );

  return {
    ...presentation,
    label: column?.title ?? presentation.label,
  };
}
