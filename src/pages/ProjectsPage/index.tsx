import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleGuard, useAuth } from "@/features/auth";
import {
  ProjectForm,
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
  type Project,
} from "@/features/projects";
import type { ProjectFormData } from "@/features/projects/ui/ProjectForm/ProjectForm";
import { useUrlParams } from "@/shared/hooks/useUrlParams";
import { FolderKanban, Search, Star, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSpaceAvatar } from "@/features/projects/model/avatars";

export default function ProjectsPage() {
  const { getParam, setParams } = useUrlParams();
  const { user } = useAuth();

  const initialPage = Number(getParam("page", "1"));
  const initialStatus = getParam("status", "all");

  const [page, setPage] = useState(initialPage);
  const [status, setStatus] = useState(initialStatus);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const createMutation = useCreateProject();

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null,
  );
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  useEffect(() => {
    setPage(Number(getParam("page", "1")));
    setStatus(getParam("status", "all"));
  }, [getParam]);

  const { data, isLoading, isError } = useProjects(page, 5, status);

  const handleFilterChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
    setParams({ status: newStatus !== "all" ? newStatus : "", page: "1" });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setParams({
      page: newPage.toString(),
      status: status !== "all" ? status : "",
    });
  };

  const handleCreateProject = (data: ProjectFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
        setPage(1);
        setParams({ page: "1" });
        toast.success("Project created successfully");
      },
      onError: () => {
        toast.error("Failed to create project");
      },
    });
  };

  const handleEditProject = (data: ProjectFormData) => {
    if (!editingProject) return;
    updateMutation.mutate(
      { id: editingProject.id, data },
      {
        onSuccess: () => {
          setEditingProject(null);
          toast.success("Project updated");
        },
        onError: () => toast.error("Failed to update project"),
      },
    );
  };

  const handleDeleteProject = () => {
    if (!deletingProjectId) return;
    deleteMutation.mutate(deletingProjectId, {
      onSuccess: () => {
        setDeletingProjectId(null);
        toast.success("Project deleted");
      },
      onError: () => toast.error("Failed to delete project"),
    });
  };

  if (isError)
    return <div className="text-red-500 py-4">Failed to load projects.</div>;

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-6 md:p-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Spaces
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="hidden md:flex">
              Templates
            </Button>
            <RoleGuard allowedRoles={["admin"]}>
              <Button onClick={() => setIsModalOpen(true)}>Create space</Button>
            </RoleGuard>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search spaces"
              className="pl-9 bg-background border-border"
            />
          </div>
          <Select value={status} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-48 bg-background">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border bg-card text-card-foreground overflow-hidden">
          <table className="w-full text-sm text-left table-fixed">
            <thead className="bg-muted border-b">
              <tr>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-[13px] w-[5%]">
                  <Star className="h-4 w-4 text-muted-foreground" />
                </th>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-[13px] w-[25%]">
                  Name &darr;
                </th>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-[13px] w-[10%]">
                  Key
                </th>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-[13px] w-[20%]">
                  Type
                </th>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-[13px] w-[25%]">
                  Lead
                </th>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-[13px] w-[15%] text-right">
                  Space URL
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-3 align-middle">
                      <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                    </td>
                    <td className="p-3 align-middle">
                      <div className="h-5 w-48 bg-muted animate-pulse rounded" />
                    </td>
                    <td className="p-3 align-middle">
                      <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                    </td>
                    <td className="p-3 align-middle">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    </td>
                    <td className="p-3 align-middle">
                      <div className="h-6 w-32 bg-muted animate-pulse rounded-full" />
                    </td>
                    <td className="p-3 align-middle text-right">
                      <div className="h-4 w-8 bg-muted animate-pulse rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-0">
                    <EmptyState
                      icon={FolderKanban}
                      title="No projects found"
                      description={
                        status !== "all"
                          ? `No projects with status "${status}". Try changing the filter.`
                          : "Get started by creating your first project."
                      }
                      action={
                        <RoleGuard allowedRoles={["admin"]}>
                          <Button
                            size="sm"
                            onClick={() => setIsModalOpen(true)}
                          >
                            Create Project
                          </Button>
                        </RoleGuard>
                      }
                    />
                  </td>
                </tr>
              ) : (
                data?.data.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3 px-4 align-middle">
                      <Star className="h-4 w-4 text-muted-foreground hover:text-yellow-400 cursor-pointer transition-colors" />
                    </td>
                    <td className="p-3 px-4 align-middle">
                      <div className="flex items-center gap-3">
                        <Link to={`/projects/${project.id}`}>
                          {(() => {
                            const currentAvatar = getSpaceAvatar(
                              project.avatar,
                            );
                            const Icon = currentAvatar.icon;
                            return (
                              <div
                                className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${currentAvatar.bg} ${currentAvatar.text}`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                            );
                          })()}
                        </Link>
                        <Link
                          to={`/projects/${project.id}`}
                          className="text-[13.5px] font-medium text-primary hover:underline"
                        >
                          {project.name}
                        </Link>
                      </div>
                    </td>
                    <td className="p-3 px-4 align-middle">
                      <span className="text-[13px] text-foreground">
                        {project.key}
                      </span>
                    </td>
                    <td className="p-3 px-4 align-middle">
                      <span className="text-[13px] text-foreground whitespace-nowrap">
                        {project.status === "active"
                          ? "Team-managed software"
                          : "Company-managed software"}
                      </span>
                    </td>
                    <td className="p-3 px-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}&backgroundColor=10b981&textColor=ffffff&backgroundType=solid`}
                            alt={user?.name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-[10px]">
                            {user?.name?.substring(0, 2).toUpperCase() || "UN"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[13px] text-foreground">
                          {user?.name || "Unassigned"}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 px-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-accent"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) handlePageChange(page - 1);
                  }}
                />
              </PaginationItem>

              {Array.from({ length: data.totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={page === i + 1}
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(i + 1);
                    }}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < data.totalPages) handlePageChange(page + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <ProjectForm
              onSubmit={handleCreateProject}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!editingProject}
          onOpenChange={() => setEditingProject(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>
            <ProjectForm
              initialData={editingProject ?? undefined}
              onSubmit={handleEditProject}
              isLoading={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={!!deletingProjectId}
          onOpenChange={() => setDeletingProjectId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All tasks in this project will
                also be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteProject}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
