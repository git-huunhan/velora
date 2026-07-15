import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { BoardColumn } from "@/features/tasks/ui/BoardColumn/BoardColumn";
import { TaskCard } from "@/features/tasks/ui/TaskCard/TaskCard";
import { KANBAN_COLUMNS, type Task } from "@/features/tasks/model/types";
import { tasksKeys } from "@/features/tasks/model/useTasks";

const projectId = "storybook-project";

const users = {
  admin: {
    id: "user-admin",
    name: "Admin Pro",
    avatarUrl: "",
  },
  jane: {
    id: "user-jane",
    name: "Jane Smith",
    avatarUrl: "",
  },
};

const tasks: Task[] = [
  {
    id: "task-epic-project-delivery",
    code: "PRJ-101",
    projectId,
    title: "Project 1 delivery",
    type: "epic",
    status: "todo",
    priority: "low",
    order: 1,
    assignee: users.admin,
    assigneeId: users.admin.id,
    reporter: users.admin,
    reporterId: users.admin.id,
    labels: ["Roadmap"],
    createdAt: "2026-07-01T08:00:00.000Z",
  },
  {
    id: "task-build-workspace",
    code: "PRJ-125",
    projectId,
    title: "Build Project 1 workspace",
    type: "task",
    status: "review",
    priority: "low",
    order: 2,
    parentId: "task-epic-project-delivery",
    assignee: users.admin,
    assigneeId: users.admin.id,
    reporter: users.jane,
    reporterId: users.jane.id,
    labels: ["Frontend"],
    dueDate: "2026-07-27",
    createdAt: "2026-07-02T08:00:00.000Z",
  },
  {
    id: "task-standalone-bug",
    code: "PRJ-161",
    projectId,
    title: "Fix standalone Project 1 defect",
    type: "bug",
    status: "in-progress",
    priority: "high",
    order: 3,
    assignee: users.jane,
    assigneeId: users.jane.id,
    reporter: users.admin,
    reporterId: users.admin.id,
    labels: ["Backend", "Bug"],
    dueDate: "2026-07-09",
    createdAt: "2026-07-03T08:00:00.000Z",
  },
  {
    id: "task-subtask-validation",
    code: "PRJ-149",
    projectId,
    title: "Validate Project 1 workflow",
    type: "subtask",
    status: "in-progress",
    priority: "medium",
    order: 4,
    parentId: "task-build-workspace",
    assignee: users.admin,
    assigneeId: users.admin.id,
    reporter: users.admin,
    reporterId: users.admin.id,
    createdAt: "2026-07-04T08:00:00.000Z",
  },
  {
    id: "task-unassigned-rendering",
    code: "PRJ-162",
    projectId,
    title: "Test optimistic rendering task",
    type: "task",
    status: "in-progress",
    priority: "medium",
    order: 5,
    reporter: users.admin,
    reporterId: users.admin.id,
    createdAt: "2026-07-05T08:00:00.000Z",
  },
];

function createStoryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  queryClient.setQueryData(tasksKeys.byProject(projectId), tasks);
  return queryClient;
}

function StoryProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={createStoryClient()}>
      <MemoryRouter initialEntries={[`/projects/${projectId}`]}>
        <Routes>
          <Route path="/projects/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Product/Kanban Work Items",
  decorators: [
    (Story) => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Kanban work item states based on the Saga 1-2 case study: hierarchy, work type, labels, due dates, assignee and quick board density.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const noop = () => undefined;

export const CardStates: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">Kanban case study</p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Work item card states
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            These cards show the hierarchy and density decisions used in the
            real board: epic, task, bug, subtask, assigned and unassigned
            states.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.slice(0, 5).map((task) => (
            <div key={task.id} className="w-[280px]">
              <TaskCard task={task} onClick={noop} />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const ColumnSnapshot: Story = {
  render: () => (
    <div className="min-h-screen overflow-auto bg-background p-8 text-foreground">
      <div className="mb-6 max-w-2xl">
        <p className="text-sm font-medium text-primary">Board composition</p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Column state with real task cards
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A board column uses real work-item cards and quick create affordance,
          matching the app without introducing Storybook-only UI.
        </p>
      </div>

      <div className="flex gap-6">
        <div className="h-[560px] w-[300px] shrink-0">
          <BoardColumn
            columnId="in-progress"
            title="In Progress"
            column={KANBAN_COLUMNS[1]}
            columns={KANBAN_COLUMNS}
            tasks={tasks.filter((task) => task.status === "in-progress")}
            isFirstColumn
            onTaskClick={noop}
            onRenameColumn={noop}
            onSetDoneColumn={noop}
            onDeleteColumn={async () => undefined}
            onColumnDragStart={noop}
            onColumnDragEnd={noop}
            canReorderColumn={false}
            isColumnDragging={false}
            onColumnDragOver={noop}
            onColumnDrop={noop}
            dropIndicatorSide={null}
            onCreateTask={noop}
          />
        </div>

        <div className="h-[560px] w-[300px] shrink-0">
          <BoardColumn
            columnId="review"
            title="Review"
            column={KANBAN_COLUMNS[2]}
            columns={KANBAN_COLUMNS}
            tasks={tasks.filter((task) => task.status === "review")}
            onTaskClick={noop}
            onRenameColumn={noop}
            onSetDoneColumn={noop}
            onDeleteColumn={async () => undefined}
            onColumnDragStart={noop}
            onColumnDragEnd={noop}
            canReorderColumn={false}
            isColumnDragging={false}
            onColumnDragOver={noop}
            onColumnDrop={noop}
            dropIndicatorSide={null}
            onCreateTask={noop}
          />
        </div>
      </div>
    </div>
  ),
};
