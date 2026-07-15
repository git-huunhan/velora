import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  GitFork,
  Paperclip,
  FileText,
  X,
  Loader2,
  Plus,
  ClipboardList,
  MoreHorizontal,
  Search,
  Pencil,
  ArrowDown,
  Bug,
  CheckSquare,
  SquaresExclude,
  Globe,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

import type {
  KanbanColumn,
  Task,
  TaskFieldUpdater,
  TaskStatus,
  TaskUpdateData,
} from "../../../model/types";
import { TaskActivity } from "./TaskActivity";
import { TaskSidebar } from "./TaskSidebar";
import { TaskTitleEditor } from "./TaskTitleEditor";
import { LinkedWorkSection } from "./LinkedWorkSection";
import {
  useCreateTask,
  useTasksByProject,
  useUpdateTask,
} from "../../../model/useTasks";
import { useLogActivity } from "../../../model/useComments";
import { useProject } from "@/features/projects";
import { useUsers } from "@/features/users";
import {
  getUserAvatarUrl,
  getUserInitials,
} from "@/features/auth/model/userAvatar";
import { PriorityIcon } from "../../PriorityIcon";
import { TaskStatusSelect } from "../../shared/TaskStatusSelect";
import { isSubtask } from "../../../model/taskHierarchy";

interface TaskMainProps {
  task: Task;
  handleUpdate: TaskFieldUpdater;
  onOpenTask?: (task: Task) => void;
  className?: string;
  columns?: KanbanColumn[];
  canCreate?: boolean;
  canUpdate?: boolean;
}

export function TaskMain({
  task,
  handleUpdate,
  onOpenTask,
  className,
  columns,
  canCreate = true,
  canUpdate = true,
}: TaskMainProps) {
  const { data: tasks = [] } = useTasksByProject(task.projectId);
  const { data: project } = useProject(task.projectId);
  const { users } = useUsers();
  const projectMemberIdSet = new Set(project?.memberIds ?? []);
  const selectableUsers =
    projectMemberIdSet.size > 0
      ? users.filter((user) => projectMemberIdSet.has(user.id))
      : users;
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: logActivity } = useLogActivity(task.id);
  const isEpic = task.type === "epic";
  const taskIsSubtask = isSubtask(task, tasks);
  const canHaveChildren =
    isEpic || ((task.type === "task" || task.type === "bug") && !taskIsSubtask);
  const childSectionTitle = isEpic ? "Child work items" : "Subtasks";
  const createChildLabel = isEpic ? "Create child work item" : "Create subtask";
  const addChildLabel = isEpic ? "Add child work item" : "Add subtask";
  const childInputPlaceholder = isEpic
    ? "Name this child work item"
    : "Name this subtask";
  const childTypeLabel = isEpic ? "Task" : "Subtask";
  const subtasks = tasks.filter((t) => t.parentId === task.id);
  const doneSubtasks = subtasks.filter((t) => t.status === "done").length;
  const progress =
    subtasks.length === 0
      ? 0
      : Math.round((doneSubtasks / subtasks.length) * 100);
  const [editDesc, setEditDesc] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  // Subtask Edit State
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [openAssigneePopover, setOpenAssigneePopover] = useState<string | null>(
    null,
  );

  const [isDescOpen, setIsDescOpen] = useState(true);
  const [isAttachOpen, setIsAttachOpen] = useState(true);
  const [isSubtasksOpen, setIsSubtasksOpen] = useState(true);

  // Attachments
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<
    { id: string; name: string; size: string; type: string }[]
  >([]);
  const [attachmentTab, setAttachmentTab] = useState("all");

  // Subtask Form
  const [isSubtaskFormOpen, setIsSubtaskFormOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [childWorkType, setChildWorkType] = useState<"task" | "bug">("task");
  const { mutate: createSubtask, isPending: isCreatingSubtask } =
    useCreateTask();

  const guardedUpdateTask = (variables: {
    taskId: string;
    data: TaskUpdateData;
  }) => {
    if (!canUpdate) {
      toast.error("You do not have permission to update work items.");
      return;
    }
    updateTask(variables);
  };

  const guardedCreateSubtask: typeof createSubtask = (...args) => {
    if (!canCreate) {
      toast.error("You do not have permission to create work items.");
      return;
    }
    createSubtask(...args);
  };

  // Sync state when task opens/changes
  useEffect(() => {
    if (task) {
      setEditDesc(task.description || "");
      setIsSubtaskFormOpen(false);
      setChildWorkType("task");
    }
  }, [task]);

  return (
    <div
      className={
        className ||
        "w-2/3 shrink-0 flex flex-col overflow-hidden border-r border-border/40 bg-card"
      }
    >
      <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar min-h-0 pt-5">
        <div className="pb-12">
          <TaskTitleEditor
            title={task.title}
            onSave={(title) => handleUpdate("title", title)}
          />

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mb-8 -ml-1">
            <Popover
              open={isQuickActionsOpen && canCreate}
              onOpenChange={(open) => {
                if (open && !canCreate) {
                  toast.error(
                    "You do not have permission to create work items.",
                  );
                  return;
                }
                setIsQuickActionsOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-muted/20 border-border/60 hover:bg-muted/50 transition-colors shadow-sm text-muted-foreground"
                  title="Add or create related work"
                  disabled={!canCreate}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Find menu item" className="h-9" />
                  <CommandList>
                    <CommandEmpty>No action found.</CommandEmpty>
                    <CommandGroup>
                      {canHaveChildren && (
                        <CommandItem
                          onSelect={() => {
                            if (!canCreate) {
                              toast.error(
                                "You do not have permission to create work items.",
                              );
                              return;
                            }
                            setIsQuickActionsOpen(false);
                            setIsSubtaskFormOpen(true);
                            setTimeout(
                              () => subtaskInputRef.current?.focus(),
                              0,
                            );
                          }}
                          className="gap-2 cursor-pointer"
                        >
                          <GitFork className="w-4 h-4 text-muted-foreground" />
                          <span>{createChildLabel}</span>
                          <span className="ml-auto text-xs tracking-widest text-muted-foreground opacity-70">
                            ⇧ C
                          </span>
                        </CommandItem>
                      )}
                      <CommandItem
                        onSelect={() => setIsQuickActionsOpen(false)}
                        className="gap-2 cursor-pointer"
                      >
                        <CheckSquare className="w-4 h-4 text-muted-foreground" />
                        <span>Link work item</span>
                        <span className="ml-auto text-xs tracking-widest text-muted-foreground opacity-70">
                          ⇧ K
                        </span>
                      </CommandItem>
                    </CommandGroup>
                    <div className="h-px bg-border/50 my-1"></div>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setIsQuickActionsOpen(false);
                          setIsAttachOpen(true);
                          fileInputRef.current?.click();
                        }}
                        className="gap-2 cursor-pointer"
                      >
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <span>Add attachment</span>
                      </CommandItem>
                      <CommandItem
                        onSelect={() => setIsQuickActionsOpen(false)}
                        className="gap-2 cursor-pointer"
                      >
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span>Add web link</span>
                      </CommandItem>
                    </CommandGroup>
                    <div className="h-px bg-border/50 my-1"></div>
                    <CommandGroup
                      heading="Recommended for you"
                      className="text-muted-foreground font-semibold"
                    >
                      <CommandItem
                        onSelect={() => setIsQuickActionsOpen(false)}
                        className="gap-2 cursor-pointer justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-muted-foreground" />
                          <span>Video</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-500/15 text-purple-500 border border-purple-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                            ADD
                          </span>
                          <X
                            className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-muted/20 border-border/60 hover:bg-muted/50 transition-colors shadow-sm text-muted-foreground"
              title="More actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Status Dropdown (Merged View Only) */}
          <div className="flex items-center gap-2 mb-8 -ml-1 lg:hidden">
            <TaskStatusSelect
              value={task.status}
              onChange={(status: TaskStatus) => handleUpdate("status", status)}
              columns={columns}
            />
          </div>

          {/* Description */}
          <div className="mb-10">
            <div
              className={`flex items-center gap-2 w-fit transition-colors mb-3 group ${task.description?.trim() ? "cursor-pointer hover:bg-muted/40 p-1 -ml-1 rounded-md" : ""}`}
              onClick={() =>
                task.description?.trim() && setIsDescOpen(!isDescOpen)
              }
            >
              {task.description?.trim() && (
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${!isDescOpen ? "-rotate-90" : ""} group-hover:text-foreground`}
                />
              )}
              <h3 className="text-[15px] font-semibold text-foreground">
                Description
              </h3>
            </div>

            {isDescOpen && (
              <>
                <div className="flex flex-col gap-2">
                  <div
                    contentEditable={isEditingDesc}
                    suppressContentEditableWarning
                    className={`text-sm px-2 py-3 -ml-2 rounded-md cursor-text border whitespace-pre-wrap leading-normal outline-none min-h-15 transition-colors ${isEditingDesc ? "bg-background border-primary/50 ring-1 ring-primary/50 text-foreground shadow-sm min-h-30" : "text-foreground/80 hover:bg-muted/30 border-transparent hover:border-border/50"}`}
                    onClick={(e) => {
                      if (!isEditingDesc) {
                        setEditDesc(task.description || "");
                        setIsEditingDesc(true);
                        const target = e.currentTarget;
                        setTimeout(() => {
                          target.focus();
                          if (typeof window !== "undefined") {
                            const selection = window.getSelection();
                            const range = document.createRange();
                            range.selectNodeContents(target);
                            range.collapse(false);
                            selection?.removeAllRanges();
                            selection?.addRange(range);
                          }
                        }, 0);
                      }
                    }}
                    onInput={(e) => {
                      setEditDesc((e.target as HTMLDivElement).innerText || "");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setIsEditingDesc(false);
                        e.currentTarget.innerText = task.description || "";
                        setEditDesc(task.description || "");
                      }
                    }}
                  >
                    {task.description?.trim() ? (
                      task.description
                    ) : isEditingDesc ? (
                      ""
                    ) : (
                      <span
                        className="text-muted-foreground"
                        contentEditable={false}
                      >
                        Add a description...
                      </span>
                    )}
                  </div>
                  {isEditingDesc && (
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          setIsEditingDesc(false);
                          handleUpdate(
                            "description",
                            editDesc.trim() === "" ? "" : editDesc,
                          );
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          setIsEditingDesc(false);
                          setEditDesc(task.description || "");
                          // Revert DOM content
                          const div = e.currentTarget.parentElement
                            ?.previousElementSibling as HTMLDivElement;
                          if (div) div.innerText = task.description || "";
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Attachments */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <div
                className={`flex items-center gap-2 w-fit transition-colors group ${attachments.length > 0 ? "cursor-pointer hover:bg-muted/40 p-1 -ml-1 rounded-md" : ""}`}
                onClick={() =>
                  attachments.length > 0 && setIsAttachOpen(!isAttachOpen)
                }
              >
                {attachments.length > 0 && (
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${!isAttachOpen ? "-rotate-90" : ""} group-hover:text-foreground`}
                  />
                )}
                <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
                  Attachments
                  {attachments.length > 0 && (
                    <span className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-bold text-muted-foreground">
                      {attachments.length}
                    </span>
                  )}
                </h3>
              </div>

              {attachments.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex bg-muted/20 p-0.5 rounded-md border border-border/50 text-[13px] font-medium text-muted-foreground mr-2">
                    <button
                      className={`px-2.5 py-1 rounded-sm transition-colors ${attachmentTab === "all" ? "bg-primary/20 text-primary font-semibold" : "hover:text-foreground hover:bg-muted/50"}`}
                      onClick={() => setAttachmentTab("all")}
                    >
                      All
                    </button>
                    <button
                      className={`px-2.5 py-1 rounded-sm transition-colors ${attachmentTab === "images" ? "bg-primary/20 text-primary font-semibold" : "hover:text-foreground hover:bg-muted/50"}`}
                      onClick={() => setAttachmentTab("images")}
                    >
                      Images
                    </button>
                    <button
                      className={`px-2.5 py-1 rounded-sm transition-colors ${attachmentTab === "documents" ? "bg-primary/20 text-primary font-semibold" : "hover:text-foreground hover:bg-muted/50"}`}
                      onClick={() => setAttachmentTab("documents")}
                    >
                      Documents
                    </button>
                    <button
                      className={`px-2.5 py-1 rounded-sm transition-colors ${attachmentTab === "videos" ? "bg-primary/20 text-primary font-semibold" : "hover:text-foreground hover:bg-muted/50"}`}
                      onClick={() => setAttachmentTab("videos")}
                    >
                      Videos
                    </button>
                    <button
                      className={`px-2.5 py-1 rounded-sm transition-colors ${attachmentTab === "other" ? "bg-primary/20 text-primary font-semibold" : "hover:text-foreground hover:bg-muted/50"}`}
                      onClick={() => setAttachmentTab("other")}
                    >
                      Other
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {isAttachOpen && (
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const newFiles = Array.from(e.target.files).map((f) => ({
                        id: Math.random().toString(),
                        name: f.name,
                        size: (f.size / 1024).toFixed(0) + " KB",
                        type: f.type,
                      }));
                      setAttachments((prev) => [...prev, ...newFiles]);
                      logActivity({
                        field: "Attachment",
                        from: "",
                        to:
                          newFiles.length === 1
                            ? newFiles[0].name
                            : `${newFiles.length} files added`,
                      });
                    }
                  }}
                />

                {attachments.length > 0 ? (
                  <div className="border border-border/50 rounded-lg overflow-hidden text-[13px] bg-card">
                    <div className="grid grid-cols-[1fr_120px_80px_40px] bg-muted/10 font-medium text-muted-foreground p-2 border-b border-border/50 text-xs">
                      <div className="pl-2">Name</div>
                      <div className="flex items-center gap-1 cursor-pointer hover:text-foreground">
                        Date added <ArrowDown className="w-3 h-3" />
                      </div>
                      <div>Size</div>
                      <div></div>
                    </div>
                    {attachments.map((file) => (
                      <div
                        key={file.id}
                        className="grid grid-cols-[1fr_120px_80px_40px] p-2 items-center hover:bg-muted/20 transition-colors border-b last:border-b-0 border-border/50 group"
                      >
                        <div className="flex items-center gap-3 pl-2 overflow-hidden pr-2">
                          <div className="w-8 h-8 rounded bg-background border border-border/50 flex items-center justify-center shrink-0 shadow-sm">
                            {file.type.startsWith("image/") ? (
                              <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 rounded" />
                            ) : (
                              <FileText className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium text-foreground truncate hover:underline cursor-pointer">
                            {file.name}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          Jun 27, 2026
                        </div>
                        <div className="text-muted-foreground">{file.size}</div>
                        <div className="flex justify-center">
                          <button
                            className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors"
                            onClick={() => {
                              setAttachments((prev) =>
                                prev.filter((f) => f.id !== file.id),
                              );
                              logActivity({
                                field: "Attachment",
                                from: file.name,
                                to: "Removed",
                              });
                            }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="border border-dashed border-border/80 bg-muted/10 rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/30 hover:border-border transition-colors cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 group-hover:text-foreground transition-colors" />
                      <span className="text-sm font-medium">
                        Drop files to attach, or{" "}
                        <span className="text-primary hover:underline">
                          browse
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Child work items / Subtasks */}
          {canHaveChildren && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`flex items-center gap-2 w-fit transition-colors group ${subtasks.length > 0 ? "cursor-pointer hover:bg-muted/40 p-1 -ml-1 rounded-md" : ""}`}
                  onClick={() =>
                    subtasks.length > 0 && setIsSubtasksOpen(!isSubtasksOpen)
                  }
                >
                  {subtasks.length > 0 && (
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform ${!isSubtasksOpen ? "-rotate-90" : ""} group-hover:text-foreground`}
                    />
                  )}
                  <h3 className="text-[15px] font-semibold text-foreground">
                    {childSectionTitle}
                  </h3>
                </div>
                {subtasks.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setIsSubtaskFormOpen(true);
                        setTimeout(() => subtaskInputRef.current?.focus(), 0);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {subtasks.length > 0 && isSubtasksOpen && (
                <>
                  <div className="flex items-center justify-end text-xs text-muted-foreground mb-1 font-medium">
                    {progress}% Done
                  </div>
                  <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full mb-4 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <div className="border border-border/50 rounded-lg overflow-hidden text-[13px] bg-card">
                    <div className="grid grid-cols-[1fr_120px_140px_128px] bg-muted/10 font-medium text-muted-foreground p-2 border-b border-border/50 text-xs">
                      <div className="pl-2">Work</div>
                      <div>Priority</div>
                      <div>Assignee</div>
                      <div>Status</div>
                    </div>

                    {subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="grid grid-cols-[1fr_120px_140px_128px] p-2 items-center hover:bg-muted/20 transition-colors border-b last:border-b-0 border-border/50 group"
                      >
                        <div className="flex items-center gap-2 pl-2 overflow-hidden pr-2">
                          {isEpic ? (
                            <ClipboardList className="w-4 h-4 text-primary shrink-0" />
                          ) : (
                            <SquaresExclude className="w-4 h-4 text-cyan-500 shrink-0" />
                          )}
                          <span
                            className={`font-semibold text-primary hover:underline cursor-pointer shrink-0 ${st.status === "done" ? "line-through opacity-70" : ""}`}
                            onClick={() => onOpenTask?.(st)}
                          >
                            {st.code}
                          </span>
                          {editingSubtaskId === st.id ? (
                            <input
                              autoFocus
                              value={editingSubtaskTitle}
                              onChange={(e) =>
                                setEditingSubtaskTitle(e.target.value)
                              }
                              onBlur={() => {
                                if (
                                  editingSubtaskTitle.trim() &&
                                  editingSubtaskTitle !== st.title
                                ) {
                                  guardedUpdateTask({
                                    taskId: st.id,
                                    data: { title: editingSubtaskTitle.trim() },
                                  });
                                }
                                setEditingSubtaskId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur();
                                if (e.key === "Escape")
                                  setEditingSubtaskId(null);
                              }}
                              className="w-full h-[26px] px-1.5 bg-background border-2 border-primary rounded text-foreground focus:outline-none text-[13px]"
                            />
                          ) : (
                            <div
                              className="flex items-center flex-1 h-[26px] min-w-0 cursor-text border border-transparent hover:border-border hover:bg-muted/30 rounded px-1.5 transition-colors group/edit"
                              onClick={() => {
                                setEditingSubtaskTitle(st.title);
                                setEditingSubtaskId(st.id);
                              }}
                            >
                              <span
                                className={`truncate flex-1 ${st.status === "done" ? "line-through opacity-70" : ""}`}
                              >
                                {st.title}
                              </span>
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover/edit:opacity-100 ml-2 shrink-0 transition-opacity" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground capitalize">
                          <PriorityIcon priority={st.priority} />
                          {st.priority}
                        </div>
                        <div className="flex items-center min-w-0 pr-2">
                          <Popover
                            open={openAssigneePopover === st.id}
                            onOpenChange={(o) =>
                              setOpenAssigneePopover(o ? st.id : null)
                            }
                          >
                            <PopoverTrigger asChild>
                              <button className="flex items-center gap-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground px-1.5 py-1 rounded border border-transparent hover:border-border/50 transition-colors w-full text-left min-w-0">
                                {st.assignee ? (
                                  <>
                                    <Avatar className="w-5 h-5 border border-border/50 shrink-0">
                                      <AvatarImage
                                        src={getUserAvatarUrl(st.assignee)}
                                      />
                                      <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
                                        {getUserInitials(st.assignee.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">
                                      {st.assignee.name}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className="h-5 w-5 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center bg-muted/20 shrink-0">
                                      <svg
                                        className="w-3 h-3 text-muted-foreground/60"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                      </svg>
                                    </div>
                                    <span className="truncate">Unassigned</span>
                                  </>
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-52 p-0" align="start">
                              <Command>
                                <CommandInput
                                  placeholder="Search assignee..."
                                  className="h-9"
                                />
                                <CommandList>
                                  <CommandEmpty>No user found.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      onSelect={() => {
                                        guardedUpdateTask({
                                          taskId: st.id,
                                          data: { assigneeId: null },
                                        });
                                        setOpenAssigneePopover(null);
                                      }}
                                      className="gap-2 cursor-pointer"
                                    >
                                      <div className="h-6 w-6 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center bg-muted/20 shrink-0">
                                        <svg
                                          className="w-3 h-3 text-muted-foreground/60"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                          />
                                        </svg>
                                      </div>
                                      Unassigned
                                    </CommandItem>
                                    {selectableUsers.map((user) => (
                                      <CommandItem
                                        key={user.id}
                                        onSelect={() => {
                                          guardedUpdateTask({
                                            taskId: st.id,
                                            data: { assigneeId: user.id },
                                          });
                                          setOpenAssigneePopover(null);
                                        }}
                                        className="gap-2 cursor-pointer"
                                      >
                                        <Avatar className="h-6 w-6 border border-border/50 shrink-0">
                                          <AvatarImage
                                            src={getUserAvatarUrl(user)}
                                          />
                                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                            {getUserInitials(user.name)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate">
                                          {user.name}
                                        </span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <TaskStatusSelect
                            value={st.status}
                            onChange={(status: TaskStatus) => {
                              guardedUpdateTask({
                                taskId: st.id,
                                data: { status },
                              });
                            }}
                            columns={columns}
                            className="h-7 w-[118px] px-2 text-[10px] uppercase justify-between"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Empty Subtasks Placeholder */}
              {subtasks.length === 0 && !isSubtaskFormOpen && (
                <div
                  className="text-[13px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors w-fit"
                  onClick={() => {
                    setIsSubtaskFormOpen(true);
                    setTimeout(() => subtaskInputRef.current?.focus(), 0);
                  }}
                >
                  {addChildLabel}
                </div>
              )}

              {isSubtaskFormOpen && (
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex items-center border border-primary/60 ring-1 ring-primary/20 rounded-md bg-background px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
                    <input
                      placeholder={childInputPlaceholder}
                      className="flex-1 bg-transparent outline-none text-[13px] h-6 text-foreground placeholder:text-muted-foreground"
                      value={subtaskTitle}
                      onChange={(e) => setSubtaskTitle(e.target.value)}
                      ref={subtaskInputRef}
                      autoFocus={false}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          subtaskTitle.trim() &&
                          !isCreatingSubtask
                        ) {
                          guardedCreateSubtask(
                            {
                              title: subtaskTitle.trim(),
                              projectId: task.projectId,
                              type: isEpic ? childWorkType : "subtask",
                              status: task.status,
                              priority: "medium",
                              parentId: task.id,
                            },
                            {
                              onSuccess: () => {
                                setSubtaskTitle("");
                              },
                            },
                          );
                        }
                      }}
                    />
                    <div className="flex items-center gap-2">
                      {isEpic ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                              {childWorkType === "bug" ? (
                                <Bug className="w-3.5 h-3.5 text-red-500" />
                              ) : (
                                <ClipboardList className="w-3.5 h-3.5" />
                              )}
                              {childWorkType === "bug" ? "Bug" : "Task"}
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-36 p-1" align="end">
                            <button
                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted"
                              onClick={() => setChildWorkType("task")}
                            >
                              <ClipboardList className="w-3.5 h-3.5 text-primary" />
                              Task
                            </button>
                            <button
                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted"
                              onClick={() => setChildWorkType("bug")}
                            >
                              <Bug className="w-3.5 h-3.5 text-red-500" />
                              Bug
                            </button>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded text-xs font-medium text-muted-foreground">
                          <SquaresExclude className="w-3.5 h-3.5" />
                          {childTypeLabel}
                        </div>
                      )}
                      <button
                        className={`p-1 rounded transition-colors cursor-pointer disabled:cursor-not-allowed ${subtaskTitle.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                        disabled={!subtaskTitle.trim() || isCreatingSubtask}
                        onClick={() => {
                          if (subtaskTitle.trim() && !isCreatingSubtask) {
                            guardedCreateSubtask(
                              {
                                title: subtaskTitle.trim(),
                                projectId: task.projectId,
                                type: isEpic ? childWorkType : "subtask",
                                status: task.status,
                                priority: "medium",
                                parentId: task.id,
                              },
                              {
                                onSuccess: () => {
                                  setSubtaskTitle("");
                                },
                              },
                            );
                          }
                        }}
                      >
                        {isCreatingSubtask ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="9 10 4 15 9 20"></polyline>
                            <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 px-1">
                    <button className="flex items-center gap-1.5 text-[13px] text-primary hover:underline font-medium transition-colors">
                      <Search className="w-3.5 h-3.5" /> Choose existing
                    </button>
                    <button
                      className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => {
                        setSubtaskTitle("");
                        setIsSubtaskFormOpen(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <LinkedWorkSection />

          {/* Mobile Sidebar Content */}
          <div className="block lg:hidden mb-10">
            <TaskSidebar
              task={task}
              handleUpdate={handleUpdate}
              onOpenTask={onOpenTask}
              hideStatusDropdown={true}
              className="w-full flex flex-col bg-transparent shadow-none"
            />
          </div>

          {/* Activity Section */}
          <TaskActivity
            task={task}
            taskId={task.id}
            columns={columns}
            tasks={tasks}
            canComment={canUpdate}
          />
        </div>
      </div>
    </div>
  );
}
