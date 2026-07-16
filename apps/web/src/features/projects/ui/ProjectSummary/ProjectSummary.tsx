import {
  Activity,
  AlertCircle,
  BarChart3,
  Bug,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Crown,
  FileCheck2,
  ListFilter,
  PieChart as PieChartIcon,
  RefreshCw,
  SquaresExclude,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  getUserAvatarUrl,
  getUserInitials,
} from "@/features/auth/model/userAvatar";
import type { Project } from "@/features/projects/model/types";
import { PriorityIcon } from "@/features/tasks/ui/PriorityIcon/PriorityIcon";

export type ProjectSummaryState = "populated" | "empty" | "loading" | "error";

type MetricCard = {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  helper: string;
};

type StatusSlice = {
  name: string;
  value: number;
  color: string;
};

type RecentActivity = {
  id: string;
  actor: string;
  action: string;
  taskCode: string;
  taskTitle: string;
  taskType: "task" | "epic" | "bug" | "subtask";
  time: string;
};

type PriorityBreakdown = {
  name: string;
  value: number;
};

type WorkTypeBreakdown = {
  color: string;
  icon: typeof ClipboardList;
  name: string;
  percent: number;
};

type WorkloadRow = {
  assignee: string;
  percent: number;
};

type EpicProgress = {
  done: number;
  inProgress: number;
  name: string;
  todo: number;
};

type ProjectSummaryData = {
  metrics: MetricCard[];
  status: StatusSlice[];
  recentActivity: RecentActivity[];
  priority: PriorityBreakdown[];
  workTypes: WorkTypeBreakdown[];
  workload: WorkloadRow[];
  epicProgress: EpicProgress[];
};

const statusColors = ["#8b5cf6", "#3b82f6", "#eab308", "#10b981"];

const taskTypeMeta = {
  bug: { color: "text-red-500", icon: Bug, label: "Bug" },
  epic: { color: "text-purple-500", icon: Crown, label: "Epic" },
  subtask: { color: "text-cyan-500", icon: SquaresExclude, label: "Subtask" },
  task: { color: "text-primary", icon: ClipboardList, label: "Task" },
};

function createProjectSummaryDemoData(project: Project): ProjectSummaryData {
  const memberCount = Math.max(project.memberIds.length, 1);

  return {
    metrics: [
      {
        helper: "in the last 7 days",
        icon: CheckCircle2,
        label: "completed",
        value: 2,
      },
      {
        helper: "in the last 7 days",
        icon: Activity,
        label: "updated",
        value: 14,
      },
      {
        helper: "in the last 7 days",
        icon: FileCheck2,
        label: "created",
        value: 5,
      },
      {
        helper: "in the next 7 days",
        icon: CalendarClock,
        label: "due soon",
        value: 3,
      },
    ],
    status: [
      { color: statusColors[0], name: "To Do", value: 3 },
      { color: statusColors[1], name: "In Progress", value: 2 },
      { color: statusColors[2], name: "Review", value: 2 },
      { color: statusColors[3], name: "Done", value: 2 },
    ],
    recentActivity: [
      {
        action: "moved a task to Review",
        actor: project.members?.[0]?.name ?? "Admin Pro",
        id: "activity-review",
        taskCode: `${project.key}-125`,
        taskTitle: "Build Project 1 workspace",
        taskType: "task",
        time: "less than a minute ago",
      },
      {
        action: "created a task",
        actor: project.members?.[1]?.name ?? "Test User",
        id: "activity-created",
        taskCode: `${project.key}-166`,
        taskTitle: "Document notification decisions",
        taskType: "task",
        time: "12 minutes ago",
      },
      {
        action: "updated priority on",
        actor: project.members?.[0]?.name ?? "Admin Pro",
        id: "activity-priority",
        taskCode: `${project.key}-161`,
        taskTitle: "Fix standalone Project 1 defect",
        taskType: "bug",
        time: "about 1 hour ago",
      },
    ],
    priority: [
      { name: "High", value: 2 },
      { name: "Medium", value: 4 },
      { name: "Low", value: 2 },
    ],
    workTypes: [
      {
        color: "bg-primary",
        icon: ClipboardList,
        name: "Task",
        percent: 56,
      },
      {
        color: "bg-cyan-500",
        icon: SquaresExclude,
        name: "Subtask",
        percent: 18,
      },
      { color: "bg-red-500", icon: Bug, name: "Bug", percent: 14 },
      { color: "bg-purple-500", icon: Crown, name: "Epic", percent: 12 },
    ],
    workload: [
      { assignee: project.members?.[0]?.name ?? "Admin Pro", percent: 44 },
      { assignee: project.members?.[1]?.name ?? "Test User", percent: 28 },
      { assignee: "Unassigned", percent: Math.max(12, 100 - memberCount * 18) },
    ],
    epicProgress: [
      { done: 25, inProgress: 50, name: "Project 1 delivery", todo: 25 },
      { done: 50, inProgress: 25, name: "Portfolio demo readiness", todo: 25 },
    ],
  };
}

function SummaryCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-border bg-card text-card-foreground shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function MetricCardView({ metric }: { metric: MetricCard }) {
  const Icon = metric.icon;

  return (
    <SummaryCard className="p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tracking-tight">
              {metric.value}
            </span>
            <span className="text-base font-semibold">{metric.label}</span>
          </div>
          <p className="text-xs text-muted-foreground">{metric.helper}</p>
        </div>
      </div>
    </SummaryCard>
  );
}

function StatusOverview({ data }: { data: StatusSlice[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <SummaryCard className="p-5 lg:col-span-2">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">Status overview</h3>
          <p className="text-sm text-muted-foreground">
            Get a snapshot of the status of your work items.
          </p>
        </div>
        <Button variant="link" size="sm" className="h-auto p-0 text-primary">
          View all work items
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="relative h-72 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={78}
                outerRadius={112}
                paddingAngle={1}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--card-foreground)",
                  fontSize: "13px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-semibold">{total}</div>
              <div className="max-w-28 truncate text-xs font-medium text-muted-foreground">
                Total work items
              </div>
            </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {item.name}
              </span>
              <span className="font-medium tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </SummaryCard>
  );
}

function RecentActivityList({ activities }: { activities: RecentActivity[] }) {
  return (
    <SummaryCard className="p-5 lg:col-span-2">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">Recent activity</h3>
          <p className="text-sm text-muted-foreground">
            Stay up to date with what's happening across the space.
          </p>
        </div>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <TrendingUp className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Today
        </p>
        {activities.map((activity) => {
          const type = taskTypeMeta[activity.taskType];
          const TypeIcon = type.icon;
          return (
            <div key={activity.id} className="flex gap-3">
              <Avatar className="h-8 w-8 border border-border/50">
                <AvatarImage src={getUserAvatarUrl({ name: activity.actor })} />
                <AvatarFallback>
                  {getUserInitials(activity.actor)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-primary hover:underline cursor-pointer">
                    {activity.actor}
                  </span>{" "}
                  <span>{activity.action}</span>{" "}
                  <span className="inline-flex max-w-full items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 align-middle text-xs font-semibold text-foreground">
                    <TypeIcon className={`h-3 w-3 ${type.color}`} />
                    <span className="truncate">
                      {activity.taskCode}: {activity.taskTitle}
                    </span>
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SummaryCard>
  );
}

function getPriorityChartColor(priority: string) {
  if (priority === "high") return "#ef4444";
  if (priority === "medium") return "#eab308";
  return "#3b82f6";
}

function PriorityBreakdown({ data }: { data: PriorityBreakdown[] }) {
  return (
    <SummaryCard className="p-5">
      <div className="mb-4">
        <h3 className="font-semibold">Priority breakdown</h3>
        <p className="text-sm text-muted-foreground">
          Get a holistic view of how work is being prioritized.
        </p>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ bottom: 4, left: -22, right: 8, top: 8 }}
          >
            <XAxis
              axisLine={{ stroke: "var(--border)" }}
              dataKey="name"
              tick={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--card-foreground)",
                fontSize: "13px",
              }}
              cursor={{ fill: "var(--muted)" }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((item) => (
                <Cell
                  key={item.name}
                  fill={getPriorityChartColor(item.name.toLowerCase())}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-sm text-muted-foreground">
        {data.map((item) => {
          const priority = item.name.toLowerCase();

          return (
            <div
              key={item.name}
              className="flex min-w-0 items-center justify-center gap-2"
            >
              <PriorityIcon priority={priority} />
              <span className="truncate">{item.name}</span>
            </div>
          );
        })}
      </div>
    </SummaryCard>
  );
}

function WorkTypeBreakdown({ data }: { data: WorkTypeBreakdown[] }) {
  return (
    <SummaryCard className="p-5">
      <div className="mb-5">
        <h3 className="font-semibold">Types of work</h3>
        <p className="text-sm text-muted-foreground">
          Get a breakdown of work items by their types.
        </p>
      </div>
      <div className="space-y-4">
        {data.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="grid grid-cols-[120px_1fr] items-center gap-3 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon
                  className={`h-4 w-4 ${item.name === "Task" ? "text-primary" : item.name === "Subtask" ? "text-cyan-500" : item.name === "Bug" ? "text-red-500" : "text-purple-500"}`}
                />
                <span className="truncate">{item.name}</span>
              </div>
              <div className="h-6 overflow-hidden rounded-sm bg-muted">
                <div
                  className={`flex h-full items-center justify-end pr-2 text-xs font-medium text-white ${item.color}`}
                  style={{ width: `${item.percent}%` }}
                >
                  {item.percent}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SummaryCard>
  );
}

function TeamWorkload({ data }: { data: WorkloadRow[] }) {
  return (
    <SummaryCard className="p-5">
      <div className="mb-5">
        <h3 className="font-semibold">Team workload</h3>
        <p className="text-sm text-muted-foreground">
          Monitor the capacity of your team.
        </p>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-[160px_1fr] gap-3 text-xs font-semibold text-muted-foreground">
          <span>Assignee</span>
          <span>Work distribution</span>
        </div>
        {data.map((item) => (
          <div
            key={item.assignee}
            className="grid grid-cols-[160px_1fr] items-center gap-3 text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 border border-border/50">
                {item.assignee === "Unassigned" ? null : (
                  <AvatarImage
                    src={getUserAvatarUrl({ name: item.assignee })}
                  />
                )}
                <AvatarFallback>
                  {item.assignee === "Unassigned" ? (
                    <UserRound className="h-4 w-4" />
                  ) : (
                    getUserInitials(item.assignee)
                  )}
                </AvatarFallback>
              </Avatar>
              <span className="truncate font-medium">{item.assignee}</span>
            </div>
            <div className="h-6 overflow-hidden rounded-sm bg-muted">
              <div
                className="flex h-full items-center justify-end bg-muted-foreground/60 pr-2 text-xs font-medium text-background"
                style={{ width: `${item.percent}%` }}
              >
                {item.percent}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </SummaryCard>
  );
}

function EpicProgress({ data }: { data: EpicProgress[] }) {
  return (
    <SummaryCard className="p-5">
      <div className="mb-5">
        <h3 className="font-semibold">Epic progress</h3>
        <p className="text-sm text-muted-foreground">
          See how your epics are progressing at a glance.
        </p>
      </div>
      <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-emerald-500" />
          Done
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-blue-500" />
          In progress
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-muted-foreground/50" />
          To do
        </span>
      </div>
      <div className="space-y-5">
        {data.map((epic) => (
          <div key={epic.name} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Crown className="h-4 w-4 text-purple-500" />
              <span>{epic.name}</span>
            </div>
            <div className="flex h-7 overflow-hidden rounded-sm bg-muted text-xs font-medium text-white">
              <div
                className="flex items-center justify-center bg-emerald-500"
                style={{ width: `${epic.done}%` }}
              >
                {epic.done}%
              </div>
              <div
                className="flex items-center justify-center bg-blue-500"
                style={{ width: `${epic.inProgress}%` }}
              >
                {epic.inProgress}%
              </div>
              <div
                className="flex items-center justify-center bg-muted-foreground/50"
                style={{ width: `${epic.todo}%` }}
              >
                {epic.todo}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </SummaryCard>
  );
}

function SummarySkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-lg border border-border bg-card"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-lg border border-border bg-card" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-lg border border-border bg-card" />
        <div className="h-72 animate-pulse rounded-lg border border-border bg-card" />
      </div>
    </div>
  );
}

function EmptySummary() {
  return (
    <SummaryCard className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
      <PieChartIcon className="mb-4 h-10 w-10 text-muted-foreground" />
      <h3 className="text-lg font-semibold">No summary data yet</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Create work items and move them through your workflow to build a useful
        project summary.
      </p>
    </SummaryCard>
  );
}

function ErrorSummary() {
  return (
    <SummaryCard className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="mb-4 h-10 w-10 text-destructive" />
      <h3 className="text-lg font-semibold">Could not load summary</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Summary data is temporarily unavailable. Try refreshing the page.
      </p>
      <Button
        className="mt-5"
        variant="outline"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Retry
      </Button>
    </SummaryCard>
  );
}

export function ProjectSummary({
  project,
  state = "populated",
}: {
  project: Project;
  state?: ProjectSummaryState;
}) {
  const data = createProjectSummaryDemoData(project);

  if (state === "loading") return <SummarySkeleton />;
  if (state === "error") return <ErrorSummary />;
  if (state === "empty") return <EmptySummary />;

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="rounded-lg border border-primary/25 bg-primary/10 p-4 text-sm text-foreground dark:bg-primary/15">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              Customize your Reports view to suit your space.
            </p>
            <p className="mt-1 text-muted-foreground">
              Summary starts with a focused overview. Reports customization will
              come after this UI is reviewed.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled
            aria-label="Close summary notice"
            className="-mr-2 -mt-2 h-8 w-8 shrink-0 text-muted-foreground opacity-60"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex -space-x-2">
          {(project.members ?? []).slice(0, 3).map((member) => (
            <Avatar
              key={member.userId}
              className="h-8 w-8 border-2 border-background"
            >
              <AvatarImage src={getUserAvatarUrl(member)} />
              <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <ListFilter className="h-4 w-4 opacity-70" />
          Filter
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data.metrics.map((metric) => (
          <MetricCardView key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <StatusOverview data={data.status} />
        <RecentActivityList activities={data.recentActivity} />
        <PriorityBreakdown data={data.priority} />
        <WorkTypeBreakdown data={data.workTypes} />
        <TeamWorkload data={data.workload} />
        <EpicProgress data={data.epicProgress} />
      </div>

      <div className="pb-2 pt-1 text-center text-xs text-muted-foreground">
        <span>Was the information shown in this page useful?</span>
        <Button variant="link" size="sm" className="h-auto px-2 text-primary">
          Give feedback
        </Button>
      </div>
    </div>
  );
}
