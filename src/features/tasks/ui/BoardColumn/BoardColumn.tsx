import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useRef, useState } from "react";
import type {
  KanbanColumn,
  Task,
  TaskStatus,
  TaskUpdateData,
} from "../../model/types";
import { TaskCard } from "../TaskCard/TaskCard";
import { QuickCreateInput } from "../shared/QuickCreateInput";
import { ColumnActionsMenu } from "./ColumnActionsMenu";

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
  canReorderColumn,
  isColumnDragging,
  onColumnDragOver,
  onColumnDrop,
  dropIndicatorSide,
  onCreateTask,
}: BoardColumnProps) {
  const { setNodeRef } = useDroppable({
    id: droppableId || columnId,
    data: {
      type: "Column",
      column: columnId,
      groupId: groupId,
    },
  });

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
    <div className="group/column relative flex flex-col rounded-xl border bg-muted/50 min-w-70 w-70 shrink-0 mr-6 last:mr-0 pb-2">
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
              onDoubleClick={() => setIsRenaming(true)}
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
        <ColumnActionsMenu
          column={column}
          columns={columns}
          taskCount={tasks.length}
          onRename={() => setIsRenaming(true)}
          onSetDone={onSetDoneColumn}
          onDelete={onDeleteColumn}
        />
      </div>

      <div className="flex-1 min-h-[50px] overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div ref={setNodeRef} className="flex flex-col p-3 min-h-full">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onTaskClick}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
              />
            ))}
          </SortableContext>

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
