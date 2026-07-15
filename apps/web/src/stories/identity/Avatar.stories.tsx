import type { Meta, StoryObj } from "@storybook/react-vite";
import { UserRoundIcon } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  getUserAvatarColor,
  getUserInitials,
  getUserAvatarUrl,
} from "@/features/auth/model/userAvatar";

const users = [
  { name: "Admin Pro" },
  { name: "Test User" },
  { name: "Member Test" },
  { name: "Jane Smith" },
];

function UserAvatar({
  name,
  size = "default",
}: {
  name: string;
  size?: "sm" | "default" | "lg";
}) {
  return (
    <Avatar size={size}>
      <AvatarImage src={getUserAvatarUrl({ name })} alt={name} />
      <AvatarFallback
        className="font-semibold text-white"
        style={{ backgroundColor: `#${getUserAvatarColor(name)}` }}
      >
        {getUserInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

const meta = {
  title: "Design System/Identity/Avatar",
  parameters: {
    docs: {
      description: {
        component:
          "Shared avatar states. This story intentionally uses the production avatar helper so header, notifications, task cards and member lists stay visually consistent.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const UserColors: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {users.map((user) => (
        <div key={user.name} className="flex items-center gap-3">
          <UserAvatar name={user.name} />
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">
            #{getUserAvatarColor(user.name)}
          </span>
        </div>
      ))}
    </div>
  ),
};

export const SizesAndGroup: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <UserAvatar name="Admin Pro" size="sm" />
        <UserAvatar name="Admin Pro" />
        <UserAvatar name="Admin Pro" size="lg" />
      </div>
      <AvatarGroup>
        {users.slice(0, 3).map((user) => (
          <UserAvatar key={user.name} name={user.name} />
        ))}
        <AvatarGroupCount>+4</AvatarGroupCount>
      </AvatarGroup>
    </div>
  ),
};

export const Unassigned: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback>
          <UserRoundIcon className="size-4" />
        </AvatarFallback>
      </Avatar>
      <span className="text-sm text-muted-foreground">Unassigned</span>
    </div>
  ),
};
