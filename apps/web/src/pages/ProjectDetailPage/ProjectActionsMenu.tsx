import { useMemo, useState } from "react";
import { Archive, Copy, MoreHorizontal, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getUserAvatarUrl,
  getUserInitials,
} from "@/features/auth/model/userAvatar";
import {
  useAddProjectMember,
  useArchiveProject,
  type Project,
  type ProjectCapabilities,
} from "@/features/projects";
import { useUsers } from "@/features/users";

export function ProjectActionsMenu({
  capabilities,
  project,
}: {
  capabilities?: ProjectCapabilities;
  project: Project;
}) {
  const navigate = useNavigate();
  const archiveProject = useArchiveProject();
  const addProjectMember = useAddProjectMember();
  const { users } = useUsers();
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const memberIdSet = useMemo(
    () => new Set(project.memberIds),
    [project.memberIds],
  );
  const availableUsers = useMemo(
    () => users.filter((user) => !memberIdSet.has(user.id)),
    [memberIdSet, users],
  );

  const canManageMembers = Boolean(capabilities?.canManageMembers);
  const canDeleteProject = Boolean(capabilities?.canDeleteProject);

  const copyProjectLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Project link copied");
    } catch {
      toast.error("Could not copy project link");
    }
  };

  const confirmArchive = () => {
    archiveProject.mutate(project.id, {
      onSuccess: () => {
        toast.success("Project archived");
        navigate("/projects");
      },
      onError: () => toast.error("Failed to archive project"),
    });
  };

  const handleAddMember = (userId: string) => {
    addProjectMember.mutate(
      { projectId: project.id, userId },
      {
        onSuccess: () => {
          toast.success("Member added");
          setIsAddMemberOpen(false);
        },
        onError: () => toast.error("Failed to add member"),
      },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${project.name}`}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" className="w-52">
          <DropdownMenuItem onSelect={copyProjectLink}>
            <Copy /> Copy project link
          </DropdownMenuItem>
          {canManageMembers ? (
            <DropdownMenuItem onSelect={() => setIsAddMemberOpen(true)}>
              <UserPlus /> Add member
            </DropdownMenuItem>
          ) : null}
          {canDeleteProject ? (
            <DropdownMenuItem
              disabled={archiveProject.isPending}
              onSelect={() => setIsArchiveOpen(true)}
            >
              <Archive /> Archive project
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="top-[96px] translate-y-0 sm:max-w-sm p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b text-left">
            <DialogTitle className="text-sm">Add member</DialogTitle>
            <DialogDescription className="text-xs">
              Add a user to {project.name}.
            </DialogDescription>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Search users..." className="h-10" />
            <CommandList className="max-h-72">
              <CommandEmpty>No users available.</CommandEmpty>
              <CommandGroup>
                {availableUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`${user.name} ${user.email}`}
                    disabled={addProjectMember.isPending}
                    onSelect={() => handleAddMember(user.id)}
                    className="gap-3 cursor-pointer"
                  >
                    <Avatar className="h-7 w-7 border border-border/50">
                      <AvatarImage src={getUserAvatarUrl(user)} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {user.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {project.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This project will move to archived projects. You can restore it
              later from the archived projects list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmArchive}
              disabled={archiveProject.isPending}
            >
              {archiveProject.isPending ? "Archiving..." : "Archive project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
