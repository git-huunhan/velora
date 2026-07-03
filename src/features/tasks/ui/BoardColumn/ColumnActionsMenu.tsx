import { CheckCircle2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ColumnActionsMenuProps {
  title: string;
  taskCount: number;
}

export function ColumnActionsMenu({
  title,
  taskCount,
}: ColumnActionsMenuProps) {
  const phaseMessage = "Available after custom columns are introduced";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${title} column`}
          className="h-6 w-6 opacity-0 group-hover/column:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem disabled title={phaseMessage}>
          <Pencil /> Rename column
        </DropdownMenuItem>
        <DropdownMenuItem disabled title={phaseMessage}>
          <CheckCircle2 /> Set as done type
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled
          title={taskCount > 0 ? "Move tasks before deleting" : phaseMessage}
        >
          <Trash2 /> Delete column
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
