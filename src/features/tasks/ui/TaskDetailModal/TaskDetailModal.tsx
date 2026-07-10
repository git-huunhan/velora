import { Dialog, DialogContent } from "@/components/ui/dialog";

import type { KanbanColumn, Task } from "../../model/types";
import { TaskDetailPanel } from "./components/TaskDetailPanel";

function isFromPortaledSelect(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    target.closest('[data-slot="select-content"]')
  );
}

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onOpenTask?: (task: Task) => void;
  columns?: KanbanColumn[];
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onDelete,
  onOpenTask,
  columns,
}: TaskDetailModalProps) {
  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[1240px] w-[95vw] p-0 gap-0 h-[85vh] flex flex-col overflow-hidden bg-background border-border/60 shadow-2xl"
        onInteractOutside={(event) => {
          if (isFromPortaledSelect(event.target)) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          if (isFromPortaledSelect(event.target)) {
            event.preventDefault();
          }
        }}
      >
        <TaskDetailPanel
          task={task}
          onClose={onClose}
          onDelete={onDelete}
          onOpenTask={onOpenTask}
          columns={columns}
          showCloseButton
        />
      </DialogContent>
    </Dialog>
  );
}
