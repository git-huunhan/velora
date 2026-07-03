import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Task, TaskStatus, TaskUpdateData } from "../../model/types";
import { TaskCard } from "../TaskCard/TaskCard";
import { QuickCreateInput } from "../shared/QuickCreateInput";
import { ColumnActionsMenu } from "./ColumnActionsMenu";

interface BoardColumnProps {
  columnId: TaskStatus;
  droppableId?: string;
  groupId?: string;
  title: string;
  tasks: Task[];
  isFirstColumn?: boolean;
  onTaskClick: (task: Task) => void;
  onTaskUpdate?: (taskId: string, data: TaskUpdateData) => void;
  onTaskDelete?: (task: Task) => void;
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
  tasks,
  isFirstColumn,
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
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

  return (
    <div className="group/column flex flex-col rounded-xl border bg-muted/50 min-w-70 w-70 shrink-0 mr-6 last:mr-0 pb-2">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="flex items-center justify-center h-5 min-w-6 px-1.5 rounded-md text-xs font-medium border tabular-nums bg-muted text-muted-foreground border-border/60">
            {tasks.length}
          </span>
        </div>
        <ColumnActionsMenu title={title} taskCount={tasks.length} />
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
