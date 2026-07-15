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
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useMemo, useState } from "react";
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
  getUserAvatarColor,
  getUserAvatarUrl,
  getUserInitials,
} from "@/features/auth/model/userAvatar";
import {
  type NotificationItem,
  type NotificationType,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationRealtime,
  useNotifications,
  useUnreadNotificationCount,
} from "@/features/notifications";

const notificationIconByType: Record<NotificationType, typeof ClipboardList> = {
  project_member_added: UserPlus,
  project_member_removed: UserMinus,
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

function getNotificationProjectName(notification: NotificationItem) {
  return (
    getMetadataText(notification.metadata, "projectName") ??
    notification.project?.name?.trim() ??
    null
  );
}

function getNotificationTaskTitle(notification: NotificationItem) {
  return (
    getMetadataText(notification.metadata, "taskTitle") ??
    notification.task?.title?.trim() ??
    null
  );
}

function getNotificationTaskCode(notification: NotificationItem) {
  return (
    getMetadataText(notification.metadata, "taskCode") ??
    notification.task?.code?.trim() ??
    null
  );
}

function getNotificationTaskType(notification: NotificationItem) {
  const metadataType = getMetadataText(notification.metadata, "taskType");
  if (
    metadataType === "bug" ||
    metadataType === "epic" ||
    metadataType === "subtask" ||
    metadataType === "task"
  ) {
    return metadataType;
  }
  return notification.task?.type ?? "task";
}

function getTaskTypeIcon(taskType: ReturnType<typeof getNotificationTaskType>) {
  switch (taskType) {
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
  const projectName = getNotificationProjectName(notification);

  switch (notification.type) {
    case "project_member_added":
      return projectName
        ? `${actorName} added you to ${projectName}`
        : `${actorName} added you to a project`;
    case "project_member_removed":
      return projectName
        ? `${actorName} removed you from ${projectName}`
        : `${actorName} removed you from a project`;
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
      return `${actorName} updated Velora`;
  }
}

type NotificationGroup = {
  key: string;
  latest: NotificationItem;
  updates: NotificationItem[];
};

function getNotificationGroupKey(notification: NotificationItem) {
  return notification.task?.id ?? notification.project?.id ?? notification.id;
}

function groupNotifications(notifications: NotificationItem[]) {
  const groups = new Map<string, NotificationGroup>();

  for (const notification of notifications) {
    const key = getNotificationGroupKey(notification);
    const group = groups.get(key);

    if (!group) {
      groups.set(key, { key, latest: notification, updates: [] });
      continue;
    }

    group.updates.push(notification);
  }

  return Array.from(groups.values());
}
export function NotificationRow({
  notification,
  onOpen,
  interactiveSurface = true,
}: {
  notification: NotificationItem;
  onOpen: (notification: NotificationItem) => void;
  interactiveSurface?: boolean;
}) {
  const Icon = notificationIconByType[notification.type];
  const unread = !notification.readAt;
  const actorName = notification.actor?.name ?? "Velora";
  const headline = getNotificationHeadline(notification, actorName);
  const taskColumnName = getNotificationColumnName(notification);
  const taskCode = getNotificationTaskCode(notification);
  const taskTitle = getNotificationTaskTitle(notification);
  const taskType = getNotificationTaskType(notification);
  const projectName = getNotificationProjectName(notification);

  const surfaceClass = interactiveSurface
    ? "hover:bg-muted/80 dark:hover:bg-muted/70"
    : "";

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={`group flex w-full cursor-pointer gap-3 rounded-md px-2 py-3 text-left transition-colors ${surfaceClass}`}
    >
      <Avatar className="relative z-20 mt-0.5 h-10 w-10 border border-border/50 shadow-sm">
        <AvatarImage
          src={notification.actor ? getUserAvatarUrl(notification.actor) : ""}
        />
        <AvatarFallback
          className={
            notification.actor
              ? "text-xs font-semibold text-white"
              : "bg-muted text-muted-foreground"
          }
          style={
            notification.actor
              ? {
                  backgroundColor: `#${getUserAvatarColor(notification.actor.name)}`,
                }
              : undefined
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
            {taskTitle || taskCode ? (
              <div className="mt-1 space-y-0.5">
                <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-foreground/80">
                  {getTaskTypeIcon(taskType)}
                  <span className="truncate group-hover:underline group-hover:underline-offset-2">
                    {taskTitle ?? taskCode}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-1.5 text-xs leading-none text-muted-foreground">
                  <span className="relative top-[1px] shrink-0 font-medium leading-none">
                    {taskCode}
                  </span>
                  {taskColumnName ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="flex h-3 shrink-0 items-center text-sm font-semibold leading-none"
                      >
                        {"•"}
                      </span>
                      <span className="relative top-[1px] truncate leading-none">
                        {taskColumnName}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            ) : projectName ? (
              <div className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                {projectName}
              </div>
            ) : null}
          </div>
          {unread ? (
            <Circle className="mt-1.5 size-2 shrink-0 fill-primary text-primary" />
          ) : null}
        </div>

        {notification.type === "project_member_added" && projectName ? (
          <div className="rounded-sm border border-border/70 bg-background/80 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
            You were added to {projectName}.
          </div>
        ) : null}
      </div>
    </button>
  );
}

export function NotificationUpdateRow({
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

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className="group relative -mx-2 flex w-[calc(100%+1rem)] cursor-pointer gap-3 rounded-md px-2 py-3 text-left transition-colors hover:bg-muted/80 dark:hover:bg-muted/70"
    >
      <Avatar className="relative z-20 h-10 w-10 border border-border/50 bg-popover shadow-sm">
        <AvatarImage
          src={notification.actor ? getUserAvatarUrl(notification.actor) : ""}
        />
        <AvatarFallback
          className={
            notification.actor
              ? "text-xs font-semibold text-white"
              : "bg-muted text-muted-foreground"
          }
          style={
            notification.actor
              ? {
                  backgroundColor: `#${getUserAvatarColor(notification.actor.name)}`,
                }
              : undefined
          }
        >
          {notification.actor ? (
            getUserInitials(notification.actor.name)
          ) : (
            <Icon className="size-4" />
          )}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
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
          </div>
          {unread ? (
            <Circle className="mt-1.5 size-2 shrink-0 fill-primary text-primary" />
          ) : null}
        </div>
      </div>
    </button>
  );
}

export function NotificationGroupRow({
  group,
  expandedCount,
  onOpen,
  onShowMore,
  onShowLess,
}: {
  group: NotificationGroup;
  expandedCount: number;
  onOpen: (notification: NotificationItem) => void;
  onShowMore: (group: NotificationGroup) => void;
  onShowLess: (group: NotificationGroup) => void;
}) {
  const visibleUpdates = group.updates.slice(0, expandedCount);
  const hasExpandedAllUpdates = expandedCount >= group.updates.length;
  const actorName = group.latest.actor?.name ?? "Velora";
  const firstUpdateActor = group.updates[0]?.actor ?? group.latest.actor;

  const isExpanded = expandedCount > 0;
  const groupHoverClass = !isExpanded
    ? "hover:bg-muted/80 dark:hover:bg-muted/70"
    : "";

  return (
    <div
      className={`group relative mx-4 rounded-md transition-colors ${
        isExpanded
          ? "before:pointer-events-none before:absolute before:bottom-11 before:left-7 before:top-8 before:z-10 before:w-[3px] before:-translate-x-1/2 before:bg-border/70"
          : ""
      } ${groupHoverClass}`}
    >
      <div>
        <NotificationRow
          notification={group.latest}
          onOpen={onOpen}
          interactiveSurface={isExpanded}
        />
      </div>
      {group.updates.length > 0 ? (
        <div className="pb-3">
          {expandedCount === 0 ? (
            <button
              type="button"
              className="ml-[60px] flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline hover:underline-offset-2"
              onClick={() => onShowMore(group)}
            >
              <Avatar className="relative z-20 h-6 w-6 border border-border/50 shadow-sm">
                <AvatarImage
                  src={
                    firstUpdateActor ? getUserAvatarUrl(firstUpdateActor) : ""
                  }
                />
                <AvatarFallback
                  className={
                    firstUpdateActor
                      ? "text-[9px] font-semibold text-white"
                      : "bg-muted text-[9px] font-semibold text-muted-foreground"
                  }
                  style={
                    firstUpdateActor
                      ? {
                          backgroundColor: `#${getUserAvatarColor(firstUpdateActor.name)}`,
                        }
                      : undefined
                  }
                >
                  {firstUpdateActor
                    ? getUserInitials(firstUpdateActor.name)
                    : "VL"}
                </AvatarFallback>
              </Avatar>
              <span>
                +{group.updates.length} update
                {group.updates.length === 1 ? "" : "s"} from {actorName}
              </span>
            </button>
          ) : (
            <div className="relative mt-2 px-2">
              <div className="space-y-2">
                {visibleUpdates.map((notification) => (
                  <NotificationUpdateRow
                    key={notification.id}
                    notification={notification}
                    onOpen={onOpen}
                  />
                ))}
              </div>
              <button
                type="button"
                className="ml-[60px] mt-2 cursor-pointer text-sm font-medium text-primary hover:underline hover:underline-offset-2"
                onClick={() =>
                  hasExpandedAllUpdates ? onShowLess(group) : onShowMore(group)
                }
              >
                {hasExpandedAllUpdates ? "Show less" : "Show more"}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function NotificationDropdown() {
  useNotificationRealtime();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [activeTab, setActiveTab] = useState<"direct" | "watching">("direct");
  const [expandedGroupCounts, setExpandedGroupCounts] = useState<
    Record<string, number>
  >({});
  const navigate = useNavigate();
  const notificationsQuery = useNotifications(
    1,
    20,
    onlyUnread ? true : undefined,
  );
  const unreadCountQuery = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = useMemo(
    () => notificationsQuery.data?.data ?? [],
    [notificationsQuery.data?.data],
  );
  const unreadCount = unreadCountQuery.data ?? 0;
  const isLoading = notificationsQuery.isLoading || unreadCountQuery.isLoading;
  const visibleNotifications = useMemo(() => {
    return notifications.filter(() => {
      if (activeTab === "watching") return false;
      return true;
    });
  }, [activeTab, notifications]);
  const visibleNotificationGroups = useMemo(
    () => groupNotifications(visibleNotifications),
    [visibleNotifications],
  );

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

  const handleShowMoreGroupUpdates = (group: NotificationGroup) => {
    setExpandedGroupCounts((previous) => ({
      ...previous,
      [group.key]: Math.min(
        group.updates.length,
        (previous[group.key] ?? 0) + 4,
      ),
    }));
  };

  const handleShowLessGroupUpdates = (group: NotificationGroup) => {
    setExpandedGroupCounts((previous) => ({
      ...previous,
      [group.key]: 0,
    }));
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setMoreOpen(false);
          setExpandedGroupCounts({});
        }
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
        className="w-[560px] max-w-[calc(100vw-32px)] gap-0 overflow-hidden p-0 shadow-xl"
      >
        <ScrollArea className="h-[clamp(0px,calc(var(--radix-popover-content-available-height)-64px),812px)] [&_[data-slot=scroll-area-scrollbar][data-orientation=vertical]]:mt-[108px] [&_[data-slot=scroll-area-scrollbar][data-orientation=vertical]]:!h-[calc(100%-108px)]">
          <div className="px-6 pb-0 pt-6">
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
                  <Switch
                    checked={onlyUnread}
                    onCheckedChange={setOnlyUnread}
                  />
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
          </div>

          <div className="sticky top-0 z-30 border-b border-border/70 bg-popover px-6 pt-5">
            <div className="flex items-end gap-5">
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
              <div className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Latest
              </div>
              <div className="space-y-2">
                {visibleNotificationGroups.map((group) => (
                  <NotificationGroupRow
                    key={group.key}
                    group={group}
                    expandedCount={expandedGroupCounts[group.key] ?? 0}
                    onOpen={handleOpenNotification}
                    onShowMore={handleShowMoreGroupUpdates}
                    onShowLess={handleShowLessGroupUpdates}
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
