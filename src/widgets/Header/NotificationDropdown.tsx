import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Bug,
  Check,
  Circle,
  ClipboardList,
  Crown,
  ExternalLink,
  FolderKanban,
  MessageSquareText,
  MoreVertical,
  SquaresExclude,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  getUserAvatarUrl,
  getUserInitials,
} from "@/features/auth/model/userAvatar";
import {
  type NotificationItem,
  type NotificationType,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/features/notifications";

const notificationIconByType: Record<NotificationType, typeof ClipboardList> = {
  project_member_added: UserPlus,
  task_assigned: ClipboardList,
  task_commented: MessageSquareText,
  task_status_changed: FolderKanban,
  task_child_created: SquaresExclude,
  task_unassigned: ClipboardList,
};

function getRelativeTime(value: string) {
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

function getNotificationTarget(notification: NotificationItem) {
  if (!notification.project?.id) return null;
  const basePath = `/projects/${notification.project.id}`;
  if (!notification.task?.id) return basePath;

  return `${basePath}?task=${encodeURIComponent(notification.task.id)}`;
}
function getMetadataText(
  metadata: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getTaskTypeIcon(task: NotificationItem["task"]) {
  switch (task?.type) {
    case "bug":
      return <Bug className="size-3.5 shrink-0 text-red-500" />;
    case "epic":
      return <Crown className="size-3.5 shrink-0 text-purple-500" />;
    case "subtask":
      return <SquaresExclude className="size-3.5 shrink-0 text-cyan-500" />;
    default:
      return <ClipboardList className="size-3.5 shrink-0 text-primary" />;
  }
}

function getNotificationColumnName(notification: NotificationItem) {
  return (
    getMetadataText(notification.metadata, "toColumnName") ??
    getMetadataText(notification.metadata, "columnName") ??
    notification.task?.columnName?.trim() ??
    null
  );
}

function getNotificationFromColumnName(notification: NotificationItem) {
  return getMetadataText(notification.metadata, "fromColumnName");
}

function getNotificationHeadline(
  notification: NotificationItem,
  actorName: string,
) {
  const projectName = notification.project?.name;

  switch (notification.type) {
    case "project_member_added":
      return projectName
        ? `${actorName} added you to ${projectName}`
        : `${actorName} added you to a project`;
    case "task_assigned":
      return `${actorName} assigned you to a task`;
    case "task_unassigned": {
      const assigneeName = getMetadataText(
        notification.metadata,
        "assigneeName",
      );
      return assigneeName
        ? `${actorName} assigned this task to ${assigneeName}`
        : `${actorName} unassigned this task`;
    }
    case "task_commented":
      return `${actorName} commented on a task`;
    case "task_child_created":
      return `${actorName} created a subtask`;
    case "task_status_changed": {
      const fromColumnName = getNotificationFromColumnName(notification);
      const toColumnName = getNotificationColumnName(notification);
      if (fromColumnName && toColumnName) {
        return `${actorName} changed a task from ${fromColumnName} to ${toColumnName}`;
      }
      if (toColumnName) {
        return `${actorName} moved a task to ${toColumnName}`;
      }
      return `${actorName} moved a task`;
    }
    default:
      return `${actorName} ${notification.title}`;
  }
}
function NotificationRow({
  notification,
  onOpen,
}: {
  notification: NotificationItem;
  onOpen: (notification: NotificationItem) => void;
}) {
  const Icon = notificationIconByType[notification.type];
  const unread = !notification.readAt;
  const actorName = notification.actor?.name ?? "Velora";
  const headline = getNotificationHeadline(notification, actorName);
  const taskColumnName = getNotificationColumnName(notification);

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className="group flex w-full cursor-pointer gap-3 px-6 py-4 text-left transition-colors hover:bg-muted/35"
    >
      <Avatar className="mt-0.5 h-10 w-10 border border-border/50 shadow-sm">
        <AvatarImage
          src={notification.actor ? getUserAvatarUrl(notification.actor) : ""}
        />
        <AvatarFallback
          className={
            notification.actor
              ? "bg-primary/10 text-xs font-semibold text-primary"
              : "bg-muted text-muted-foreground"
          }
        >
          {notification.actor ? (
            getUserInitials(notification.actor.name)
          ) : (
            <Icon className="size-4" />
          )}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex min-w-0 items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm leading-snug">
              <span className="min-w-0 font-medium text-foreground">
                {headline}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {getRelativeTime(notification.createdAt)}
              </span>
            </div>
            {notification.task ? (
              <div className="mt-1 space-y-0.5">
                <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-foreground/80">
                  {getTaskTypeIcon(notification.task)}
                  <span className="truncate group-hover:underline group-hover:underline-offset-2">
                    {notification.task.title}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="shrink-0 font-medium">
                    {notification.task.code}
                  </span>
                  {taskColumnName ? (
                    <>
                      <span aria-hidden="true">•</span>
                      <span className="truncate">{taskColumnName}</span>
                    </>
                  ) : null}
                </div>
              </div>
            ) : notification.project?.name ? (
              <div className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                {notification.project.name}
              </div>
            ) : null}
          </div>
          {unread ? (
            <Circle className="mt-1.5 size-2 shrink-0 fill-primary text-primary" />
          ) : null}
        </div>

        {notification.type === "project_member_added" &&
        notification.message ? (
          <div className="rounded-sm border border-border/70 bg-background/80 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
            {notification.message}
          </div>
        ) : null}
      </div>
    </button>
  );
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [activeTab, setActiveTab] = useState<"direct" | "watching">("direct");
  const navigate = useNavigate();
  const notificationsQuery = useNotifications(
    1,
    20,
    onlyUnread ? true : undefined,
  );
  const unreadCountQuery = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notificationsQuery.data?.data ?? [];
  const unreadCount = unreadCountQuery.data ?? 0;
  const isLoading = notificationsQuery.isLoading || unreadCountQuery.isLoading;
  const visibleNotifications = notifications.filter(() => {
    if (activeTab === "watching") return false;
    return true;
  });

  const handleOpenNotification = (notification: NotificationItem) => {
    if (!notification.readAt) {
      markRead.mutate(notification.id, {
        onError: () => toast.error("Failed to mark notification as read"),
      });
    }

    const target = getNotificationTarget(notification);
    if (target) {
      navigate(target);
      setOpen(false);
    }
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onError: () => toast.error("Failed to mark notifications as read"),
    });
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setMoreOpen(false);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 overflow-visible rounded-full"
          onClick={(event) => {
            if (!moreOpen) return;
            event.preventDefault();
            event.stopPropagation();
            setMoreOpen(false);
          }}
        >
          <Bell
            className={`size-5 ${open ? "text-primary" : "text-muted-foreground"}`}
          />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[560px] overflow-hidden p-0 shadow-xl"
      >
        <div className="border-b border-border/70 px-6 pb-0 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Notifications
              </h2>
              {unreadCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-xs text-primary hover:bg-primary/20"
                >
                  {unreadCount} new
                </Badge>
              ) : null}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <label className="flex items-center gap-2 whitespace-nowrap">
                <span>Only show unread</span>
                <Switch checked={onlyUnread} onCheckedChange={setOnlyUnread} />
              </label>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                title="Open notifications"
              >
                <ExternalLink className="size-4" />
              </Button>
              <DropdownMenu
                modal={false}
                open={moreOpen}
                onOpenChange={setMoreOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    title="More notification actions"
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-44"
                  onCloseAutoFocus={(event) => event.preventDefault()}
                >
                  <DropdownMenuItem
                    disabled={unreadCount === 0 || markAllRead.isPending}
                    onClick={handleMarkAllRead}
                  >
                    <Check className="mr-2 size-4" />
                    Mark all read
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-5 flex items-end gap-5">
            <button
              type="button"
              onClick={() => setActiveTab("direct")}
              className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                activeTab === "direct"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Direct
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("watching")}
              className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                activeTab === "watching"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Watching
            </button>
          </div>
        </div>

        <ScrollArea className="h-[min(680px,calc(100vh-150px))]">
          {isLoading ? (
            <div className="space-y-5 p-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-56 animate-pulse rounded bg-muted" />
                    <div className="h-16 w-full animate-pulse rounded bg-muted" />
                    <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : notificationsQuery.isError ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Could not load notifications.
            </div>
          ) : visibleNotifications.length > 0 ? (
            <div>
              <div className="px-6 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Latest
              </div>
              <div className="divide-y divide-border/70">
                {visibleNotifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onOpen={handleOpenNotification}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {activeTab === "watching"
                ? "Watching notifications will appear here."
                : onlyUnread
                  ? "No unread notifications."
                  : "No notifications yet."}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
