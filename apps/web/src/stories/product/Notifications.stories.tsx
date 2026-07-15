import type { Meta, StoryObj } from "@storybook/react-vite";
import type React from "react";
import { useState } from "react";

import type { NotificationItem } from "@/features/notifications";
import {
  NotificationGroupRow,
  NotificationRow,
} from "@/widgets/Header/NotificationDropdown";

type NotificationGroup = {
  key: string;
  latest: NotificationItem;
  updates: NotificationItem[];
};

function getNotificationGroupKey(notification: NotificationItem) {
  return notification.task?.id ?? notification.project?.id ?? notification.id;
}

function groupStoryNotifications(items: NotificationItem[]) {
  const groups = new Map<string, NotificationGroup>();

  for (const notification of items) {
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
const actorAdmin = {
  id: "user-admin",
  name: "Admin Pro",
};

const actorTest = {
  id: "user-test",
  name: "Test User",
};

const project = {
  id: "project-1",
  key: "PRJ",
  name: "Project 1",
};

const task = {
  code: "PRJ-125",
  columnName: "Review",
  id: "task-125",
  title: "Build Project 1 workspace",
  type: "task" as const,
};

const now = new Date("2026-07-15T08:00:00.000Z");

function hoursAgo(hours: number) {
  return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}

const notifications: NotificationItem[] = [
  {
    actor: actorTest,
    createdAt: hoursAgo(2),
    id: "notification-comment-latest",
    metadata: {
      taskCode: "PRJ-125",
      taskTitle: "Build Project 1 workspace",
      taskType: "task",
      toColumnName: "Review",
    },
    project,
    readAt: null,
    task,
    type: "task_commented",
  },
  {
    actor: {
      id: "member-test",
      name: "Member Test",
    },
    createdAt: hoursAgo(3),
    id: "notification-comment-update",
    metadata: {
      taskCode: "PRJ-125",
      taskTitle: "Build Project 1 workspace",
      taskType: "task",
      toColumnName: "Review",
    },
    project,
    readAt: null,
    task,
    type: "task_commented",
  },
  {
    actor: actorTest,
    createdAt: hoursAgo(24),
    id: "notification-status-update-1",
    metadata: {
      fromColumnName: "To Do",
      taskCode: "PRJ-125",
      taskTitle: "Build Project 1 workspace",
      taskType: "task",
      toColumnName: "Review",
    },
    project,
    readAt: "2026-07-15T07:00:00.000Z",
    task,
    type: "task_status_changed",
  },
  {
    actor: actorAdmin,
    createdAt: hoursAgo(28),
    id: "notification-assigned-read",
    metadata: {
      assigneeName: "Test User",
      taskCode: "PRJ-163",
      taskTitle: "Agent Test Task",
      taskType: "bug",
      toColumnName: "Done",
    },
    project,
    readAt: "2026-07-15T06:30:00.000Z",
    task: {
      code: "PRJ-163",
      columnName: "Done",
      id: "task-163",
      title: "Agent Test Task",
      type: "bug",
    },
    type: "task_assigned",
  },
  {
    actor: actorAdmin,
    createdAt: hoursAgo(30),
    id: "notification-member-added",
    metadata: {
      projectName: "Mobile App Updated",
    },
    project: {
      id: "project-mobile",
      key: "APP",
      name: "Mobile App Updated",
    },
    readAt: null,
    task: null,
    type: "project_member_added",
  },
];

const meta = {
  title: "Product/Notifications",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Notification states for the Activity Center: unread/read rows, task snapshots, grouped updates and empty state without calling the API.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function NotificationPanel({
  children,
  title = "Notifications",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto w-[560px] max-w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
        <div className="px-6 pb-3 pt-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              3 new
            </span>
          </div>
        </div>
        <div className="border-b border-border/70 px-6">
          <div className="flex items-end gap-5">
            <span className="border-b-2 border-primary pb-2 text-sm font-medium text-primary">
              Direct
            </span>
            <span className="border-b-2 border-transparent pb-2 text-sm font-medium text-muted-foreground">
              Watching
            </span>
          </div>
        </div>
        <div className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Latest
        </div>
        <div className="space-y-2 pb-5">{children}</div>
      </div>
    </div>
  );
}

function GroupedNotificationsExample() {
  const [expandedGroupCounts, setExpandedGroupCounts] = useState<
    Record<string, number>
  >({});
  const groups = groupStoryNotifications(notifications);

  return (
    <NotificationPanel>
      {groups.map((group) => (
        <NotificationGroupRow
          key={group.key}
          group={group}
          expandedCount={expandedGroupCounts[group.key] ?? 0}
          onOpen={() => undefined}
          onShowMore={(selectedGroup) =>
            setExpandedGroupCounts((previous) => ({
              ...previous,
              [selectedGroup.key]: Math.min(
                selectedGroup.updates.length,
                (previous[selectedGroup.key] ?? 0) + 4,
              ),
            }))
          }
          onShowLess={(selectedGroup) =>
            setExpandedGroupCounts((previous) => ({
              ...previous,
              [selectedGroup.key]: 0,
            }))
          }
        />
      ))}
    </NotificationPanel>
  );
}

export const GroupedUpdates: Story = {
  render: () => <GroupedNotificationsExample />,
};

export const ReadAndUnreadRows: Story = {
  render: () => (
    <NotificationPanel title="Notification row states">
      <div className="space-y-2 px-4">
        {notifications.slice(0, 4).map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            onOpen={() => undefined}
          />
        ))}
      </div>
    </NotificationPanel>
  ),
};

export const EmptyState: Story = {
  render: () => (
    <NotificationPanel title="Notifications">
      <div className="px-10 py-14 text-center text-sm text-muted-foreground">
        No notifications yet.
      </div>
    </NotificationPanel>
  ),
};
