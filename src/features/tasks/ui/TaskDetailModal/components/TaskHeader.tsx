import {
  ArrowUpRight,
  Bug,
  ClipboardList,
  Crown,
  Eye,
  Lock,
  MoreHorizontal,
  Share2,
  SquaresExclude,
  SquarePen,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Task, TaskFieldUpdater } from "../../../model/types";
import { useTasksByProject } from "../../../model/useTasks";
import { getTaskParent, isSubtask } from "../../../model/taskHierarchy";

interface TaskHeaderProps {
  task: Task;
  onClose: () => void;
  onDelete?: (task: Task) => void;
  onOpenTask?: (task: Task) => void;
  handleUpdate?: TaskFieldUpdater;
  /** When true, renders its own Close and Expand buttons (for split-view, outside a Dialog) */
  showCloseButton?: boolean;
  isEmbedded?: boolean;
}

export function TaskHeader({
  task,
  onClose,
  onDelete,
  onOpenTask,
  handleUpdate,
  showCloseButton,
  isEmbedded,
}: TaskHeaderProps) {
  const { data: tasks = [] } = useTasksByProject(task.projectId);
  const epics = tasks.filter((t) => t.type === "epic");
  const directParent = getTaskParent(task, tasks);
  const taskIsSubtask = isSubtask(task, tasks);
  return (
    <div
      className={`flex items-center justify-between shrink-0 border-b border-border/40 bg-card z-20 ${isEmbedded ? "min-h-[65px] pl-6 pr-6 py-4" : "px-6 py-4"}`}
    >
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground font-medium">
        {task.type !== "epic" && (
          <>
            {directParent ? (
              <>
                <button
                  className="hover:underline transition-colors hover:text-foreground flex items-center gap-1.5"
                  onClick={() => onOpenTask?.(directParent)}
                >
                  {directParent.type === "epic" ? (
                    <Crown className="w-4 h-4 text-purple-500" />
                  ) : directParent.type === "bug" ? (
                    <Bug className="w-4 h-4 text-red-500" />
                  ) : (
                    <ClipboardList className="w-4 h-4 text-primary" />
                  )}
                  {directParent.code || `TASK-${directParent.id.slice(-3)}`}
                </button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-sm -ml-2 data-[state=open]:bg-primary/10 data-[state=open]:text-primary data-[state=open]:border-primary border border-transparent"
                  >
                    <SquarePen className="w-3.5 h-3.5 mr-1.5" />
                    Add epic
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Recent epics
                  </div>
                  {epics.map((epic) => (
                    <DropdownMenuItem
                      key={epic.id}
                      className="cursor-pointer py-2"
                      onClick={() => handleUpdate?.("parentId", epic.id)}
                    >
                      <Crown className="w-4 h-4 text-purple-500 mr-2 shrink-0" />
                      <span className="truncate">
                        <span className="text-muted-foreground mr-1.5">
                          {epic.code || `TASK-${epic.id.slice(-3)}`}
                        </span>
                        {epic.title}
                      </span>
                    </DropdownMenuItem>
                  ))}
                  {epics.length === 0 && (
                    <div className="px-2 py-2 text-xs text-muted-foreground">
                      No epics found
                    </div>
                  )}
                  <div className="h-px bg-border my-1" />
                  <DropdownMenuItem className="cursor-pointer py-2">
                    View all epics
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <span className="opacity-50">/</span>
          </>
        )}
        <span className="text-foreground hover:underline cursor-pointer flex items-center gap-1.5">
          {task.type === "epic" ? (
            <Crown className="w-4 h-4 text-purple-500" />
          ) : task.type === "bug" ? (
            <Bug className="w-4 h-4 text-red-500" />
          ) : taskIsSubtask ? (
            <SquaresExclude className="w-4 h-4 text-cyan-500" />
          ) : (
            <ClipboardList className="w-4 h-4 text-primary" />
          )}
          {task.code || `TASK-${task.id.slice(-3)}`}
        </span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 hover:bg-muted/50 rounded-md border-border/60 shadow-sm"
        >
          <Lock className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs font-semibold px-2.5 border-border/60 shadow-sm rounded-md"
        >
          <Eye className="w-3.5 h-3.5 mr-1.5" /> 1
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 hover:bg-muted/50 rounded-md border-border/60 shadow-sm"
        >
          <Share2 className="w-4 h-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 hover:bg-muted/50 rounded-md border-border/60 shadow-sm"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onDelete && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                onClick={() => onDelete(task)}
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {showCloseButton && (
          <>
            {onOpenTask && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 hover:bg-muted/50 rounded-md border-border/60 shadow-sm"
                title="Open in full view"
                onClick={() => onOpenTask(task)}
              >
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 hover:bg-muted/50 rounded-md border-border/60 shadow-sm"
              title="Close"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
