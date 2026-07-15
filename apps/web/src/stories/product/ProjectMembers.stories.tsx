import type { Meta, StoryObj } from "@storybook/react-vite";
import { UserMinus } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getUserAvatarColor,
  getUserAvatarUrl,
  getUserInitials,
} from "@/features/auth/model/userAvatar";
import type { ProjectMember } from "@/features/projects/model/types";

const members: ProjectMember[] = [
  {
    affectedAssignedTaskCount: 0,
    name: "Admin Pro",
    role: "owner",
    userId: "user-admin",
  },
  {
    affectedAssignedTaskCount: 2,
    name: "Test User",
    role: "member",
    userId: "user-test",
  },
  {
    affectedAssignedTaskCount: 0,
    name: "Member Test",
    role: "member",
    userId: "user-member-test",
  },
];

const meta = {
  title: "Product/Project Members",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Project membership states for owner ordering, member rows and remove confirmation copy when assigned work needs cleanup.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function MemberAvatar({ member }: { member: ProjectMember }) {
  return (
    <Avatar className="h-8 w-8 border border-border/50">
      <AvatarImage src={getUserAvatarUrl(member)} />
      <AvatarFallback
        className="text-xs font-semibold text-white"
        style={{ backgroundColor: `#${getUserAvatarColor(member.name)}` }}
      >
        {getUserInitials(member.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function ProjectMembersDialog({
  pendingRemoval,
}: {
  pendingRemoval?: ProjectMember;
}) {
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(
    pendingRemoval ?? null,
  );

  return (
    <div className="min-h-[520px] w-[520px] bg-background p-10 text-foreground">
      <Dialog open>
        <DialogContent className="top-[96px] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-sm">
          <DialogHeader className="border-b px-4 py-3 text-left">
            <DialogTitle className="text-sm">Project members</DialogTitle>
            <DialogDescription className="text-xs">
              Project 1 has {members.length} members.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
            {members.map((member) => {
              const canRemoveMember = member.role !== "owner";

              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
                >
                  <MemberAvatar member={member} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {member.name}
                    </div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {member.role}
                    </div>
                  </div>
                  {canRemoveMember ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${member.name} from project`}
                      onClick={() => setSelectedMember(member)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(selectedMember)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove project member?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMember
                ? selectedMember.affectedAssignedTaskCount > 0
                  ? `${selectedMember.name} will lose project access. ${selectedMember.affectedAssignedTaskCount} assigned work items will be moved to Unassigned.`
                  : `${selectedMember.name} will lose project access. No assigned work items need cleanup.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMember(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => setSelectedMember(null)}
            >
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const MemberList: Story = {
  render: () => <ProjectMembersDialog />,
};

export const RemoveConfirmation: Story = {
  render: () => <ProjectMembersDialog pendingRemoval={members[1]} />,
};
