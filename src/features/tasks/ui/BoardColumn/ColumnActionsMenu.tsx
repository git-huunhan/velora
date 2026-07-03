import { useState } from "react";
import { CheckCircle2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KanbanColumn } from "../../model/types";

interface ColumnActionsMenuProps {
  column: KanbanColumn;
  columns: KanbanColumn[];
  taskCount: number;
  onRename: () => void;
  onSetDone: () => void;
  onDelete: (targetColumnId?: string) => Promise<void>;
}

export function ColumnActionsMenu({
  column,
  columns,
  taskCount,
  onRename,
  onSetDone,
  onDelete,
}: ColumnActionsMenuProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState("");
  const targets = columns.filter((item) => item.id !== column.id);

  const handleDelete = async () => {
    if (taskCount > 0 && !targetColumnId) return;
    try {
      await onDelete(targetColumnId || undefined);
      setIsDeleteOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete column",
      );
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${column.title} column`}
            className="h-6 w-6 opacity-0 group-hover/column:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={onRename}>
            <Pencil /> Rename column
          </DropdownMenuItem>
          <DropdownMenuItem disabled={column.isDone} onSelect={onSetDone}>
            <CheckCircle2 /> {column.isDone ? "Done type" : "Set as done type"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={column.isDone || columns.length === 1}
            onSelect={() => setIsDeleteOpen(true)}
          >
            <Trash2 /> Delete column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {column.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              {taskCount > 0
                ? `Move ${taskCount} task${taskCount === 1 ? "" : "s"} to another column before deleting.`
                : "This column is empty and can be deleted safely."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {taskCount > 0 && (
            <Select value={targetColumnId} onValueChange={setTargetColumnId}>
              <SelectTrigger>
                <SelectValue placeholder="Move tasks to..." />
              </SelectTrigger>
              <SelectContent>
                {targets.map((target) => (
                  <SelectItem key={target.id} value={target.id}>
                    {target.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={taskCount > 0 && !targetColumnId}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              Delete column
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
