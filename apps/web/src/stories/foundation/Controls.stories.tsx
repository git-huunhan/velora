import type { Meta, StoryObj } from "@storybook/react-vite";
import { MailIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const meta = {
  title: "Design System/Foundation/Controls",
  parameters: {
    docs: {
      description: {
        component:
          "Baseline controls used across Velora. Stories use the real app primitives so hover, focus, disabled and theme contrast can be checked in one place.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Buttons: Story = {
  render: () => (
    <div className="flex max-w-3xl flex-col gap-6">
      <section className="flex flex-wrap items-center gap-3">
        <Button>
          <PlusIcon /> Create
        </Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">
          <Trash2Icon /> Delete
        </Button>
        <Button variant="link">Link action</Button>
      </section>
      <section className="flex flex-wrap items-center gap-3">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Mail">
          <MailIcon />
        </Button>
        <Button disabled>Disabled</Button>
      </section>
    </div>
  ),
};

export const Badges: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Blocked</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </div>
  ),
};

export const InputsAndMenus: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
      <Input placeholder="Search tasks..." />
      <Input aria-invalid placeholder="Invalid state" />
      <Select defaultValue="todo">
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todo">To Do</SelectItem>
          <SelectItem value="progress">In Progress</SelectItem>
          <SelectItem value="review">Review</SelectItem>
          <SelectItem value="done">Done</SelectItem>
        </SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuLabel>Project actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Copy project link</DropdownMenuItem>
          <DropdownMenuItem>Add people</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">
            Archive project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};

export const TabsAndDialog: Story = {
  render: () => (
    <div className="flex max-w-3xl flex-col gap-6">
      <Tabs defaultValue="board" className="w-full max-w-xl">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        <TabsContent
          value="summary"
          className="rounded-md border border-border p-4"
        >
          Project overview and status summary.
        </TabsContent>
        <TabsContent
          value="board"
          className="rounded-md border border-border p-4"
        >
          Kanban board work surface.
        </TabsContent>
        <TabsContent
          value="list"
          className="rounded-md border border-border p-4"
        >
          Dense table view for repeated work.
        </TabsContent>
      </Tabs>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove project member?</DialogTitle>
            <DialogDescription>
              This mirrors the compact confirmation dialogs used for project
              member workflows.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button variant="destructive">Remove member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
};
