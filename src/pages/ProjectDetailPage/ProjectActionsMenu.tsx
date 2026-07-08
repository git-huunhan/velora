import { useState } from "react";
import { Archive, Copy, MoreHorizontal } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useArchiveProject, type Project } from "@/features/projects";

export function ProjectActionsMenu({ project }: { project: Project }) {
  const navigate = useNavigate();
  const archiveProject = useArchiveProject();
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

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
            disabled={archiveProject.isPending}
            onSelect={() => setIsArchiveOpen(true)}
          >
            <Archive /> Archive project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
