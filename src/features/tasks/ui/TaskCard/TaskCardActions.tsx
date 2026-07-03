import { useState } from "react";
import { ArrowUpRight, MoreHorizontal, Trash2, UserRound } from "lucide-react";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockUsers } from "@/features/users/model/mockUsers";

import type { Task, TaskUpdateData } from "../../model/types";
import { TASK_STATUS_ENTRIES } from "../shared/taskStatus";

interface TaskCardActionsProps {
  task: Task;
  onOpen: (task: Task) => void;
  onUpdate?: (taskId: string, data: TaskUpdateData) => void;
  onDelete?: (task: Task) => void;
}

export function TaskCardActions({
  task,
  onOpen,
  onUpdate,
  onDelete,
}: TaskCardActionsProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const stopCardDrag = (event: React.PointerEvent | React.MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${task.title}`}
            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 text-muted-foreground hover:text-foreground"
            onPointerDown={stopCardDrag}
            onClick={stopCardDrag}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-52"
          onPointerDown={stopCardDrag}
          onClick={stopCardDrag}
        >
          <DropdownMenuItem onSelect={() => onOpen(task)}>
            <ArrowUpRight /> Open details
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={!onUpdate}>
              Change status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44">
              {TASK_STATUS_ENTRIES.map(([status, presentation]) => (
                <DropdownMenuItem
                  key={status}
                  disabled={task.status === status}
                  onSelect={() => onUpdate?.(task.id, { status })}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${presentation.dotClassName}`}
                  />
                  {presentation.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={!onUpdate}>
              <UserRound /> Change assignee
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              <DropdownMenuItem
                disabled={!task.assigneeId}
                onSelect={() => onUpdate?.(task.id, { assigneeId: null })}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-muted-foreground/50">
                  <UserRound className="h-3.5 w-3.5" />
                </span>
                Unassigned
              </DropdownMenuItem>
              {mockUsers.map((user) => (
                <DropdownMenuItem
                  key={user.id}
                  disabled={task.assigneeId === user.id}
                  onSelect={() => onUpdate?.(task.id, { assigneeId: user.id })}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{user.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={!onDelete}
            onSelect={() => setIsDeleteOpen(true)}
          >
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent onClick={(event) => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {task.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes “{task.title}”. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => onDelete?.(task)}
            >
              Delete task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
