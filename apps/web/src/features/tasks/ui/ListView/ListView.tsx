import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  ChevronDown,
  MoreHorizontal,
  Crown,
  ClipboardList,
  Bug,
  Plus,
  RotateCcw,
  ArrowDownWideNarrow,
  ArrowUpRight,
  CalendarIcon,
  X,
  SquarePen,
  Square,
  Eye,
  Trash2,
  GripVertical,
  CornerDownLeft,
  SquaresExclude,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  useTasksByProject,
  useUpdateTask,
  useCreateTask,
} from "../../model/useTasks";
import { useProjectColumns } from "../../model/useWorkflow";
import type { ProjectCapabilities } from "@/features/projects/model/types";
import { mockUsers } from "@/features/users/model/mockUsers";
import { PriorityIcon } from "../PriorityIcon";
import { TaskDetailModal } from "../TaskDetailModal/TaskDetailModal";
import { TaskDetailPanel } from "../TaskDetailModal/components/TaskDetailPanel";
import { BulkEditPanel } from "./components/BulkEditPanel";
import type { Task, TaskStatus, TaskUpdateData } from "../../model/types";
import type { User as UserModel } from "@/features/users/model/types";
import {
  useQuickCreateDraft,
  type QuickCreateDraft,
} from "../shared/useQuickCreateDraft";
import { getTaskStatusClassName } from "../shared/taskStatus";
import {
  filterTasks,
  flattenTaskTree,
  orderTaskTree,
} from "../../model/taskViewUtils";
import { isSubtask } from "../../model/taskHierarchy";

// ---------- InlineCreateRow ----------
function QuickCreateInput({
  onClose,
  containerWidth,
  onCreate,
  asRow = true,
}: {
  onClose: () => void;
  containerWidth?: number;
  onCreate: (data: QuickCreateDraft) => void;
  asRow?: boolean;
}) {
  const containerRef = useRef<HTMLElement | null>(null);
  const setContainerRef = (node: HTMLElement | null) => {
    containerRef.current = node;
  };
  const dueDatePickerRef = useRef<HTMLInputElement>(null);

  const { draft, updateDraft } = useQuickCreateDraft();
  const { title, type, assigneeId, dueDate } = draft;

  const assignee = mockUsers.find((u) => u.id === assigneeId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.isConnected) return;
      if (containerRef.current && containerRef.current.contains(target)) return;
      if (
        target.closest(
          '[role="dialog"], [role="menu"], [role="listbox"], [data-radix-popper-content-wrapper], [data-radix-portal]',
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
  };

  const content = (
    <div className="flex-1 flex items-center gap-2 border-[1.5px] border-primary rounded-md p-1 bg-background shadow-[0_0_0_1px_rgba(59,130,246,0.1)] mx-[1px]">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-1 px-1.5 text-muted-foreground hover:bg-muted/50 rounded cursor-pointer h-7">
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
          <DropdownMenuItem
            onClick={() => updateDraft("type", "epic")}
            className="gap-2"
          >
            <Crown className="w-4 h-4 text-purple-500 fill-purple-500/20" />{" "}
            Epic
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => updateDraft("type", "bug")}
            className="gap-2"
          >
            <Bug className="w-4 h-4 text-red-500 fill-red-500/20" /> Bug
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        type="text"
        placeholder="What needs to be done?"
        className="flex-1 bg-transparent border-none outline-none text-[13px] text-foreground placeholder:text-muted-foreground ml-1"
        value={title}
        onChange={(e) => updateDraft("title", e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Enter") handleCreate();
        }}
      />
      <div className="flex items-center gap-1.5 pr-1">
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
            <CalendarIcon
              className={`w-4 h-4 ${dueDate ? "text-muted-foreground" : ""}`}
            />
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

        <Popover>
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
          <PopoverContent className="w-52 p-0" align="end">
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

        <button
          className={`flex items-center h-7 px-3 gap-1.5 rounded transition-colors text-[13px] font-medium cursor-pointer disabled:cursor-not-allowed ${title.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          disabled={!title.trim()}
          onClick={handleCreate}
        >
          Create
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  if (asRow) {
    return (
      <tr
        ref={setContainerRef}
        className="border-b border-border bg-background group animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <td colSpan={12} className="p-0 border-b border-border">
          <div
            className="sticky left-0 flex items-center"
            style={{ width: containerWidth ? `${containerWidth}px` : "100%" }}
          >
            {content}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div
      ref={setContainerRef}
      className="flex items-center w-full bg-muted/10 border-t border-border shrink-0 animate-in fade-in duration-200"
    >
      <div className="flex-1 w-full">{content}</div>
    </div>
  );
}

// ---------- SortableTableRow ----------
interface SortableTableRowProps {
  id: string;
  isChecked: boolean;
  depth: number;
  hasChildren: boolean;
  hasAnyChildrenInList: boolean;
  task: Task;
  assignee: UserModel | null;
  reporter: UserModel | null;
  collapsedIds: Set<string>;
  editingTitleId: string | null;
  editTitleValue: string;
  openAssigneeId: string | null;
  openReporterId: string | null;
  editingDueDateId: string | null;
  editDueDateValue: string;
  todayPlaceholder: string;
  getPriorityLabel: (priority: string) => string;
  getTypeIcon: (task: Task) => React.ReactNode;
  getStatusClass: (status: TaskStatus) => string;
  formatDueDateDisplay: (date?: string) => string;
  onToggleCollapse: (id: string, event: React.MouseEvent) => void;
  onSelectTask: (id: string, checked: boolean) => void;
  onSelectTaskId: (id: string) => void;
  onEditTitle: (id: string, title: string) => void;
  onTitleSubmit: (task: Task) => void;
  onSetEditTitleValue: (value: string) => void;
  onSetOpenAssigneeId: (id: string | null) => void;
  onSetOpenReporterId: (id: string | null) => void;
  onSetEditingDueDateId: (id: string | null) => void;
  onSetEditDueDateValue: (value: string) => void;
  onDueDateInputRef: (id: string, input: HTMLInputElement | null) => void;
  onOpenDueDatePicker: (id: string) => void;
  updateTask: {
    mutate: (variables: { taskId: string; data: TaskUpdateData }) => void;
  };
  isLastRow: boolean;
  onInlineCreate: (id: string) => void;
  isInlineCreateOpen: boolean;
}

function SortableTableRow({
  id,
  isChecked,
  depth,
  hasChildren,
  hasAnyChildrenInList,
  task,
  assignee,
  reporter,
  collapsedIds,
  editingTitleId,
  editTitleValue,
  openAssigneeId,
  openReporterId,
  editingDueDateId,
  editDueDateValue,
  onDueDateInputRef,
  onOpenDueDatePicker,
  todayPlaceholder,
  getPriorityLabel,
  getTypeIcon,
  getStatusClass,
  formatDueDateDisplay,
  onToggleCollapse,
  onSelectTask,
  onSelectTaskId,
  onEditTitle,
  onTitleSubmit,
  onSetEditTitleValue,
  onSetOpenAssigneeId,
  onSetOpenReporterId,
  onSetEditingDueDateId,
  onSetEditDueDateValue,
  updateTask,
  isLastRow,
  onInlineCreate,
  isInlineCreateOpen,
}: SortableTableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
    zIndex: isDragging ? 1 : "auto",
  };

  const parseDateInput = (val: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const parts = val.split("/");
    if (parts.length === 3) {
      const [m, d, y] = parts;
      if (m && d && y && y.length === 4)
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return "";
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-border group transition-colors relative bg-background ${
        isChecked ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"
      }`}
    >
      {/* Sticky drag handle â€” stays at left border even on horizontal scroll */}
      <td
        className="sticky left-0 z-10 group-hover:z-30 bg-background p-0 w-6 border-b border-border relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`absolute inset-0 pointer-events-none transition-colors ${isChecked ? "bg-primary/10 group-hover:bg-primary/20" : "bg-muted/20 group-hover:bg-muted/40"}`}
        />
        {/* Inline Create Trigger (Bottom of row) */}
        {!isLastRow && !isInlineCreateOpen && (
          <div className="peer/inline-create absolute -bottom-[7px] left-0 w-[100vw] h-[14px] z-50 group/inline-create">
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-[2px] bg-primary opacity-0 group-hover/inline-create:opacity-100 transition-opacity pointer-events-none" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-background border-[1.5px] border-primary rounded hover:bg-primary hover:text-primary-foreground text-primary shadow-sm opacity-0 group-hover/inline-create:opacity-100 transition-colors cursor-pointer"
              title="Create"
              onClick={(e) => {
                e.stopPropagation();
                onInlineCreate(id);
              }}
            >
              <Plus className="w-4 h-4" />
            </div>
          </div>
        )}

        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-6 h-10 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 peer-hover/inline-create:!opacity-0 transition-opacity text-muted-foreground hover:text-foreground relative"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </td>

      {/* Checkbox */}
      <td className="py-1.5 px-3" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          className="rounded-[4px] border-muted-foreground/40"
          checked={isChecked}
          onCheckedChange={(checked) =>
            onSelectTask(task.id, checked as boolean)
          }
        />
      </td>

      {/* Work / Title */}
      <td className="py-1.5 px-3 group/work h-[40px]">
        <div
          className="flex items-center gap-2 h-full relative"
          style={{ paddingLeft: `${depth * 1.5}rem` }}
        >
          {hasAnyChildrenInList && (
            <div
              className={`flex items-center justify-center w-5 h-5 shrink-0 rounded-sm hover:bg-muted/50 transition-colors cursor-pointer ${hasChildren ? "" : "opacity-0 pointer-events-none"}`}
              onClick={(e) => onToggleCollapse(task.id, e)}
            >
              {hasChildren && (
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${collapsedIds.has(task.id) ? "-rotate-90" : ""}`}
                />
              )}
            </div>
          )}
          {getTypeIcon(task)}
          <span
            className="text-primary hover:underline font-medium cursor-pointer shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTaskId(task.id);
            }}
          >
            {task.code}
          </span>
          <div className="flex-1 min-w-0 flex items-center pr-[70px]">
            {editingTitleId === task.id ? (
              <input
                autoFocus
                value={editTitleValue}
                onChange={(e) => onSetEditTitleValue(e.target.value)}
                onBlur={() => onTitleSubmit(task)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onTitleSubmit(task);
                  if (e.key === "Escape") onEditTitle("", "");
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full min-w-[200px] max-w-[800px] h-[26px] px-1.5 bg-background border-2 border-primary rounded text-foreground focus:outline-none text-[13px]"
              />
            ) : (
              <div
                className="flex items-center flex-1 h-[26px] min-w-0 cursor-text border border-transparent hover:border-border hover:bg-muted/30 rounded px-1.5 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTitle(task.id, task.title);
                }}
              >
                <span className="text-foreground truncate block w-full">
                  {task.title}
                </span>
              </div>
            )}
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/work:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm px-1.5 h-full">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 hover:bg-muted text-muted-foreground"
              title="Open"
              onClick={(e) => {
                e.stopPropagation();
                onSelectTaskId(task.id);
              }}
            >
              <ArrowUpRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 hover:bg-muted text-muted-foreground"
              title="Add child"
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </td>

      {/* Assignee */}
      <td className="py-1.5 px-3">
        <Popover
          open={openAssigneeId === task.id}
          onOpenChange={(o) => onSetOpenAssigneeId(o ? task.id : null)}
        >
          <PopoverTrigger asChild>
            <button
              className="flex items-center gap-2 hover:bg-muted/50 p-1 -m-1 rounded transition-colors w-full text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {assignee ? (
                <>
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={assignee.avatarUrl} />
                    <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground truncate">
                    {assignee.name}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center bg-muted/20">
                    <User className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </div>
                  <span className="text-muted-foreground/70 truncate">
                    Unassigned
                  </span>
                </>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search user..." className="h-9" />
              <CommandList>
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      updateTask.mutate({
                        taskId: task.id,
                        data: { assigneeId: null },
                      });
                      onSetOpenAssigneeId(null);
                    }}
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
                      onSelect={() => {
                        updateTask.mutate({
                          taskId: task.id,
                          data: { assigneeId: user.id },
                        });
                        onSetOpenAssigneeId(null);
                      }}
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
      </td>

      {/* Reporter */}
      <td className="py-1.5 px-3">
        <Popover
          open={openReporterId === task.id}
          onOpenChange={(o) => onSetOpenReporterId(o ? task.id : null)}
        >
          <PopoverTrigger asChild>
            <button
              className="flex items-center gap-2 hover:bg-muted/50 p-1 -m-1 rounded transition-colors w-full text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {reporter ? (
                <>
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={reporter.avatarUrl} />
                    <AvatarFallback>{reporter.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground truncate">
                    {reporter.name}
                  </span>
                </>
              ) : null}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search user..." className="h-9" />
              <CommandList>
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandGroup>
                  {mockUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => {
                        updateTask.mutate({
                          taskId: task.id,
                          data: { reporterId: user.id },
                        });
                        onSetOpenReporterId(null);
                      }}
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
      </td>

      {/* Priority */}
      <td className="py-1.5 px-3">
        <div className="flex items-center gap-2">
          <PriorityIcon priority={task.priority} />
          <span className="text-muted-foreground">
            {getPriorityLabel(task.priority)}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="py-1.5 px-3" onClick={(e) => e.stopPropagation()}>
        <Select
          value={task.status}
          onValueChange={(val) =>
            updateTask.mutate({
              taskId: task.id,
              data: { status: val as TaskStatus },
            })
          }
        >
          <SelectTrigger
            className={`inline-flex items-center w-fit h-fit px-2 py-0.5 rounded-md text-[11px] font-bold uppercase border transition-colors cursor-pointer focus:ring-0 focus:outline-none ${getStatusClass(task.status)}`}
          >
            <SelectValue>{task.status.replace("-", " ")}</SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="todo">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                To Do
              </div>
            </SelectItem>
            <SelectItem value="in-progress">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                In Progress
              </div>
            </SelectItem>
            <SelectItem value="review">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-600" />
                Review
              </div>
            </SelectItem>
            <SelectItem value="done">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
                Done
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </td>

      {/* Resolution */}
      <td className="py-1.5 px-3">
        <span className="text-muted-foreground">
          {task.status === "done" ? "Done" : "Unresolved"}
        </span>
      </td>

      {/* Created */}
      <td className="py-1.5 px-3">
        <span className="text-muted-foreground">
          {task.createdAt
            ? new Date(task.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : "None"}
        </span>
      </td>

      {/* Updated */}
      <td className="py-1.5 px-3">
        <span className="text-muted-foreground">
          {task.createdAt
            ? new Date(task.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : "None"}
        </span>
      </td>

      {/* Due date */}
      <td className="py-1.5 px-3" onClick={(e) => e.stopPropagation()}>
        <div
          className="relative flex items-center h-7"
          style={{ width: "180px" }}
        >
          {editingDueDateId === task.id ? (
            <input
              autoFocus
              type="text"
              value={editDueDateValue}
              placeholder={todayPlaceholder}
              onChange={(e) => onSetEditDueDateValue(e.target.value)}
              onBlur={() => {
                const iso = parseDateInput(editDueDateValue.trim());
                if (iso)
                  updateTask.mutate({
                    taskId: task.id,
                    data: { dueDate: iso },
                  });
                else if (editDueDateValue.trim() === "")
                  updateTask.mutate({ taskId: task.id, data: { dueDate: "" } });
                onSetEditingDueDateId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") onSetEditingDueDateId(null);
              }}
              className="absolute inset-0 w-full h-full pl-2 pr-[52px] bg-background border-2 border-primary rounded text-foreground focus:outline-none text-[13px]"
            />
          ) : (
            <button
              className="absolute inset-0 flex items-center pl-2 pr-[52px] border border-transparent hover:border-border hover:bg-muted/30 rounded transition-colors text-left"
              onClick={() => {
                onSetEditingDueDateId(task.id);
                onSetEditDueDateValue(formatDueDateDisplay(task.dueDate));
              }}
            >
              <span
                className={`text-[13px] truncate ${task.dueDate ? "text-foreground" : "text-muted-foreground/40"}`}
              >
                {task.dueDate
                  ? formatDueDateDisplay(task.dueDate)
                  : todayPlaceholder}
              </span>
            </button>
          )}
          <div
            className={`absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 transition-opacity ${editingDueDateId === task.id ? "opacity-100" : "opacity-0"}`}
          >
            <div className="relative">
              <button
                title="Pick a date"
                className="flex items-center justify-center w-6 h-6 rounded hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDueDatePicker(task.id);
                }}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
              </button>
              <input
                type="date"
                id={`due-date-${task.id}`}
                ref={(input) => onDueDateInputRef(task.id, input)}
                className="absolute bottom-0 left-0 w-0 h-0 opacity-0 pointer-events-none [color-scheme:dark]"
                value={
                  task.dueDate
                    ? new Date(task.dueDate + "T00:00:00")
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  if (e.target.value)
                    updateTask.mutate({
                      taskId: task.id,
                      data: { dueDate: e.target.value },
                    });
                }}
              />
            </div>
            {task.dueDate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateTask.mutate({ taskId: task.id, data: { dueDate: "" } });
                }}
                className="flex items-center justify-center rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40 p-0.5 transition-colors cursor-pointer w-4 h-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </td>

      {/* Actions */}
      <td className="py-1.5 px-3 text-right">
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
}
// ---------- End SortableTableRow ----------

interface ListViewProps {
  projectId: string;
  searchQuery: string;
  parentIds: string[];
  assigneeIds: string[];
  priorities: string[];
  statuses: string[];
  workTypes: string[];
  labels: string[];
  layout?: "table" | "split";
  headerSlot?: React.ReactNode;
  initialTaskId?: string | null;
  onInitialTaskOpen?: () => void;
  capabilities?: ProjectCapabilities;
}

export function ListView({
  projectId,
  searchQuery,
  parentIds,
  assigneeIds,
  priorities,
  statuses,
  workTypes,
  labels,
  layout = "table",
  headerSlot,
  initialTaskId,
  onInitialTaskOpen,
  capabilities,
}: ListViewProps) {
  const { data: tasks = [] } = useTasksByProject(projectId);
  const { data: columns = [] } = useProjectColumns(projectId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [openAssigneeId, setOpenAssigneeId] = useState<string | null>(null);
  const [openReporterId, setOpenReporterId] = useState<string | null>(null);
  const [editingDueDateId, setEditingDueDateId] = useState<string | null>(null);
  const [editDueDateValue, setEditDueDateValue] = useState("");
  const dueDateHiddenRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const handleDueDateInputRef = useCallback(
    (id: string, input: HTMLInputElement | null) => {
      dueDateHiddenRefs.current[id] = input;
    },
    [],
  );
  const handleOpenDueDatePicker = useCallback((id: string) => {
    dueDateHiddenRefs.current[id]?.showPicker?.();
  }, []);
  const updateTask = useUpdateTask();
  const createTaskMutation = useCreateTask();
  const canCreateWorkItems = Boolean(capabilities?.canCreateWorkItems);
  const canUpdateWorkItems = Boolean(capabilities?.canUpdateWorkItems);

  const guardedUpdateTask = useMemo(
    () => ({
      mutate: (variables: { taskId: string; data: TaskUpdateData }) => {
        if (!canUpdateWorkItems) {
          toast.error("You do not have permission to update work items.");
          return;
        }
        updateTask.mutate(variables);
      },
    }),
    [canUpdateWorkItems, updateTask],
  );

  const guardedCreateTask = useCallback(
    (...args: Parameters<typeof createTaskMutation.mutate>) => {
      if (!canCreateWorkItems) {
        toast.error("You do not have permission to create work items.");
        return;
      }
      createTaskMutation.mutate(...args);
    },
    [canCreateWorkItems, createTaskMutation],
  );

  const [checkedTaskIds, setCheckedTaskIds] = useState<Set<string>>(new Set());
  const [isBulkEditing, setIsBulkEditing] = useState(false);

  useEffect(() => {
    if (!initialTaskId) return;
    const taskToOpen = tasks.find((task) => task.id === initialTaskId);
    if (!taskToOpen) return;
    setSelectedTaskId(taskToOpen.id);
    onInitialTaskOpen?.();
  }, [initialTaskId, tasks, onInitialTaskOpen]);

  // Custom resize state (replaces react-resizable-panels)
  const panelGroupRef = useRef<HTMLDivElement>(null);
  const [bulkPanelWidth, setBulkPanelWidth] = useState<number | null>(380);
  const [isResizing, setIsResizing] = useState(false);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const container = panelGroupRef.current;
    if (!container) return;
    const containerWidth = container.getBoundingClientRect().width;
    const minBulk = 320;
    const maxBulk = Math.floor(containerWidth * 0.5);
    setIsResizing(true);

    const onMove = (mv: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const distFromRight = rect.right - mv.clientX;
      const clamped = Math.max(minBulk, Math.min(maxBulk, distFromRight));
      setBulkPanelWidth(clamped);
    };
    const onUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  useEffect(() => {
    if (checkedTaskIds.size === 0) setIsBulkEditing(false);
  }, [checkedTaskIds.size]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setCheckedTaskIds(new Set(flatRenderList.map((item) => item.task.id)));
    } else {
      setCheckedTaskIds(new Set());
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    setCheckedTaskIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  };

  const todayPlaceholder = new Date().toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  function formatDueDateDisplay(dateStr: string | undefined | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  }

  useEffect(() => {
    setSelectedTaskId(null);
    setEditingTitleId(null);
  }, [layout]);

  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  // Apply filters
  const filteredTasks = filterTasks(tasks, {
    searchQuery,
    parentIds,
    assigneeIds,
    statuses,
    priorities,
    workTypes,
    labels,
    labelMatch: "all",
  });

  const [inlineCreateRowId, setInlineCreateRowId] = useState<string | null>(
    null,
  );
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const [containerWidth, setContainerWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    if (node) {
      observerRef.current = new ResizeObserver((entries) => {
        setContainerWidth(entries[0].contentRect.width);
      });
      observerRef.current.observe(node);
    }
  }, []);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const flatRenderList = flattenTaskTree(filteredTasks, collapsedIds);

  const getUser = (id?: string) => {
    if (!id) return null;
    return mockUsers.find((u) => u.id === id) || null;
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const handleTitleSubmit = (task: Task) => {
    if (editTitleValue.trim() && editTitleValue !== task.title) {
      guardedUpdateTask.mutate({
        taskId: task.id,
        data: { title: editTitleValue.trim() },
      });
    }
    setEditingTitleId(null);
  };

  const getTypeIcon = (task: Task) => {
    if (isSubtask(task, tasks)) {
      return <SquaresExclude className="w-4 h-4 text-cyan-500" />;
    }

    switch (task.type) {
      case "epic":
        return <Crown className="w-4 h-4 text-purple-500 fill-purple-500/20" />;
      case "bug":
        return <Bug className="w-4 h-4 text-red-500 fill-red-500/20" />;
      default:
        return (
          <ClipboardList className="w-4 h-4 text-blue-500 fill-blue-500/20" />
        );
    }
  };

  const hasAnyChildrenInList = flatRenderList.some((item) => item.hasChildren);

  // Row reorder state â€” stores task IDs in current display order
  const [rowOrder, setRowOrder] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRowOrder((previous) => {
        const currentOrder = orderTaskTree(flatRenderList, previous).map(
          (item) => item.task.id,
        );
        const oldIndex = currentOrder.indexOf(active.id as string);
        const newIndex = currentOrder.indexOf(over.id as string);
        return arrayMove(currentOrder, oldIndex, newIndex);
      });
    }
  };

  const orderedRenderList = orderTaskTree(flatRenderList, rowOrder);

  return (
    <div className="flex flex-col h-full overflow-hidden text-sm relative">
      {layout === "split" ? (
        <>
          {headerSlot}
          <div className="flex flex-1 overflow-hidden pt-0">
            {/* Left Sidebar List */}
            <div className="w-[324px] flex-shrink-0 bg-background pl-6">
              <div
                className={`h-full w-[300px] border-x border-t border-border bg-background flex flex-col overflow-hidden ${selectedTask ? "rounded-tl-md" : "rounded-t-md"}`}
              >
                <div className="flex h-[65px] items-center justify-between p-3 border-b border-border/40 bg-card">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Custom field{" "}
                        <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem>Custom field</DropdownMenuItem>
                      <DropdownMenuItem>Issue Type</DropdownMenuItem>
                      <DropdownMenuItem>Status</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex items-center gap-0.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 hover:bg-muted text-muted-foreground transition-colors"
                          title="Order work items by"
                        >
                          <ArrowDownWideNarrow className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Order work items by
                        </div>
                        <DropdownMenuItem>Created</DropdownMenuItem>
                        <DropdownMenuItem>Key</DropdownMenuItem>
                        <DropdownMenuItem>Last viewed</DropdownMenuItem>
                        <DropdownMenuItem>Priority</DropdownMenuItem>
                        <DropdownMenuItem>Resolved</DropdownMenuItem>
                        <DropdownMenuItem>Status</DropdownMenuItem>
                        <DropdownMenuItem>Updated</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 hover:bg-muted text-muted-foreground transition-colors"
                      title="Refresh"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  {filteredTasks.map((task) => {
                    const assignee = getUser(task.assigneeId);
                    const isSelected = selectedTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`flex flex-col gap-1 p-3 cursor-pointer border-l-2 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-muted/30"
                        }`}
                      >
                        <div
                          className={`font-medium truncate ${isSelected ? "text-primary" : "text-foreground"}`}
                        >
                          {task.title}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {getTypeIcon(task)}
                            <span className="text-xs font-medium text-muted-foreground hover:underline">
                              {task.code}
                            </span>
                          </div>
                          {assignee ? (
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={assignee.avatarUrl} />
                              <AvatarFallback className="text-[9px]">
                                {assignee.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center bg-muted/20">
                              <User className="w-3.5 h-3.5 text-muted-foreground/60" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Detail Panel */}
            <div className="flex-1 overflow-hidden bg-background relative">
              {selectedTask ? (
                <div className="absolute inset-0">
                  <TaskDetailPanel
                    task={selectedTask}
                    onClose={() => setSelectedTaskId(null)}
                    columns={columns}
                    isEmbedded
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a task to view details
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 overflow-hidden" ref={panelGroupRef}>
          {/* Left panel */}
          <div
            className="flex flex-col overflow-hidden flex-shrink-0"
            style={{
              width: isBulkEditing
                ? `calc(100% - ${bulkPanelWidth ?? 380}px - 2px)`
                : "100%",
            }}
          >
            {headerSlot}
            <div className="flex-1 flex flex-col overflow-hidden px-6 pb-4 pt-4">
              <div className="border border-border rounded-lg bg-background flex flex-col min-h-0 overflow-hidden">
                <div
                  ref={containerRef}
                  className="overflow-auto custom-scrollbar table-scrollbar-offset min-h-0"
                >
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <table
                      className="text-left border-collapse whitespace-nowrap min-w-full"
                      style={{ tableLayout: "fixed" }}
                    >
                      <colgroup>
                        <col style={{ width: "24px", minWidth: "24px" }} />
                        {/* drag handle */}
                        <col className="w-10" />
                        <col style={{ minWidth: "360px", width: "360px" }} />
                        <col style={{ width: "180px", minWidth: "180px" }} />
                        <col style={{ width: "180px", minWidth: "180px" }} />
                        <col style={{ width: "128px", minWidth: "128px" }} />
                        <col style={{ width: "160px", minWidth: "160px" }} />
                        <col style={{ width: "128px", minWidth: "128px" }} />
                        <col style={{ width: "192px", minWidth: "192px" }} />
                        <col style={{ width: "192px", minWidth: "192px" }} />
                        <col style={{ width: "220px", minWidth: "220px" }} />
                        <col style={{ width: "48px", minWidth: "48px" }} />
                      </colgroup>
                      <thead className="sticky top-0 bg-background/95 backdrop-blur z-10">
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="py-2 sticky left-0 bg-background/95 z-20 w-6 relative after:absolute after:inset-0 after:bg-muted/20 after:pointer-events-none"></th>
                          <th className="py-2 px-3 font-medium">
                            <Checkbox
                              className="rounded-[4px] border-muted-foreground/40"
                              checked={
                                checkedTaskIds.size === 0
                                  ? false
                                  : checkedTaskIds.size ===
                                      flatRenderList.length
                                    ? true
                                    : "indeterminate"
                              }
                              onCheckedChange={(checked) => {
                                const isIndeterminate =
                                  checkedTaskIds.size > 0 &&
                                  checkedTaskIds.size < flatRenderList.length;
                                if (isIndeterminate) {
                                  handleSelectAll(false);
                                } else {
                                  handleSelectAll(checked as boolean);
                                }
                              }}
                            />
                          </th>
                          <th className="py-2 px-3 font-medium">Work</th>
                          <th className="py-2 px-3 font-medium">Assignee</th>
                          <th className="py-2 px-3 font-medium">Reporter</th>
                          <th className="py-2 px-3 font-medium">Priority</th>
                          <th className="py-2 px-3 font-medium">Status</th>
                          <th className="py-2 px-3 font-medium">Resolution</th>
                          <th className="py-2 px-3 font-medium">Created</th>
                          <th className="py-2 px-3 font-medium">Updated</th>
                          <th className="py-2 px-3 font-medium">Due date</th>
                          <th className="py-2 px-3 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderedRenderList.length === 0 ? (
                          <tr>
                            <td
                              colSpan={12}
                              className="py-12 text-center text-muted-foreground"
                            >
                              No tasks found matching the filters.
                            </td>
                          </tr>
                        ) : (
                          <SortableContext
                            items={orderedRenderList.map((i) => i.task.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {orderedRenderList.map(
                              ({ task, depth, hasChildren }, index) => {
                                const assignee = getUser(task.assigneeId);
                                const reporter =
                                  getUser(task.reporterId) || getUser("user-1"); // fallback

                                return (
                                  <React.Fragment key={task.id}>
                                    <SortableTableRow
                                      id={task.id}
                                      isChecked={checkedTaskIds.has(task.id)}
                                      depth={depth}
                                      hasChildren={hasChildren}
                                      hasAnyChildrenInList={
                                        hasAnyChildrenInList
                                      }
                                      task={task}
                                      assignee={assignee}
                                      reporter={reporter}
                                      collapsedIds={collapsedIds}
                                      editingTitleId={editingTitleId}
                                      editTitleValue={editTitleValue}
                                      openAssigneeId={openAssigneeId}
                                      openReporterId={openReporterId}
                                      editingDueDateId={editingDueDateId}
                                      editDueDateValue={editDueDateValue}
                                      onDueDateInputRef={handleDueDateInputRef}
                                      onOpenDueDatePicker={
                                        handleOpenDueDatePicker
                                      }
                                      todayPlaceholder={todayPlaceholder}
                                      getPriorityLabel={getPriorityLabel}
                                      getTypeIcon={getTypeIcon}
                                      getStatusClass={getTaskStatusClassName}
                                      formatDueDateDisplay={
                                        formatDueDateDisplay
                                      }
                                      onToggleCollapse={toggleCollapse}
                                      onSelectTask={handleSelectTask}
                                      onSelectTaskId={setSelectedTaskId}
                                      onEditTitle={(
                                        id: string,
                                        title: string,
                                      ) => {
                                        setEditingTitleId(id);
                                        setEditTitleValue(title);
                                      }}
                                      onTitleSubmit={handleTitleSubmit}
                                      onSetEditTitleValue={setEditTitleValue}
                                      onSetOpenAssigneeId={setOpenAssigneeId}
                                      onSetOpenReporterId={setOpenReporterId}
                                      onSetEditingDueDateId={
                                        setEditingDueDateId
                                      }
                                      onSetEditDueDateValue={
                                        setEditDueDateValue
                                      }
                                      updateTask={guardedUpdateTask}
                                      isLastRow={
                                        index === orderedRenderList.length - 1
                                      }
                                      onInlineCreate={setInlineCreateRowId}
                                      isInlineCreateOpen={
                                        inlineCreateRowId !== null
                                      }
                                    />
                                    {canCreateWorkItems &&
                                      inlineCreateRowId === task.id && (
                                        <QuickCreateInput
                                          onClose={() =>
                                            setInlineCreateRowId(null)
                                          }
                                          containerWidth={containerWidth}
                                          onCreate={(data) => {
                                            guardedCreateTask(
                                              {
                                                projectId,
                                                parentId: task.parentId, // inherit the same parent, so it stays at the same level
                                                afterTaskId: task.id, // insert after this task
                                                title: data.title,
                                                type: data.type,
                                                assigneeId:
                                                  data.assigneeId ?? undefined,
                                                dueDate:
                                                  data.dueDate ?? undefined,
                                                status: "todo",
                                                priority: "medium",
                                              },
                                              {
                                                onSuccess: (newTask) => {
                                                  // move the inline create row under the newly created task
                                                  setInlineCreateRowId(
                                                    newTask.id,
                                                  );
                                                },
                                              },
                                            );
                                          }}
                                        />
                                      )}
                                  </React.Fragment>
                                );
                              },
                            )}
                          </SortableContext>
                        )}
                      </tbody>
                    </table>
                  </DndContext>
                </div>
                {/* Table Footer */}
                {canCreateWorkItems && inlineCreateRowId === "bottom" ? (
                  <QuickCreateInput
                    asRow={false}
                    onClose={() => setInlineCreateRowId(null)}
                    onCreate={(data) => {
                      guardedCreateTask(
                        {
                          projectId,
                          title: data.title,
                          type: data.type,
                          assigneeId: data.assigneeId ?? undefined,
                          dueDate: data.dueDate ?? undefined,
                          status: "todo",
                          priority: "medium",
                        },
                        {
                          onSuccess: () => {
                            setInlineCreateRowId("bottom");
                          },
                        },
                      );
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-between p-1.5 border-t border-border bg-muted/10 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        if (!canCreateWorkItems) {
                          toast.error(
                            "You do not have permission to create work items.",
                          );
                          return;
                        }
                        setInlineCreateRowId("bottom");
                      }}
                    >
                      <Plus className="w-4 h-4" /> Create
                    </Button>
                    <div className="flex items-center gap-2 text-muted-foreground mr-2">
                      <span className="text-[13px] font-medium">
                        {flatRenderList.length} of {tasks.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 hover:bg-muted/50 hover:text-foreground text-muted-foreground"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Resize handle + Bulk edit panel */}
          {isBulkEditing && (
            <>
              {/* Drag handle */}
              <div
                onMouseDown={handleResizeMouseDown}
                className="group relative flex-shrink-0 flex items-stretch justify-center cursor-col-resize z-50"
                style={{ width: "2px" }}
              >
                {/* Wider invisible hit area */}
                <div className="absolute inset-y-0 -left-[10px] -right-[10px] cursor-col-resize" />
                <div
                  className={`w-[2px] transition-colors duration-150 relative z-10 ${
                    isResizing
                      ? "bg-primary"
                      : "bg-border/40 group-hover:bg-primary/80"
                  }`}
                />
              </div>
              {/* Right bulk edit panel */}
              <div
                className="flex-shrink-0 overflow-hidden bg-background flex flex-col"
                style={{ width: `${bulkPanelWidth ?? 380}px` }}
              >
                <BulkEditPanel
                  selectedCount={checkedTaskIds.size}
                  onClose={() => setIsBulkEditing(false)}
                />
              </div>
            </>
          )}
        </div>
      )}

      {layout === "table" && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={true}
          onClose={() => setSelectedTaskId(null)}
          columns={columns}
          canUpdate={canUpdateWorkItems}
          canCreate={canCreateWorkItems}
        />
      )}

      {checkedTaskIds.size > 0 && layout !== "split" && !isBulkEditing && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-foreground border border-border shadow-[0_12px_40px_-10px_rgba(0,0,0,0.3)] rounded-xl px-5 py-3 z-50 animate-in slide-in-from-bottom-12 fade-in-0 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] fill-mode-both">
          <div className="flex items-center gap-2 mr-3">
            <span className="h-7 min-w-8 px-2.5 inline-flex items-center justify-center bg-background/20 text-background rounded-md text-[15px] font-bold tabular-nums">
              {checkedTaskIds.size}
            </span>
            <span className="text-[15px] font-medium text-background/90">
              selected
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-background/80 hover:text-background hover:bg-background/10 dark:hover:bg-background/10 px-3 text-[14px]"
            onClick={() => handleSelectAll(true)}
          >
            <ArrowUpRight className="w-4.5 h-4.5 mr-2" />
            Select all
          </Button>

          <div className="w-[1px] h-6 bg-background/20 mx-1.5"></div>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-background/80 hover:text-background hover:bg-background/10 dark:hover:bg-background/10 px-3 text-[14px]"
            onClick={() => {
              if (panelGroupRef.current) {
                const containerWidth =
                  panelGroupRef.current.getBoundingClientRect().width;
                const maxAllowed = Math.floor(containerWidth * 0.5);
                setBulkPanelWidth((prev) => Math.min(prev ?? 380, maxAllowed));
              }
              setIsBulkEditing(true);
            }}
          >
            <SquarePen className="w-4.5 h-4.5 mr-2" />
            Edit fields
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-background/80 hover:text-background hover:bg-background/10 dark:hover:bg-background/10 px-3 text-[14px]"
          >
            <Square className="w-4.5 h-4.5 mr-2" />
            Change status
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-background/80 hover:text-background hover:bg-background/10 dark:hover:bg-background/10 px-3 text-[14px]"
          >
            <Eye className="w-4.5 h-4.5 mr-2" />
            Watch options
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-background/80 hover:text-background hover:bg-background/10 dark:hover:bg-background/10 px-3 text-[14px]"
          >
            <Trash2 className="w-4.5 h-4.5 mr-2" />
            Delete
          </Button>

          <div className="w-[1px] h-6 bg-background/20 mx-1.5"></div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-background/80 hover:text-background hover:bg-background/10 dark:hover:bg-background/10 shrink-0 ml-1"
            onClick={() => setCheckedTaskIds(new Set())}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
