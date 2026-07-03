import {
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
  Pencil,
} from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProject, useUpdateProject } from "@/features/projects";
import { BoardToolbar, KanbanBoard, ListView } from "@/features/tasks";
import {
  SPACE_AVATARS,
  getSpaceAvatar,
} from "@/features/projects/model/avatars";
import { ProjectActionsMenu } from "./ProjectActionsMenu";

type GroupBy = "None" | "Assignee" | "Epic" | "Subtask";

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
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, isError } = useProject(id || "");
  const updateProject = useUpdateProject();

  const [activeTab, setActiveTab] = useState("board");

  const boardFilters = useFilters();
  const listFilters = useFilters();

  const currentFilters = activeTab === "list" ? listFilters : boardFilters;

  const [listLayout, setListLayout] = useState<"table" | "split">("table");

  if (isLoading)
    return (
      <div className="p-10 text-center text-zinc-500">
        Loading project details...
      </div>
    );
  if (isError || !project)
    return (
      <div className="p-10 text-center text-red-500">Project not found</div>
    );

  const toolbarNode =
    activeTab === "board" || activeTab === "list" ? (
      <div className="px-6 py-2 border-b border-border bg-background shrink-0">
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
      <div className="flex flex-col border-b border-border bg-background pt-4 pb-2 px-6 shrink-0 gap-4">
        {/* Top: Breadcrumb */}
        <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
          Spaces
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative group p-0 m-0 border-none bg-transparent cursor-pointer focus:outline-none">
                  {(() => {
                    const currentAvatar = getSpaceAvatar(project.avatar);
                    const Icon = currentAvatar.icon;
                    return (
                      <div
                        className={`p-1.5 rounded-md shadow-sm ${currentAvatar.bg} ${currentAvatar.text}`}
                      >
                        <Icon className="w-7 h-7 group-hover:opacity-10 transition-opacity" />
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
            <h1 className="text-xl font-bold text-foreground m-0 flex items-center gap-2">
              {project.name}
              <Badge
                variant="secondary"
                className="font-normal text-xs px-2 py-0.5 h-6 flex items-center gap-1 bg-muted/50 hover:bg-muted/80 ml-2"
              >
                <Users className="w-3 h-3" />
                22
              </Badge>
            </h1>
            <ProjectActionsMenu project={project} />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-muted-foreground border-muted rounded-md hover:text-foreground hover:border-muted-foreground transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-muted-foreground border-muted rounded-md hover:text-foreground hover:border-muted-foreground transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Row 3: Tabs */}
        <div className="flex items-center mt-2">
          <TabsList className="h-9 bg-transparent gap-2 justify-start overflow-x-auto overflow-y-hidden w-full border-b border-transparent [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-1 -ml-1 py-1 -my-1">
            <TabsTrigger
              value="summary"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-9 flex-none px-2.5 gap-2 text-muted-foreground data-[state=active]:text-foreground font-medium transition-none"
            >
              <Globe className="w-4 h-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="board"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-9 flex-none px-2.5 gap-2 text-muted-foreground data-[state=active]:text-foreground font-medium transition-none"
            >
              <KanbanSquare className="w-4 h-4" />
              Board
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-9 flex-none px-2.5 gap-2 text-muted-foreground data-[state=active]:text-foreground font-medium transition-none"
            >
              <List className="w-4 h-4" />
              List
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-9 flex-none px-2.5 gap-2 text-muted-foreground data-[state=active]:text-foreground font-medium transition-none"
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-9 flex-none px-2.5 gap-2 text-muted-foreground data-[state=active]:text-foreground font-medium transition-none"
            >
              <GanttChart className="w-4 h-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger
              value="docs"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-9 flex-none px-2.5 gap-2 text-muted-foreground data-[state=active]:text-foreground font-medium transition-none"
            >
              <FileText className="w-4 h-4" />
              Docs
            </TabsTrigger>
            <TabsTrigger
              value="forms"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-9 flex-none px-2.5 gap-2 text-muted-foreground data-[state=active]:text-foreground font-medium transition-none"
            >
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
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
