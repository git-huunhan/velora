import { KANBAN_COLUMNS, type KanbanColumn } from "../model/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const workflows = new Map<string, KanbanColumn[]>();

function getWorkflow(projectId: string) {
  if (!workflows.has(projectId)) {
    workflows.set(
      projectId,
      KANBAN_COLUMNS.map((column) => ({ ...column })),
    );
  }
  return workflows.get(projectId)!;
}

export async function getProjectColumns(projectId: string) {
  await delay(200);
  return getWorkflow(projectId).sort((a, b) => a.order - b.order);
}

export async function createProjectColumn(projectId: string, title: string) {
  await delay(250);
  const columns = getWorkflow(projectId);
  const column: KanbanColumn = {
    id: `custom-${Date.now()}` as const,
    title: title.trim(),
    order: columns.length,
    isDone: false,
  };
  workflows.set(projectId, [...columns, column]);
  return column;
}

export async function updateProjectColumn(
  projectId: string,
  columnId: string,
  data: Partial<Pick<KanbanColumn, "title" | "isDone">>,
) {
  await delay(250);
  const columns = getWorkflow(projectId);
  const column = columns.find((item) => item.id === columnId);
  if (!column) throw new Error("Column not found");
  if (data.isDone) {
    columns.forEach((item) => (item.isDone = item.id === columnId));
  }
  Object.assign(column, data);
  return { ...column };
}

export async function reorderProjectColumns(
  projectId: string,
  columnIds: string[],
) {
  await delay(250);
  const columns = getWorkflow(projectId);
  const reordered = columnIds.map((id, order) => ({
    ...columns.find((column) => column.id === id)!,
    order,
  }));
  workflows.set(projectId, reordered);
  return reordered;
}

export async function deleteProjectColumn(projectId: string, columnId: string) {
  await delay(250);
  const columns = getWorkflow(projectId);
  const column = columns.find((item) => item.id === columnId);
  if (!column) throw new Error("Column not found");
  if (column.isDone) throw new Error("Choose another done column first");
  workflows.set(
    projectId,
    columns
      .filter((item) => item.id !== columnId)
      .map((item, order) => ({ ...item, order })),
  );
  return columnId;
}
