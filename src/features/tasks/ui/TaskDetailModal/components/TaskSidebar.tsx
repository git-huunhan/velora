import {
  Bug,
  CalendarIcon,
  ChevronDown,
  ClipboardList,
  Crown,
  Tag,
  User as UserIcon,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/features/auth/model/useAuth";
import { useProject } from "@/features/projects";
import {
  getUserAvatarUrl,
  getUserInitials,
} from "@/features/auth/model/userAvatar";
import { useUsers } from "@/features/users";
import { useTasksByProject } from "@/features/tasks/model/useTasks";
import type {
  KanbanColumn,
  Task,
  TaskFieldUpdater,
} from "../../../model/types";
import {
  getTaskParent,
  getValidParentTasks,
  isSubtask,
} from "../../../model/taskHierarchy";
import { PriorityIcon } from "../../PriorityIcon";
import { TaskStatusSelect } from "../../shared/TaskStatusSelect";

function DetailAvatar({ name }: { name: string }) {
  return (
    <Avatar className="h-6 w-6 border border-border/50 shrink-0">
      <AvatarImage src={getUserAvatarUrl({ name })} />
      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
        {getUserInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

interface TaskSidebarProps {
  task: Task;
  handleUpdate: TaskFieldUpdater;
  onOpenTask?: (task: Task) => void;
  className?: string;
  hideStatusDropdown?: boolean;
  columns?: KanbanColumn[];
}

export function TaskSidebar({
  task,
  handleUpdate,
  onOpenTask,
  className,
  hideStatusDropdown,
  columns,
}: TaskSidebarProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [isParentSelectOpen, setIsParentSelectOpen] = useState(false);
  const [isReporterOpen, setIsReporterOpen] = useState(false);
  const [isLabelsOpen, setIsLabelsOpen] = useState(false);

  const { users } = useUsers();
  const { data: project } = useProject(task.projectId);
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id;
  const projectMemberIds = new Set(project?.memberIds ?? []);
  const selectableUsers =
    projectMemberIds.size > 0
      ? users.filter((user) => projectMemberIds.has(user.id))
      : users;

  // Use current user as reporter fallback when no reporter is set
  const reporterDisplay = task.reporter ?? {
    id: currentUserId ?? "",
    name: currentUser?.name ?? "Current user",
    avatarUrl: getUserAvatarUrl(currentUser),
  };

  const { data: tasks = [] } = useTasksByProject(task.projectId);
  const parentTask = getTaskParent(task, tasks);
  const taskIsSubtask = isSubtask(task, tasks);
  const potentialParents = getValidParentTasks(task, tasks);

  return (
    <div
      className={
        className ||
        "w-1/3 min-w-[300px] shrink-0 bg-muted/10 flex flex-col overflow-hidden relative border-l border-transparent z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.03)] dark:shadow-none"
      }
    >
      <div className="flex-1 p-0 lg:p-5 overflow-visible lg:overflow-y-auto custom-scrollbar min-h-0 space-y-4 pb-12">
        {/* Status Dropdown */}
        {!hideStatusDropdown && (
          <div>
            <TaskStatusSelect
              value={task.status}
              onChange={(status) => handleUpdate("status", status)}
              columns={columns}
            />
          </div>
        )}

        {/* Details Section */}
        <div className="border border-border/50 rounded-xl bg-card shadow-sm overflow-hidden">
          <div
            className="px-4 py-3 font-semibold text-sm flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors text-foreground"
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          >
            <span>Details</span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${!isDetailsOpen ? "-rotate-90" : ""}`}
            />
          </div>
          {isDetailsOpen && (
            <div className="p-4 flex flex-col gap-6 text-[13px] border-t border-border/50">
              {/* PARENT TASK */}
              {task.type !== "epic" && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Parent task
                  </span>
                  <div className="-ml-2 w-[calc(100%+8px)]">
                    <Popover
                      open={isParentSelectOpen}
                      onOpenChange={setIsParentSelectOpen}
                    >
                      <PopoverTrigger asChild>
                        <button className="w-full h-8 px-2 flex items-center justify-between bg-transparent hover:bg-muted/50 focus:ring-1 focus:ring-primary/50 text-[13px] font-medium rounded transition-colors text-left group">
                          {parentTask ? (
                            <div
                              className="flex items-center gap-2 truncate"
                              onClick={(e) => {
                                if (onOpenTask) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onOpenTask(parentTask);
                                }
                              }}
                            >
                              {parentTask.type === "epic" ? (
                                <Crown className="w-4 h-4 text-purple-500 shrink-0" />
                              ) : parentTask.type === "bug" ? (
                                <Bug className="w-4 h-4 text-red-500 shrink-0" />
                              ) : (
                                <ClipboardList className="w-4 h-4 text-primary shrink-0" />
                              )}
                              <span className="truncate hover:underline">
                                {parentTask.code}: {parentTask.title}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Select parent...
                            </span>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-60 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search tasks..." />
                          <CommandList>
                            <CommandEmpty>No tasks found.</CommandEmpty>
                            <CommandGroup>
                              {potentialParents.map((pt) => (
                                <CommandItem
                                  key={pt.id}
                                  onSelect={() => {
                                    handleUpdate("parentId", pt.id);
                                    setIsParentSelectOpen(false);
                                  }}
                                  className="cursor-pointer flex items-center gap-2"
                                >
                                  {pt.type === "epic" ? (
                                    <Crown className="w-4 h-4 text-purple-500 shrink-0" />
                                  ) : pt.type === "bug" ? (
                                    <Bug className="w-4 h-4 text-red-500 shrink-0" />
                                  ) : (
                                    <ClipboardList className="w-4 h-4 text-primary shrink-0" />
                                  )}
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-medium text-[13px]">
                                      {pt.code}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate w-44">
                                      {pt.title}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                              {task.parentId && (
                                <CommandItem
                                  onSelect={() => {
                                    if (taskIsSubtask) {
                                      toast.error(
                                        "We couldn't update the Parent value",
                                        {
                                          description: `Failed to remove ${task.code}'s parent. A parent of a subtask cannot be removed.`,
                                        },
                                      );
                                      setIsParentSelectOpen(false);
                                      return;
                                    }
                                    handleUpdate("parentId", null);
                                    setIsParentSelectOpen(false);
                                  }}
                                  className="cursor-pointer text-muted-foreground flex items-center gap-2 mt-1 border-t border-border/50 rounded-none"
                                >
                                  <X className="w-4 h-4 shrink-0" />
                                  Remove parent
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* ASSIGNEE */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Assignee
                </span>
                <div className="flex flex-col items-start gap-1 -ml-2 w-[calc(100%+8px)]">
                  <Popover
                    open={isAssigneeOpen}
                    onOpenChange={setIsAssigneeOpen}
                  >
                    <PopoverTrigger asChild>
                      <button className="w-full h-8 px-2 flex items-center gap-2 bg-transparent hover:bg-muted/50 focus:ring-1 focus:ring-primary/50 rounded cursor-pointer transition-colors outline-none text-left">
                        {task.assignee ? (
                          <>
                            <DetailAvatar name={task.assignee.name} />
                            <span className="text-foreground font-medium text-[13px] truncate">
                              {task.assignee.name}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="h-6 w-6 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center bg-muted/20 shrink-0">
                              <UserIcon className="w-3.5 h-3.5 text-muted-foreground/60" />
                            </div>
                            <span className="text-foreground font-medium text-[13px]">
                              Unassigned
                            </span>
                          </>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-70 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search user..." />
                        <CommandList>
                          <CommandEmpty>No user found.</CommandEmpty>
                          <CommandGroup>
                            {selectableUsers
                              .filter((user) => user.id !== task.assignee?.id)
                              .map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={
                                    user.id === currentUserId
                                      ? `${user.name} (Assign to me)`
                                      : user.name
                                  }
                                  onSelect={() => {
                                    handleUpdate("assigneeId", user.id);
                                    setIsAssigneeOpen(false);
                                  }}
                                  className="gap-2 cursor-pointer"
                                >
                                  <DetailAvatar name={user.name} />
                                  {user.id === currentUserId
                                    ? `${user.name} (Assign to me)`
                                    : user.name}
                                </CommandItem>
                              ))}
                            <CommandItem
                              onSelect={() => {
                                handleUpdate("assigneeId", null);
                                setIsAssigneeOpen(false);
                              }}
                              className="text-muted-foreground cursor-pointer"
                            >
                              <UserIcon className="w-4 h-4 mr-2" />
                              Unassigned
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {currentUserId &&
                    (projectMemberIds.size === 0 ||
                      projectMemberIds.has(currentUserId)) &&
                    task.assignee?.id !== currentUserId && (
                      <button
                        className="text-[13px] text-primary hover:underline font-medium px-2 mt-0.5 transition-colors"
                        onClick={() =>
                          handleUpdate("assigneeId", currentUserId)
                        }
                      >
                        Assign to me
                      </button>
                    )}
                </div>
              </div>

              {/* PRIORITY */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Priority
                </span>
                <div className="-ml-2 w-[calc(100%+8px)]">
                  <Select
                    value={task.priority}
                    onValueChange={(val: "low" | "medium" | "high") =>
                      handleUpdate("priority", val)
                    }
                  >
                    <SelectTrigger className="w-full h-8 px-2 bg-transparent border-transparent hover:bg-muted/50 focus:ring-1 focus:ring-primary/50 text-[13px] font-medium shadow-none rounded transition-colors">
                      <SelectValue>
                        <div className="flex items-center gap-2 capitalize">
                          <PriorityIcon priority={task.priority} />{" "}
                          {task.priority}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <PriorityIcon priority="high" /> High
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <PriorityIcon priority="medium" /> Medium
                        </div>
                      </SelectItem>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <PriorityIcon priority="low" /> Low
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* LABELS */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Labels
                </span>
                <div className="-ml-2 w-[calc(100%+8px)]">
                  <Popover open={isLabelsOpen} onOpenChange={setIsLabelsOpen}>
                    <PopoverTrigger asChild>
                      <button className="w-full h-8 px-2 flex items-center justify-between bg-transparent hover:bg-muted/50 focus:ring-1 focus:ring-primary/50 text-[13px] font-medium rounded transition-colors text-left">
                        {task.labels && task.labels.length > 0 ? (
                          <span className="truncate">
                            {task.labels.join(", ")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Select labels...
                          </span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search labels..." />
                        <CommandList>
                          <CommandEmpty>No labels found.</CommandEmpty>
                          <CommandGroup>
                            {[
                              "Frontend",
                              "Backend",
                              "Bug",
                              "Feature",
                              "Design",
                            ].map((label) => (
                              <CommandItem
                                key={label}
                                onSelect={() => {
                                  const current = task.labels || [];
                                  const newLabels = current.includes(label)
                                    ? current.filter((l) => l !== label)
                                    : [...current, label];
                                  handleUpdate("labels", newLabels);
                                }}
                                className="cursor-pointer flex items-center gap-2"
                              >
                                <Tag className="w-3.5 h-3.5" />
                                {label}
                                {task.labels?.includes(label) && (
                                  <span className="ml-auto text-primary">
                                    ✓
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* DUE DATE */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Due date
                </span>
                <div className="-ml-2 w-[calc(100%+8px)] relative group flex items-center">
                  <input
                    type="date"
                    className="w-full h-8 pl-2 pr-14 bg-transparent hover:bg-muted/50 focus:bg-muted/50 focus:ring-1 focus:ring-primary/50 rounded outline-none text-foreground cursor-pointer text-[13px] font-medium transition-colors [color-scheme:light_dark] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-[calc(100%-28px)] [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    value={task.dueDate || ""}
                    onChange={(e) => handleUpdate("dueDate", e.target.value)}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    {task.dueDate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleUpdate("dueDate", "");
                        }}
                        className="pointer-events-auto flex items-center justify-center rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40 p-0.5 transition-colors cursor-pointer w-4 h-4"
                      >
                        <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* REPORTER */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Reporter
                </span>
                <div className="flex flex-col items-start gap-1 -ml-2 w-[calc(100%+8px)]">
                  <Popover
                    open={isReporterOpen}
                    onOpenChange={setIsReporterOpen}
                  >
                    <PopoverTrigger asChild>
                      <button className="w-full h-8 px-2 flex items-center gap-2 bg-transparent hover:bg-muted/50 focus:ring-1 focus:ring-primary/50 rounded cursor-pointer transition-colors outline-none text-left">
                        {reporterDisplay ? (
                          <>
                            <DetailAvatar name={reporterDisplay.name} />
                            <span className="text-foreground font-medium text-[13px] truncate">
                              {reporterDisplay.name}
                              {!task.reporter && (
                                <span className="text-muted-foreground font-normal ml-1">
                                  (you)
                                </span>
                              )}
                            </span>
                          </>
                        ) : null}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search reporter..." />
                        <CommandList>
                          <CommandEmpty>No user found.</CommandEmpty>
                          <CommandGroup>
                            {selectableUsers
                              .filter((user) => user.id !== task.reporter?.id)
                              .map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={user.name}
                                  onSelect={() => {
                                    handleUpdate("reporterId", user.id);
                                    setIsReporterOpen(false);
                                  }}
                                  className="gap-2 cursor-pointer"
                                >
                                  <DetailAvatar name={user.name} />
                                  {user.name}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
