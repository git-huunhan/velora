import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Loader2,
  MessageSquare,
  Pencil,
  Trash2,
  ArrowDownWideNarrow,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import type {
  ActivityEntry,
  Comment,
  KanbanColumn,
  Task,
} from "../../../model/types";
import { getTaskStatusLabel } from "../../shared/taskStatus";
import {
  useActivity,
  useComments,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from "../../../model/useComments";
import { useAuth } from "@/features/auth/model/useAuth";
import { useUsers } from "@/features/users";
import {
  getUserAvatarUrl,
  getUserInitials,
} from "@/features/auth/model/userAvatar";

function ActivityAvatar({ name }: { name: string }) {
  return (
    <Avatar className="w-8 h-8 shrink-0 ring-4 ring-background relative z-10 bg-background">
      <AvatarImage src={getUserAvatarUrl({ name })} />
      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
        {getUserInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
// ─── Sub-components ────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  taskId,
  isAllTab,
  currentUserId,
}: {
  comment: Comment;
  taskId: string;
  isAllTab?: boolean;
  currentUserId?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { mutate: updateComment, isPending: isUpdating } =
    useUpdateComment(taskId);
  const { mutate: deleteComment, isPending: isDeleting } =
    useDeleteComment(taskId);

  const isOwn = comment.authorId === currentUserId;

  const handleSaveEdit = () => {
    if (!editBody.trim() || editBody === comment.body) {
      setIsEditing(false);
      setEditBody(comment.body);
      return;
    }
    updateComment(
      { commentId: comment.id, body: editBody.trim() },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditBody(comment.body);
  };

  return (
    <div className="flex gap-4 group/comment relative">
      <ActivityAvatar name={comment.author.name} />

      <div className="flex-1 min-w-0">
        <div className="bg-card border border-border/60 shadow-sm rounded-xl overflow-hidden transition-colors hover:border-border/80">
          <div className="px-4 py-3 flex items-start justify-between gap-4 bg-muted/30 border-b border-border/40">
            <div>
              <p className="text-[13px] leading-snug">
                <span className="font-semibold text-foreground hover:underline cursor-pointer">
                  {comment.author.name}
                </span>
                {isAllTab && (
                  <span className="text-muted-foreground ml-1.5 font-normal">
                    added a comment
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-muted-foreground/80">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {comment.isEdited && (
                  <span className="text-[11px] text-muted-foreground/50 italic">
                    • edited
                  </span>
                )}
              </div>
            </div>

            {isAllTab && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border border-border/40 text-muted-foreground text-[9px] font-bold uppercase tracking-widest bg-background/50 shadow-sm">
                Comment
              </span>
            )}
          </div>

          <div className="px-4 py-3 group-hover/comment:bg-muted/10 transition-colors">
            {isEditing ? (
              <div className="border border-primary/40 rounded-xl overflow-hidden ring-1 ring-primary/20 shadow-sm">
                <Textarea
                  className="border-0 focus-visible:ring-0 min-h-[70px] resize-none bg-background text-sm p-3"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") handleCancelEdit();
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                      handleSaveEdit();
                  }}
                  autoFocus
                />
                <div className="bg-muted/40 px-3 py-2 flex items-center gap-2 border-t border-border/50">
                  <span className="text-[11px] text-muted-foreground">
                    <kbd className="border border-border/60 bg-background/50 px-1.5 py-0.5 rounded shadow-sm mx-0.5">
                      Esc
                    </kbd>{" "}
                    to cancel
                  </span>
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs font-semibold px-4"
                    onClick={handleSaveEdit}
                    disabled={!editBody.trim() || isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {comment.body}
              </p>
            )}

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-3 mt-3 text-xs font-medium text-muted-foreground opacity-0 group-hover/comment:opacity-100 transition-opacity">
                {isOwn && !confirmDelete && (
                  <>
                    <button
                      className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors"
                      onClick={() => {
                        setIsEditing(true);
                        setEditBody(comment.body);
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      className="flex items-center gap-1 hover:text-destructive cursor-pointer transition-colors"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </>
                )}
                {confirmDelete && (
                  <span className="flex items-center gap-2 text-destructive opacity-100">
                    Delete this comment?
                    <button
                      className="text-destructive underline font-semibold hover:text-destructive/80"
                      onClick={() => {
                        deleteComment(comment.id, {
                          onSuccess: () => setConfirmDelete(false),
                        });
                      }}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting…" : "Yes"}
                    </button>
                    <button
                      className="text-muted-foreground hover:text-foreground underline"
                      onClick={() => setConfirmDelete(false)}
                    >
                      No
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function titleCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function parseLabelList(value: string) {
  if (!value || value === "[]") return "None";
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.length > 0 ? parsed.join(", ") : "None";
    }
  } catch {
    // Fall through to plain text formatting.
  }
  return value;
}

function formatDateValue(value: string) {
  if (!value) return "None";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatActivityField(field: string) {
  const labels: Record<string, string> = {
    assigneeId: "assignee",
    columnId: "status",
    dueDate: "due date",
    parentId: "parent",
    rank: "position",
  };
  return labels[field] ?? titleCase(field).toLowerCase();
}

type ActivityUser = { id: string; name: string; avatarUrl?: string | null };

function formatParentValue(value: string, tasks: Task[] = []) {
  if (!value) return "None";
  const parent = tasks.find((task) => task.id === value);
  return parent ? `${parent.code} ${parent.title}` : "Unknown parent";
}

function findActivityUser(
  value: string,
  users: ActivityUser[] = [],
  tasks: Task[] = [],
) {
  const user = users.find((candidate) => candidate.id === value);
  if (user) return user;
  return tasks
    .flatMap((task) => [task.assignee, task.reporter])
    .find((candidate) => candidate?.id === value);
}

function formatActivityValue(
  entry: ActivityEntry,
  value: string,
  columns: KanbanColumn[] = [],
  tasks: Task[] = [],
  users: ActivityUser[] = [],
) {
  if (entry.field === "assigneeId" || entry.field === "reporterId") {
    if (!value) return "Unassigned";
    const snapshotUser =
      value === entry.from
        ? entry.fromUser
        : value === entry.to
          ? entry.toUser
          : undefined;
    const user = snapshotUser ?? findActivityUser(value, users, tasks);
    return user?.name ?? "Unknown user";
  }
  if (!value) return "None";
  if (entry.field === "labels") return parseLabelList(value);
  if (entry.field === "columnId") return getTaskStatusLabel(value, columns);
  if (entry.field === "parentId") return formatParentValue(value, tasks);
  if (entry.field === "dueDate") return formatDateValue(value);
  if (entry.field === "commented" && isUuidLike(value)) return "Comment added";
  if (entry.field.endsWith("Id") && isUuidLike(value)) return "Updated";
  if (entry.field === "rank") return "Updated";
  return value || "None";
}
// ─── Status color map for history badges ──────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  "To Do":
    "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  "In Progress":
    "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  Review:
    "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
  Done: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
};

function FieldChip({
  value,
  avatar,
  isOld,
  isNew,
}: {
  value: string;
  avatar?: string;
  isOld?: boolean;
  isNew?: boolean;
}) {
  const baseClass = isOld
    ? "opacity-60 grayscale line-through decoration-muted-foreground/50"
    : "";

  if (avatar) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${baseClass}`}>
        <img
          src={avatar}
          alt={value}
          className="w-5 h-5 rounded-full border border-border/50 shrink-0"
        />
        <span
          className={`text-[13px] font-medium ${isOld ? "text-muted-foreground" : "text-foreground"}`}
        >
          {value}
        </span>
      </span>
    );
  }

  const statusClass = STATUS_BADGE[value];
  if (statusClass) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wide transition-opacity ${statusClass} ${baseClass}`}
      >
        {value}
      </span>
    );
  }

  if (isOld) {
    return (
      <span className="text-[13px] font-medium text-muted-foreground line-through decoration-muted-foreground/40 px-1.5 py-0.5 bg-muted/40 rounded">
        {value || "None"}
      </span>
    );
  }

  if (isNew) {
    return (
      <span className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
        {value}
      </span>
    );
  }

  return (
    <span className="text-[13px] font-medium text-foreground">
      {value || "None"}
    </span>
  );
}

function ActivityItem({
  entry,
  isAllTab,
  columns = [],
  tasks = [],
  users = [],
}: {
  entry: ActivityEntry;
  isAllTab?: boolean;
  columns?: KanbanColumn[];
  tasks?: Task[];
  users?: ActivityUser[];
}) {
  const isComment = entry.field === "comment" || entry.field === "commented";
  const isCreated = entry.field === "created";
  const fromUser =
    entry.field === "assigneeId" || entry.field === "reporterId"
      ? (entry.fromUser ?? findActivityUser(entry.from || "", users, tasks))
      : undefined;
  const toUser =
    entry.field === "assigneeId" || entry.field === "reporterId"
      ? (entry.toUser ?? findActivityUser(entry.to || "", users, tasks))
      : undefined;
  const actionLabel = isComment
    ? "added a comment"
    : isCreated
      ? "created the Work item"
      : `changed`;
  const fieldLabel = formatActivityField(entry.field);
  const fromValue = formatActivityValue(
    entry,
    entry.from || "",
    columns,
    tasks,
    users,
  );
  const toValue = formatActivityValue(
    entry,
    entry.to || "",
    columns,
    tasks,
    users,
  );

  return (
    <div className="flex gap-4 relative group/activity">
      <ActivityAvatar name={entry.actor.name} />

      <div className="flex-1 min-w-0 pt-1 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            {/* Header line */}
            <p className="text-[13px] leading-snug">
              <span className="font-semibold text-foreground hover:underline cursor-pointer">
                {entry.actor.name}
              </span>{" "}
              <span className="text-muted-foreground font-normal ml-1">
                {actionLabel}
              </span>
              {!isComment && !isCreated && (
                <span className="font-semibold text-foreground capitalize ml-1">
                  {fieldLabel}
                </span>
              )}
            </p>

            {/* Timestamp */}
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              {formatDistanceToNow(new Date(entry.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>

          {isAllTab && (
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border border-border/40 text-muted-foreground text-[9px] font-bold uppercase tracking-widest bg-background/50 shadow-sm">
              History
            </span>
          )}
        </div>

        {/* From → To */}
        {isCreated ? null : isComment ? (
          <p className="text-[13px] text-muted-foreground italic line-clamp-2 mt-2">
            &ldquo;{toValue}&rdquo;
          </p>
        ) : (
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <FieldChip
              value={fromValue}
              avatar={
                entry.fromAvatar ??
                (fromUser ? getUserAvatarUrl(fromUser) : undefined)
              }
              isOld
            />
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 mx-0.5 shrink-0" />
            <FieldChip
              value={toValue}
              avatar={
                entry.toAvatar ??
                (toUser ? getUserAvatarUrl(toUser) : undefined)
              }
              isNew
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type Tab = "all" | "comments" | "history" | "worklog";

interface TaskActivityProps {
  task: Task;
  taskId: string;
  columns?: KanbanColumn[];
  tasks?: Task[];
}

export function TaskActivity({
  task,
  taskId,
  columns = [],
  tasks = [],
}: TaskActivityProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("comments");
  const [isAscending, setIsAscending] = useState(false);
  const [comment, setComment] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { user } = useAuth();
  const { users } = useUsers();
  const currentUser = useMemo(
    () => ({
      avatarUrl: getUserAvatarUrl(user),
      id: user?.id ?? "",
      initials: getUserInitials(user?.name),
      name: user?.name ?? "Current user",
    }),
    [user],
  );

  const { comments: rawComments, isLoading: loadingComments } =
    useComments(taskId);
  const { activity: rawEntries, isLoading: loadingActivity } =
    useActivity(taskId);
  const { mutate: postComment, isPending: isPosting } =
    useCreateComment(taskId);

  const sortByCreatedAt = <Item extends { createdAt: string }>(items: Item[]) =>
    [...items].sort((a, b) => {
      const diff =
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return isAscending ? -diff : diff;
    });

  const comments = sortByCreatedAt(rawComments);
  const entriesWithCreated = useMemo(() => {
    if (rawEntries.some((entry) => entry.field === "created")) {
      return rawEntries;
    }

    const actor = task.reporter ?? {
      avatarUrl: "",
      id: task.reporterId ?? "system",
      name: "Unknown user",
    };

    const createdEntry: ActivityEntry = {
      actor,
      actorId: actor.id,
      createdAt: task.createdAt,
      field: "created",
      from: "",
      id: `created-${task.id}`,
      taskId: task.id,
      to: task.code || task.title,
    };

    return [...rawEntries, createdEntry];
  }, [rawEntries, task]);

  const entries = sortByCreatedAt(entriesWithCreated).filter(
    (entry) => entry.field !== "rank",
  );

  const handleSubmit = () => {
    const body = comment.trim();
    if (!body) return;
    postComment(body, { onSuccess: () => setComment("") });
  };

  const allItems = [
    ...comments.map((c) => ({ type: "comment" as const, item: c })),
    ...entries
      .filter((e) => e.field !== "comment" && e.field !== "commented")
      .map((e) => ({ type: "activity" as const, item: e })),
  ].sort((a, b) => {
    const diff =
      new Date(b.item.createdAt).getTime() -
      new Date(a.item.createdAt).getTime();
    return isAscending ? -diff : diff;
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "comments", label: "Comments" },
    { id: "history", label: "History" },
    { id: "worklog", label: "Work log" },
  ];

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 -ml-1 rounded-md w-fit transition-colors group"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${!isOpen ? "-rotate-90" : ""} group-hover:text-foreground`}
          />
          <h3 className="text-[15px] font-semibold text-foreground">
            Activity
          </h3>
        </div>
      </div>

      {isOpen && (
        <>
          {/* Tabs and Sort */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex bg-muted/20 p-0.5 rounded-md border border-border/50 text-[13px] font-medium text-muted-foreground">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-sm transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary/20 text-primary font-semibold"
                      : "hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              title="Reverse sort direction"
              onClick={() => setIsAscending(!isAscending)}
              className={`h-8 w-8 text-muted-foreground transition-colors border ${
                isAscending
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : "bg-muted/20 border-border/50 hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <ArrowDownWideNarrow
                className={`w-4 h-4 transition-transform ${isAscending ? "rotate-180" : ""}`}
              />
            </Button>
          </div>

          {/* Comment input — visible on All and Comments tabs */}
          {(activeTab === "all" || activeTab === "comments") && (
            <div className="flex gap-4 mb-8">
              <ActivityAvatar name={currentUser.name} />

              <div className="flex-1 border border-border/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-sm">
                <Textarea
                  ref={textareaRef}
                  placeholder="Add a comment..."
                  className="border-0 focus-visible:ring-0 min-h-[70px] resize-none bg-card text-sm p-3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                      handleSubmit();
                  }}
                />
                <div className="bg-muted/40 px-3 py-2.5 flex items-center gap-2 border-t border-border/50">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Pro tip: press{" "}
                    <kbd className="border border-border/60 bg-background/50 px-1.5 py-0.5 rounded shadow-sm mx-0.5">
                      ⌘ Enter
                    </kbd>{" "}
                    to comment
                  </span>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    className="h-7 text-xs font-semibold px-4"
                    disabled={!comment.trim() || isPosting}
                    onClick={handleSubmit}
                  >
                    {isPosting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="relative flex flex-col gap-6 before:absolute before:inset-y-0 before:left-[15.5px] before:w-px before:bg-border/60 before:-z-10">
            {/* ALL TAB */}
            {activeTab === "all" &&
              (loadingComments || loadingActivity ? (
                <ActivitySkeleton />
              ) : allItems.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="w-8 h-8" />}
                  label="No activity yet"
                />
              ) : (
                allItems.map(({ type, item }) =>
                  type === "comment" ? (
                    <CommentItem
                      key={item.id}
                      comment={item as Comment}
                      taskId={taskId}
                      isAllTab
                      currentUserId={currentUser.id}
                    />
                  ) : (
                    <ActivityItem
                      key={item.id}
                      entry={item as ActivityEntry}
                      isAllTab
                      columns={columns}
                      tasks={tasks}
                      users={users}
                    />
                  ),
                )
              ))}

            {/* COMMENTS TAB */}
            {activeTab === "comments" &&
              (loadingComments ? (
                <ActivitySkeleton />
              ) : comments.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="w-8 h-8" />}
                  label="No comments yet. Be the first to comment!"
                />
              ) : (
                comments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    taskId={taskId}
                    currentUserId={currentUser.id}
                  />
                ))
              ))}

            {/* HISTORY TAB */}
            {activeTab === "history" &&
              (loadingActivity ? (
                <ActivitySkeleton />
              ) : entries.filter(
                  (e) => e.field !== "comment" && e.field !== "commented",
                ).length === 0 ? (
                <EmptyState
                  icon={<Clock className="w-8 h-8" />}
                  label="No history recorded yet"
                />
              ) : (
                entries
                  .filter(
                    (e) => e.field !== "comment" && e.field !== "commented",
                  )
                  .map((e) => (
                    <ActivityItem
                      key={e.id}
                      entry={e}
                      columns={columns}
                      tasks={tasks}
                    />
                  ))
              ))}

            {/* WORKLOG TAB */}
            {activeTab === "worklog" && (
              <EmptyState
                icon={<Clock className="w-8 h-8" />}
                label="No time logged yet"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground/50">
      {icon}
      <p className="text-sm font-medium text-center max-w-48">{label}</p>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="relative flex flex-col gap-6 before:absolute before:inset-y-0 before:left-[15.5px] before:w-px before:bg-border/60 before:-z-10">
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0 ring-4 ring-background relative z-10" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-full bg-muted animate-pulse rounded" />
            <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
