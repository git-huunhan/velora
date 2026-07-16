import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProjectSummary, type ProjectSummaryState } from "@/features/projects";
import type { Project } from "@/features/projects/model/types";

const project: Project = {
  avatar: "map-blue",
  description:
    "A focused project workspace for delivery planning and collaboration.",
  endDate: "2026-08-05",
  id: "project-summary-story",
  key: "PRJ",
  memberIds: ["admin", "test", "member"],
  members: [
    {
      affectedAssignedTaskCount: 0,
      capabilities: {
        canCreateWorkItems: true,
        canDeleteProject: true,
        canDeleteWorkItems: true,
        canManageMembers: true,
        canManageWorkflow: true,
        canReadProject: true,
        canReadWorkItems: true,
        canUpdateProject: true,
        canUpdateWorkItems: true,
      },
      name: "Admin Pro",
      role: "admin",
      userId: "admin",
    },
    {
      affectedAssignedTaskCount: 0,
      capabilities: {
        canCreateWorkItems: true,
        canDeleteProject: false,
        canDeleteWorkItems: false,
        canManageMembers: false,
        canManageWorkflow: false,
        canReadProject: true,
        canReadWorkItems: true,
        canUpdateProject: false,
        canUpdateWorkItems: true,
      },
      name: "Test User",
      role: "member",
      userId: "test",
    },
    {
      affectedAssignedTaskCount: 0,
      capabilities: {
        canCreateWorkItems: false,
        canDeleteProject: false,
        canDeleteWorkItems: false,
        canManageMembers: false,
        canManageWorkflow: false,
        canReadProject: true,
        canReadWorkItems: true,
        canUpdateProject: false,
        canUpdateWorkItems: false,
      },
      name: "Member Test",
      role: "viewer",
      userId: "member",
    },
  ],
  name: "Project 1",
  startDate: "2026-07-01",
  status: "active",
};

function SummaryCanvas({ state }: { state?: ProjectSummaryState }) {
  return (
    <div className="min-h-screen overflow-auto bg-background p-6 text-foreground">
      <ProjectSummary project={project} state={state} />
    </div>
  );
}

const meta = {
  title: "Product/Project Summary",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Project Summary UI states for reviewing metric cards, status overview, activity, workload and epic progress before API integration.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  render: () => <SummaryCanvas />,
};

export const Empty: Story = {
  render: () => <SummaryCanvas state="empty" />,
};

export const Loading: Story = {
  render: () => <SummaryCanvas state="loading" />,
};

export const Error: Story = {
  render: () => <SummaryCanvas state="error" />,
};
