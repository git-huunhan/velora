import { useEffect, useRef } from "react";
import {
  CalendarIcon,
  ClipboardList,
  CornerDownLeft,
  Crown,
  Bug,
  ChevronDown,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { mockUsers } from "@/features/users/model/mockUsers";
import {
  useQuickCreateDraft,
  type QuickCreateDraft,
} from "./useQuickCreateDraft";

interface QuickCreateInputProps {
  onClose: () => void;
  onCreate: (data: QuickCreateDraft) => void;
  /** "inline" = single row (ListView), "card" = Jira-style card (Kanban) */
  variant?: "inline" | "card";
  /** If true, hides the Epic option from the type dropdown */
  hideEpicOption?: boolean;
}

export function QuickCreateInput({
  onClose,
  onCreate,
  variant = "inline",
  hideEpicOption,
}: QuickCreateInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dueDatePickerRef = useRef<HTMLInputElement>(null);

  const { draft, updateDraft, resetDraft } = useQuickCreateDraft();
  const { title, type, assigneeId, dueDate } = draft;

  const assignee = mockUsers.find((u) => u.id === assigneeId);

  // Auto-scroll into view when mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      // If the clicked element is no longer in the DOM (e.g. a Radix item that closed and unmounted), ignore it
      if (!target.isConnected) return;
      if (containerRef.current && containerRef.current.contains(target)) return;
      // Ignore clicks inside Radix portals/popups
      if (
        target.closest(
          `[role="dialog"], [role="menu"], [role="listbox"], [data-radix-popper-content-wrapper], [data-radix-portal]`,
        )
      )
        return;
      onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate({ title, type, assigneeId, dueDate });
    resetDraft();
  };

  const TypePicker = (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-1 px-1.5 text-muted-foreground hover:bg-muted/50 rounded cursor-pointer h-7 shrink-0">
          {type === "epic" ? (
            <Crown className="w-4 h-4 text-purple-500 fill-purple-500/20" />
          ) : type === "bug" ? (
            <Bug className="w-4 h-4 text-red-500 fill-red-500/20" />
          ) : (
            <ClipboardList className="w-4 h-4 text-blue-500 fill-blue-500/20" />
          )}
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        <DropdownMenuItem
          onClick={() => updateDraft("type", "task")}
          className="gap-2"
        >
          <ClipboardList className="w-4 h-4 text-blue-500 fill-blue-500/20" />{" "}
          Task
        </DropdownMenuItem>
        {!hideEpicOption && (
          <DropdownMenuItem
            onClick={() => updateDraft("type", "epic")}
            className="gap-2"
          >
            <Crown className="w-4 h-4 text-purple-500 fill-purple-500/20" />{" "}
            Epic
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => updateDraft("type", "bug")}
          className="gap-2"
        >
          <Bug className="w-4 h-4 text-red-500 fill-red-500/20" /> Bug
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const DatePicker = (
    <div className="relative">
      <input
        type="date"
        ref={dueDatePickerRef}
        className="absolute bottom-0 left-0 w-0 h-0 opacity-0 pointer-events-none [color-scheme:dark]"
        value={dueDate || ""}
        onChange={(e) => updateDraft("dueDate", e.target.value)}
      />
      <Button
        variant="ghost"
        className={`h-7 cursor-pointer hover:bg-muted/50 ${dueDate ? "px-2 gap-1.5 text-foreground" : "w-7 px-0 text-muted-foreground"}`}
        onClick={() => dueDatePickerRef.current?.showPicker()}
      >
        <CalendarIcon className="w-4 h-4" />
        {dueDate && (
          <span className="text-[13px]">
            {new Date(dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </Button>
    </div>
  );

  const AssigneePicker = (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`w-7 h-7 cursor-pointer hover:text-foreground ${assignee ? "p-0" : "text-muted-foreground"}`}
        >
          {assignee ? (
            <Avatar className="w-5 h-5">
              <AvatarImage src={assignee.avatarUrl} />
              <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ) : (
            <User className="w-4 h-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search user..." className="h-9" />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => updateDraft("assigneeId", null)}
                className="gap-2 cursor-pointer"
              >
                <div className="h-6 w-6 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center bg-muted/20 shrink-0">
                  <User className="w-3.5 h-3.5 text-muted-foreground/50" />
                </div>
                Unassigned
              </CommandItem>
              {mockUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => updateDraft("assigneeId", user.id)}
                  className="gap-2 cursor-pointer"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{user.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  const EnterBtn = (
    <button
      className={`flex items-center justify-center h-7 w-7 rounded transition-colors cursor-pointer disabled:cursor-not-allowed ${
        title.trim()
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      disabled={!title.trim()}
      onClick={handleCreate}
    >
      <CornerDownLeft className="w-3.5 h-3.5" />
    </button>
  );

  if (variant === "card") {
    return (
      <div
        ref={containerRef}
        className="border-[1.5px] border-primary rounded-lg bg-background w-full overflow-hidden"
      >
        <div className="px-3 pt-3 pb-2 min-h-[52px]">
          <input
            type="text"
            placeholder="What needs to be done?"
            className="w-full bg-transparent border-none outline-none text-[14px] text-foreground placeholder:text-muted-foreground/60 leading-snug"
            value={title}
            onChange={(e) => updateDraft("title", e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter") handleCreate();
            }}
          />
        </div>
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5">
            {TypePicker}
            {DatePicker}
            {AssigneePicker}
          </div>
          {EnterBtn}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-2 border-[1.5px] border-primary rounded-md p-1 bg-background shadow-[0_0_0_1px_rgba(59,130,246,0.1)] w-full"
    >
      {TypePicker}
      <input
        type="text"
        placeholder="What needs to be done?"
        className="flex-1 bg-transparent border-none outline-none text-[13px] text-foreground placeholder:text-muted-foreground"
        value={title}
        onChange={(e) => updateDraft("title", e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Enter") handleCreate();
        }}
      />
      <div className="flex items-center gap-1 pr-1 shrink-0">
        {DatePicker}
        {AssigneePicker}
        {EnterBtn}
      </div>
    </div>
  );
}
