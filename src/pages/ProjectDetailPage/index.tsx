import {
  AlertCircle,
  Calendar,
  ClipboardList,
  FileText,
  GanttChart,
  Globe,
  KanbanSquare,
  List,
  Maximize2,
  Plus,
  Share2,
  Users,
  UserMinus,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getUserAvatarUrl,
  getUserInitials,
} from "@/features/auth/model/userAvatar";
import {
  useProject,
  useRemoveProjectMember,
  useUpdateProject,
} from "@/features/projects";
import { BoardToolbar, KanbanBoard, ListView } from "@/features/tasks";
import {
  SPACE_AVATARS,
  getSpaceAvatar,
} from "@/features/projects/model/avatars";
import { ProjectActionsMenu } from "./ProjectActionsMenu";

type GroupBy = "None" | "Assignee" | "Epic" | "Subtask";

const projectTabTriggerClass =
  "relative -mb-px !h-9 !flex-none gap-2 !rounded-b-none rounded-t-md border border-transparent border-b-transparent px-3 text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground data-[state=active]:z-10 data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:!text-primary data-[state=active]:[&_svg]:!text-primary data-active:!text-primary data-active:[&_svg]:!text-primary dark:data-[state=active]:border-border/70 dark:data-[state=active]:border-b-background";

function useFilters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [parentIds, setParentIds] = useState<string[]>([]);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<GroupBy>("None");

  return {
    searchQuery,
    setSearchQuery,
    parentIds,
    setParentIds,
    assigneeIds,
    setAssigneeIds,
    priorities,
    setPriorities,
    statuses,
    setStatuses,
    workTypes,
    setWorkTypes,
    labels,
    setLabels,
    groupBy,
    setGroupBy,
  };
}

export default function ProjectDetailPage() {
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeTaskId = searchParams.get("task");
  const clearRouteTaskId = () => {
    if (!routeTaskId) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("task");
    setSearchParams(nextParams, { replace: true });
  };
  const { data: project, isLoading, isError } = useProject(id || "");
  const updateProject = useUpdateProject();
  const removeProjectMember = useRemoveProjectMember();

  const [activeTab, setActiveTab] = useState("board");

  const boardFilters = useFilters();
  const listFilters = useFilters();

  const currentFilters = activeTab === "list" ? listFilters : boardFilters;

  const [listLayout, setListLayout] = useState<"table" | "split">("table");

  const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 } as const;
  const sortedProjectMembers = [...(project?.members ?? [])].sort(
    (a, b) =>
      roleOrder[a.role] - roleOrder[b.role] || a.name.localeCompare(b.name),
  );

  if (isLoading)
    return (
      <div className="flex h-full flex-col bg-background p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
          <div className="h-6 w-44 animate-pulse rounded bg-muted" />
        </div>
        <div className="mb-4 h-9 w-full max-w-xl animate-pulse rounded bg-muted" />
        <div className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="min-h-80 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      </div>
    );

  if (isError || !project)
    return (
      <div className="flex h-full items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-lg border bg-card text-card-foreground">
          <EmptyState
            icon={AlertCircle}
            title="Project not found"
            description="The project could not be loaded. It may have been archived, removed, or your session may need to be refreshed."
            action={
              <Button size="sm" onClick={() => window.location.reload()}>
                Try again
              </Button>
            }
          />
        </div>
      </div>
    );

  const toolbarNode =
    activeTab === "board" || activeTab === "list" ? (
      <div className="px-6 py-2 bg-background shrink-0">
        <div className="overflow-hidden w-full flex-1">
          <BoardToolbar
            searchQuery={currentFilters.searchQuery}
            setSearchQuery={currentFilters.setSearchQuery}
            parentIds={currentFilters.parentIds}
            setParentIds={currentFilters.setParentIds}
            assigneeIds={currentFilters.assigneeIds}
            setAssigneeIds={currentFilters.setAssigneeIds}
            priorities={currentFilters.priorities}
            setPriorities={currentFilters.setPriorities}
            statuses={currentFilters.statuses}
            setStatuses={currentFilters.setStatuses}
            workTypes={currentFilters.workTypes}
            setWorkTypes={currentFilters.setWorkTypes}
            labels={currentFilters.labels}
            setLabels={currentFilters.setLabels}
            activeView={activeTab === "list" ? "list" : "board"}
            onViewChange={(view) => setActiveTab(view)}
            groupBy={currentFilters.groupBy}
            setGroupBy={currentFilters.setGroupBy}
            listLayout={listLayout}
            onListLayoutChange={setListLayout}
            projectMemberIds={project.memberIds}
          />
        </div>
      </div>
    ) : null;

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex flex-col h-full w-full bg-background overflow-hidden gap-0"
    >
      <div className="flex flex-col border-b border-border bg-background pt-3 pb-0 px-6 shrink-0 gap-2.5">
        {/* Top: Breadcrumb */}
        <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
          Spaces
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative group p-0 m-0 border-none bg-transparent cursor-pointer focus:outline-none">
                  {(() => {
                    const currentAvatar = getSpaceAvatar(project.avatar);
                    const Icon = currentAvatar.icon;
                    return (
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-md shadow-sm ${currentAvatar.bg} ${currentAvatar.text}`}
                      >
                        <Icon className="w-5 h-5 group-hover:opacity-10 transition-opacity" />
                      </div>
                    );
                  })()}
                  <div className="absolute inset-0 bg-black/40 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Pencil className="w-4 h-4 text-white" />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[340px] p-4 bg-popover border-border shadow-xl rounded-xl"
                align="start"
              >
                <div className="font-semibold text-[13.5px] mb-3 text-foreground">
                  Choose an avatar
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {SPACE_AVATARS.map((opt) => {
                    const OptionIcon = opt.icon;
                    return (
                      <PopoverClose key={opt.id} asChild>
                        <button
                          onClick={() => {
                            updateProject.mutate({
                              id: project.id,
                              data: { avatar: opt.id },
                            });
                          }}
                          className={`flex items-center justify-center aspect-square rounded cursor-pointer transition-all hover:ring-2 hover:ring-offset-2 hover:ring-offset-popover hover:ring-primary/50 focus:outline-none ${opt.bg} ${opt.text}`}
                        >
                          <OptionIcon className="w-6 h-6" />
                        </button>
                      </PopoverClose>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="border border-dashed border-border/80 rounded-md py-4 px-2 flex flex-col items-center justify-center text-center bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors group">
                    <span className="text-[13px] font-medium text-blue-500 hover:underline">
                      Select an image to upload
                    </span>
                    <span className="text-[12px] text-muted-foreground mt-0.5">
                      or drag and drop it here
                    </span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <h1 className="text-xl font-bold text-foreground m-0 flex items-center gap-2 leading-none">
              {project.name}
            </h1>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-md border-input px-2 text-muted-foreground hover:border-border hover:text-foreground"
              onClick={() => setIsMembersOpen(true)}
              aria-label="View project members"
            >
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium tabular-nums">
                {project.memberIds.length}
              </span>
            </Button>
            <ProjectActionsMenu project={project} />
            <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
              <DialogContent className="top-[96px] translate-y-0 sm:max-w-sm p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-4 py-3 border-b text-left">
                  <DialogTitle className="text-sm">Project members</DialogTitle>
                  <DialogDescription className="text-xs">
                    {project.name} has {project.memberIds.length} members.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
                  {sortedProjectMembers.map((member) => {
                    const canRemoveMember = member.role !== "owner";

                    return (
                      <div
                        key={member.userId}
                        className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
                      >
                        <Avatar className="h-8 w-8 border border-border/50">
                          <AvatarImage src={getUserAvatarUrl(member)} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {getUserInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
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
                            disabled={removeProjectMember.isPending}
                            aria-label={`Remove ${member.name} from project`}
                            onClick={() => {
                              removeProjectMember.mutate(
                                {
                                  projectId: project.id,
                                  userId: member.userId,
                                },
                                {
                                  onSuccess: () => {
                                    toast.success("Member removed");
                                  },
                                  onError: () => {
                                    toast.error("Failed to remove member");
                                  },
                                },
                              );
                            }}
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
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-muted-foreground border-input rounded-md hover:text-foreground hover:border-border transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-muted-foreground border-input rounded-md hover:text-foreground hover:border-border transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Row 3: Tabs */}
        <div className="flex items-end mt-0">
          <TabsList className="h-9 w-full justify-start gap-0 overflow-x-auto overflow-y-hidden bg-transparent !p-0 !rounded-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <TabsTrigger value="summary" className={projectTabTriggerClass}>
              <Globe className="w-4 h-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="board" className={projectTabTriggerClass}>
              <KanbanSquare className="w-4 h-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="list" className={projectTabTriggerClass}>
              <List className="w-4 h-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className={projectTabTriggerClass}>
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="timeline" className={projectTabTriggerClass}>
              <GanttChart className="w-4 h-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="docs" className={projectTabTriggerClass}>
              <FileText className="w-4 h-4" />
              Docs
            </TabsTrigger>
            <TabsTrigger value="forms" className={projectTabTriggerClass}>
              <ClipboardList className="w-4 h-4" />
              Forms
            </TabsTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-none text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </TabsList>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <TabsContent
          value="summary"
          className="h-full overflow-y-auto px-6 md:px-8 pb-6 md:pb-8 pt-6 m-0"
        >
          <div className="bg-card text-card-foreground p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <p className="text-muted-foreground mb-6">{project.description}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">
                  Timeline
                </span>
                <span className="text-sm">
                  {project.startDate} to {project.endDate}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">
                  Team Size
                </span>
                <span className="text-sm">
                  {project.memberIds.length} members
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="list"
          className="h-full m-0 p-0 flex flex-col data-[state=active]:flex"
        >
          <ListView
            projectId={project.id}
            searchQuery={listFilters.searchQuery}
            parentIds={listFilters.parentIds}
            assigneeIds={listFilters.assigneeIds}
            priorities={listFilters.priorities}
            statuses={listFilters.statuses}
            workTypes={listFilters.workTypes}
            labels={listFilters.labels}
            layout={listLayout}
            headerSlot={toolbarNode}
            initialTaskId={routeTaskId}
            onInitialTaskOpen={clearRouteTaskId}
          />
        </TabsContent>

        <TabsContent
          value="board"
          className="h-full m-0 p-0 flex flex-col data-[state=active]:flex pt-0"
        >
          <KanbanBoard
            projectId={project.id}
            searchQuery={boardFilters.searchQuery}
            parentIds={boardFilters.parentIds}
            assigneeIds={boardFilters.assigneeIds}
            priorities={boardFilters.priorities}
            statuses={boardFilters.statuses}
            workTypes={boardFilters.workTypes}
            labels={boardFilters.labels}
            groupBy={boardFilters.groupBy}
            headerSlot={toolbarNode}
            initialTaskId={routeTaskId}
            onInitialTaskOpen={clearRouteTaskId}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
