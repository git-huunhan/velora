import { useUpdateTask } from "@/features/tasks";
import type {
  KanbanColumn,
  Task,
  TaskFieldUpdater,
  TaskUpdateData,
} from "../../../model/types";
import { TaskHeader } from "./TaskHeader";
import { TaskMain } from "./TaskMain";
import { TaskSidebar } from "./TaskSidebar";

interface TaskDetailPanelProps {
  task: Task | null;
  onClose?: () => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onOpenTask?: (task: Task) => void;
  /** Show Close/Expand buttons in header (for split-view outside a Dialog) */
  showCloseButton?: boolean;
  columns?: KanbanColumn[];
}

export function TaskDetailPanel({
  task,
  onClose = () => {},
  onDelete,
  onOpenTask,
  showCloseButton,
  columns,
}: TaskDetailPanelProps) {
  const updateTask = useUpdateTask();

  if (!task) return null;

  const handleUpdate: TaskFieldUpdater = (field, value) => {
    const isArrayField = Array.isArray(value);
    if (!isArrayField && task[field] === value) return;
    updateTask.mutate({
      taskId: task.id,
      data: { [field]: value } as TaskUpdateData,
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <TaskHeader
        task={task}
        onClose={onClose}
        onDelete={onDelete}
        onOpenTask={onOpenTask}
        handleUpdate={handleUpdate}
        showCloseButton={showCloseButton}
      />
      <div className="flex flex-1 h-full overflow-hidden flex-col lg:flex-row">
        <TaskMain
          task={task}
          handleUpdate={handleUpdate}
          onOpenTask={onOpenTask}
          columns={columns}
          className="w-full flex-1 shrink-0 flex flex-col overflow-hidden border-r-0 lg:border-r border-border/40 bg-card"
        />
        <TaskSidebar
          task={task}
          handleUpdate={handleUpdate}
          onOpenTask={onOpenTask}
          columns={columns}
          className="w-1/3 min-w-[340px] max-w-[550px] shrink-0 bg-muted/10 hidden lg:flex flex-col overflow-hidden relative border-l border-transparent z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.03)] dark:shadow-none"
        />
      </div>
    </div>
  );
}
