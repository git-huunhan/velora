import { useState } from "react";
import { Archive, Copy, MoreHorizontal, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDeleteProject,
  useUpdateProject,
  type Project,
} from "@/features/projects";

export function ProjectActionsMenu({ project }: { project: Project }) {
  const navigate = useNavigate();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const copyProjectLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Project link copied");
    } catch {
      toast.error("Could not copy project link");
    }
  };

  const archiveProject = () => {
    updateProject.mutate(
      { id: project.id, data: { archivedAt: new Date().toISOString() } },
      {
        onSuccess: () => {
          toast.success("Project archived");
          navigate("/projects");
        },
        onError: () => toast.error("Failed to archive project"),
      },
    );
  };

  const confirmDelete = () => {
    deleteProject.mutate(project.id, {
      onSuccess: () => {
        toast.success("Project deleted");
        navigate("/projects");
      },
      onError: () => toast.error("Failed to delete project"),
    });
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
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={copyProjectLink}>
            <Copy /> Copy project link
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={updateProject.isPending}
            onSelect={archiveProject}
          >
            <Archive /> Archive project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setIsDeleteOpen(true)}
          >
            <Trash2 /> Delete project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {project.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the project and removes it from your
              spaces. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
