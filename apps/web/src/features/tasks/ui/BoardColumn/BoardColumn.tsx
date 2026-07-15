import {
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  KanbanColumn,
  Task,
  TaskStatus,
  TaskUpdateData,
} from "../../model/types";
import { TaskCard } from "../TaskCard/TaskCard";
import { QuickCreateInput } from "../shared/QuickCreateInput";
import { ColumnActionsMenu } from "./ColumnActionsMenu";

const TASK_DROP_GAP_OFFSET = 5;

interface BoardColumnProps {
  columnId: TaskStatus;
  droppableId?: string;
  groupId?: string;
  title: string;
  column: KanbanColumn;
  columns: KanbanColumn[];
  tasks: Task[];
  isFirstColumn?: boolean;
  onTaskClick: (task: Task) => void;
  onTaskUpdate?: (taskId: string, data: TaskUpdateData) => void;
  onTaskDelete?: (task: Task) => void;
  onRenameColumn: (title: string) => void;
  onSetDoneColumn: () => void;
  onDeleteColumn: (targetColumnId?: string) => Promise<void>;
  onColumnDragStart: () => void;
  onColumnDragEnd: () => void;
  canManageColumn?: boolean;
  canReorderColumn: boolean;
  isColumnDragging: boolean;
  onColumnDragOver: (side: "before" | "after") => void;
  onColumnDrop: (side: "before" | "after") => void;
  dropIndicatorSide: "before" | "after" | null;
  onCreateTask?: (data: {
    title: string;
    type: "task" | "epic" | "bug";
    assigneeId: string | null;
    dueDate: string | null;
    status: TaskStatus;
  }) => void;
}

export function BoardColumn({
  columnId,
  droppableId,
  groupId,
  title,
  column,
  columns,
  tasks,
  isFirstColumn,
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
  onRenameColumn,
  onSetDoneColumn,
  onDeleteColumn,
  onColumnDragStart,
  onColumnDragEnd,
  canManageColumn = true,
  canReorderColumn,
  isColumnDragging,
  onColumnDragOver,
  onColumnDrop,
  dropIndicatorSide,
  onCreateTask,
}: BoardColumnProps) {
  const [columnDropIndicatorY, setColumnDropIndicatorY] = useState<
    number | null
  >(null);
  const columnBodyRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const columnScrollRef = useRef<HTMLDivElement>(null);

  const getColumnDropData = useCallback(
    ({
      input,
      source,
    }: {
      input: { clientY: number };
      source: { data: Record<string | symbol, unknown> };
    }) => {
      const bodyElement = columnBodyRef.current;
      const sourceTaskId = String(source.data.taskId ?? "");
      const baseData = {
        entityType: "task-column",
        column: columnId,
        droppableId: droppableId || columnId,
        groupId,
      };

      if (!bodyElement) {
        return { ...baseData, columnEdge: "top" as const, indicatorY: 12 };
      }

      const cardElements = Array.from(
        bodyElement.querySelectorAll<HTMLElement>("[data-task-card-id]"),
      ).filter(
        (cardElement) => cardElement.dataset.taskCardId !== sourceTaskId,
      );

      if (cardElements.length === 0) {
        return { ...baseData, columnEdge: "top" as const, indicatorY: 12 };
      }

      let ghostCenterY = input.clientY;
      if (
        typeof source.data.offsetY === "number" &&
        typeof source.data.cardHeight === "number"
      ) {
        ghostCenterY =
          input.clientY - source.data.offsetY + source.data.cardHeight / 2;
      }

      const nearest = cardElements.reduce<{
        taskId: string;
        edge: "top" | "bottom";
        edgeY: number;
        distance: number;
      } | null>((closest, cardElement) => {
        const taskId = cardElement.dataset.taskCardId;
        if (!taskId) return closest;

        const rect = cardElement.getBoundingClientRect();
        const edge =
          ghostCenterY < rect.top + rect.height / 2 ? "top" : "bottom";
        const edgeY = edge === "top" ? rect.top : rect.bottom;
        const distance = Math.abs(ghostCenterY - edgeY);

        if (!closest || distance < closest.distance) {
          return { taskId, edge, edgeY, distance };
        }

        return closest;
      }, null);

      if (!nearest) {
        return { ...baseData, columnEdge: "top" as const, indicatorY: 12 };
      }

      const bodyRect = bodyElement.getBoundingClientRect();
      const indicatorEdgeY =
        nearest.edge === "bottom"
          ? nearest.edgeY + TASK_DROP_GAP_OFFSET
          : nearest.edgeY - TASK_DROP_GAP_OFFSET;
      const indicatorY = Math.min(
        Math.max(indicatorEdgeY - bodyRect.top, 12),
        Math.max(bodyRect.height - 12, 12),
      );

      return {
        ...baseData,
        columnEdge: nearest.edge,
        nearestTaskId: nearest.taskId,
        manualEdge: nearest.edge,
        indicatorY,
      };
    },
    [columnId, droppableId, groupId],
  );

  useEffect(() => {
    const element = columnScrollRef.current;
    if (!element) return;

    return autoScrollForElements({
      element,
      canScroll: ({ source }) => source.data.entityType === "task-card",
      getAllowedAxis: () => "vertical",
      getConfiguration: () => ({ maxScrollSpeed: "fast" }),
    });
  }, []);

  useEffect(() => {
    const element = columnBodyRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      canDrop: ({ source }) => source.data.entityType === "task-card",
      getData: getColumnDropData,
      getDropEffect: () => "move",
    });
  }, [getColumnDropData]);

  useEffect(() => {
    const element = columnRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      canDrop: ({ source }) => source.data.entityType === "task-card",
      getData: getColumnDropData,
      getDropEffect: () => "move",
    });
  }, [getColumnDropData]);

  useEffect(() => {
    return monitorForElements({
      onDrag({ location }) {
        const dropTargets = location.current.dropTargets;
        const bodyElement = columnBodyRef.current;
        if (!bodyElement) {
          setColumnDropIndicatorY(null);
          return;
        }

        const cardTarget = dropTargets.find(
          (dropTarget) => dropTarget.data?.entityType === "task-card",
        );
        if (cardTarget) {
          const taskId = String(cardTarget.data.taskId ?? "");
          const cardElement = bodyElement.querySelector<HTMLElement>(
            '[data-task-card-id="' + taskId + '"]',
          );
          if (!cardElement) {
            setColumnDropIndicatorY(null);
            return;
          }

          const bodyRect = bodyElement.getBoundingClientRect();
          const cardRect = cardElement.getBoundingClientRect();
          const edge =
            cardTarget.data.manualEdge === "bottom" ? "bottom" : "top";
          const edgeY =
            edge === "bottom"
              ? cardRect.bottom + TASK_DROP_GAP_OFFSET
              : cardRect.top - TASK_DROP_GAP_OFFSET;
          const indicatorY = Math.min(
            Math.max(edgeY - bodyRect.top, 12),
            Math.max(bodyRect.height - 12, 12),
          );
          setColumnDropIndicatorY(indicatorY);
          return;
        }

        const deepest = dropTargets[0];
        const currentDroppableId = droppableId || columnId;
        const isThisColumnDeepest =
          deepest?.data?.entityType === "task-column" &&
          deepest?.data?.droppableId === currentDroppableId;
        const indicatorY = deepest?.data?.indicatorY;
        setColumnDropIndicatorY(
          isThisColumnDeepest && typeof indicatorY === "number"
            ? indicatorY
            : null,
        );
      },
      onDrop() {
        setColumnDropIndicatorY(null);
      },
    });
  }, [columnId, droppableId]);

  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const renameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isRenaming) renameInputRef.current?.select();
  }, [isRenaming]);
  const finishRename = () => {
    const nextTitle = draftTitle.trim();
    if (nextTitle && nextTitle !== title) onRenameColumn(nextTitle);
    else setDraftTitle(title);
    setIsRenaming(false);
  };

  return (
    <div
      ref={columnRef}
      className="group/column relative flex flex-col rounded-xl border border-neutral-300 bg-neutral-100 dark:border-border dark:bg-muted/50 min-w-70 w-70 shrink-0 mr-6 last:mr-0"
    >
      {isFirstColumn && (
        <div
          onDragEnter={() => onColumnDragOver("before")}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={(event) => {
            event.preventDefault();
            onColumnDrop("before");
          }}
          className={`absolute inset-y-0 -left-3 z-30 w-[calc(50%+12px)] ${isColumnDragging ? "block" : "hidden"}`}
          aria-hidden="true"
        >
          {dropIndicatorSide === "before" && (
            <div className="pointer-events-none absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
          )}
        </div>
      )}
      <div
        onDragEnter={() => onColumnDragOver("after")}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }}
        onDrop={(event) => {
          event.preventDefault();
          onColumnDrop("after");
        }}
        className={`absolute inset-y-0 left-1/2 z-30 w-[calc(100%+24px)] ${isColumnDragging ? "block" : "hidden"}`}
        aria-hidden="true"
      >
        {dropIndicatorSide === "after" && (
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
        )}
      </div>
      <div
        draggable={canReorderColumn && !isRenaming}
        onDragStart={(event) => {
          if (!canReorderColumn) {
            event.preventDefault();
            return;
          }
          const target = event.target as HTMLElement;
          if (target.closest("button, input, [role='menuitem']")) {
            event.preventDefault();
            return;
          }
          event.dataTransfer.setData("text/plain", column.id);
          event.dataTransfer.effectAllowed = "move";
          requestAnimationFrame(onColumnDragStart);
        }}
        onDragEnd={onColumnDragEnd}
        className={`flex items-center justify-between border-b px-4 py-3 ${canReorderColumn ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={finishRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") finishRename();
                if (event.key === "Escape") {
                  setDraftTitle(title);
                  setIsRenaming(false);
                }
              }}
              className="h-6 min-w-0 w-32 rounded border border-primary bg-background px-1.5 text-sm font-semibold outline-none"
              aria-label="Column name"
            />
          ) : (
            <span
              onDoubleClick={() => {
                if (canManageColumn) setIsRenaming(true);
              }}
              className="min-w-0 truncate text-sm font-semibold text-foreground select-none"
              title={title}
            >
              {title}
            </span>
          )}
          <span className="flex items-center justify-center h-5 min-w-6 px-1.5 rounded-md text-xs font-medium border tabular-nums bg-muted text-muted-foreground border-border/60">
            {tasks.length}
          </span>
        </div>
        {canManageColumn && (
          <ColumnActionsMenu
            column={column}
            columns={columns}
            taskCount={tasks.length}
            onRename={() => setIsRenaming(true)}
            onSetDone={onSetDoneColumn}
            onDelete={onDeleteColumn}
          />
        )}
      </div>

      <div
        ref={columnScrollRef}
        className="flex-1 min-h-[50px] overflow-y-auto overflow-x-hidden custom-scrollbar"
      >
        <div
          ref={columnBodyRef}
          className="relative flex min-h-full flex-col p-3"
        >
          {columnDropIndicatorY !== null && (
            <div
              className="absolute left-3 right-3 h-0.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] pointer-events-none z-50"
              style={{ top: columnDropIndicatorY }}
            />
          )}

          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
              onUpdate={onTaskUpdate}
              onDelete={onTaskDelete}
            />
          ))}

          {onCreateTask && (
            <div
              className={`mt-1 transition-opacity ${isFirstColumn || isCreating ? "opacity-100" : "opacity-0 group-hover/column:opacity-100 focus-within:opacity-100"}`}
            >
              {isCreating ? (
                <div className="animate-in fade-in duration-150">
                  <QuickCreateInput
                    variant="card"
                    hideEpicOption
                    onClose={() => setIsCreating(false)}
                    onCreate={(data) => {
                      onCreateTask({ ...data, status: columnId });
                      setIsCreating(false);
                    }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex w-full items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-all"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
