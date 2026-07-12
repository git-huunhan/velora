import {
  ChevronDown,
  MoreHorizontal,
  Search,
  User as UserIcon,
  Layers,
  Table,
  PanelLeft,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  getUserAvatarUrl,
  getUserInitials,
} from "@/features/auth/model/userAvatar";
import { useUsers } from "@/features/users";
import { useState } from "react";
import type { FilterCategory } from "./AdvancedFilterPopover";
import { AdvancedFilterPopover } from "./AdvancedFilterPopover";
import { ViewSettingsPopover } from "./ViewSettingsPopover";
import { BoardInsightsPopover } from "./BoardInsightsPopover";

interface BoardToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  parentIds: string[];
  setParentIds: (val: string[]) => void;
  assigneeIds: string[];
  setAssigneeIds: (val: string[]) => void;
  priorities: string[];
  setPriorities: (val: string[]) => void;
  statuses: string[];
  setStatuses: (val: string[]) => void;
  workTypes: string[];
  setWorkTypes: (val: string[]) => void;
  labels: string[];
  setLabels: (val: string[]) => void;
  activeView?: "board" | "list";
  onViewChange?: (view: "board" | "list") => void;
  groupBy: "None" | "Assignee" | "Epic" | "Subtask";
  setGroupBy: (val: "None" | "Assignee" | "Epic" | "Subtask") => void;
  listLayout?: "table" | "split";
  onListLayoutChange?: (val: "table" | "split") => void;
  projectMemberIds?: string[];
}

export function BoardToolbar({
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
  activeView = "board",
  groupBy,
  setGroupBy,
  listLayout = "table",
  onListLayoutChange,
  projectMemberIds = [],
}: BoardToolbarProps) {
  const { users } = useUsers();
  const projectMemberIdSet = new Set(projectMemberIds);
  const selectableUsers =
    projectMemberIdSet.size > 0
      ? users.filter((user) => projectMemberIdSet.has(user.id))
      : users;
  const [categoriesOrder, setCategoriesOrder] = useState<FilterCategory[]>([
    "Parent",
    "Assignee",
    "Status",
    "Priority",
    "Work type",
    "Labels",
  ]);
  const [pinnedCategories, setPinnedCategories] = useState<FilterCategory[]>(
    [],
  );

  const toggleAssignee = (id: string) => {
    if (assigneeIds.includes(id)) {
      setAssigneeIds(assigneeIds.filter((x) => x !== id));
    } else {
      setAssigneeIds([...assigneeIds, id]);
    }
  };

  const activeFilterCount =
    parentIds.length +
    assigneeIds.length +
    statuses.length +
    priorities.length +
    workTypes.length +
    labels.length;

  const handleClearAll = () => {
    setParentIds([]);
    setAssigneeIds([]);
    setStatuses([]);
    setPriorities([]);
    setWorkTypes([]);
    setLabels([]);
  };

  return (
    <div className="flex items-center justify-between min-h-[40px] pb-1 mt-1 shrink-0">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 pl-8 h-8 bg-transparent text-sm border-input hover:border-border focus-visible:ring-1 focus-visible:ring-primary/30 transition-colors"
          />
        </div>

        {/* Assignee Avatars */}
        <div className="flex -space-x-2">
          {/* Unassigned Option */}
          <div
            title="Unassigned"
            className={`h-8 w-8 rounded-full border-2 cursor-pointer hover:-translate-y-0.5 transition-all flex items-center justify-center shrink-0 hover:z-10 ${
              assigneeIds.includes("unassigned")
                ? "border-background ring-2 ring-primary bg-muted/50 z-10"
                : "border-dashed border-border/40 bg-muted/20"
            }`}
            onClick={() => toggleAssignee("unassigned")}
          >
            <UserIcon className="w-4 h-4 text-muted-foreground/80" />
          </div>
          {selectableUsers.slice(0, 5).map((user) => {
            const isActive = assigneeIds.includes(user.id);
            return (
              <Avatar
                key={user.id}
                className={`h-8 w-8 border-2 border-background cursor-pointer hover:-translate-y-0.5 transition-all hover:z-10 ${
                  isActive ? "ring-2 ring-primary z-10" : ""
                }`}
                onClick={() => toggleAssignee(user.id)}
                title={user.name}
              >
                <AvatarImage src={getUserAvatarUrl(user)} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            );
          })}
        </div>

        {/* Filters Popover */}
        <AdvancedFilterPopover
          categoriesOrder={categoriesOrder}
          setCategoriesOrder={setCategoriesOrder}
          pinnedCategories={pinnedCategories}
          setPinnedCategories={setPinnedCategories}
          parentIds={parentIds}
          setParentIds={setParentIds}
          assigneeIds={assigneeIds}
          setAssigneeIds={setAssigneeIds}
          statuses={statuses}
          setStatuses={setStatuses}
          priorities={priorities}
          setPriorities={setPriorities}
          workTypes={workTypes}
          setWorkTypes={setWorkTypes}
          labels={labels}
          setLabels={setLabels}
          users={selectableUsers}
        />

        {/* Group By (List View only) */}
        {activeView === "list" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 gap-1.5 transition-colors aria-expanded:bg-primary/10 aria-expanded:text-primary aria-expanded:!border-primary aria-expanded:hover:bg-primary/20 aria-expanded:hover:text-primary ${
                  groupBy !== "None"
                    ? "bg-primary/10 text-primary !border-primary hover:bg-primary/20 hover:text-primary"
                    : "bg-transparent border-input text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Layers className="w-4 h-4 opacity-70" />
                Group{groupBy !== "None" && `: ${groupBy}`}
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {(["None", "Assignee", "Epic", "Subtask"] as const).map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => setGroupBy(opt)}
                  className={`cursor-pointer ${groupBy === opt ? "bg-muted font-medium" : ""}`}
                >
                  {opt}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Clear Filters */}
        {(activeFilterCount > 0 || searchQuery.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-8 text-primary font-normal hover:bg-primary/10 hover:text-primary transition-colors px-2"
          >
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {activeView === "board" ? (
          <>
            {/* Group By (Board View only) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 gap-1.5 transition-colors aria-expanded:bg-primary/10 aria-expanded:text-primary aria-expanded:!border-primary aria-expanded:hover:bg-primary/20 aria-expanded:hover:text-primary ${
                    groupBy !== "None"
                      ? "bg-primary/10 text-primary !border-primary hover:bg-primary/20 hover:text-primary"
                      : "bg-transparent border-input text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  Group{groupBy !== "None" && `: ${groupBy}`}
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {(["None", "Assignee", "Epic", "Subtask"] as const).map(
                  (opt) => (
                    <DropdownMenuItem
                      key={opt}
                      onClick={() => setGroupBy(opt)}
                      className={`cursor-pointer ${groupBy === opt ? "bg-muted font-medium" : ""}`}
                    >
                      {opt}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <BoardInsightsPopover />
            <ViewSettingsPopover groupBy={groupBy} />
          </>
        ) : (
          <div className="flex items-center -space-x-px">
            <Button
              variant="outline"
              size="icon"
              className={`h-8 w-8 rounded-r-none ${
                listLayout === "table"
                  ? "bg-primary/10 text-primary !border-primary hover:bg-primary/20 hover:text-primary z-10"
                  : "bg-transparent border-input text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted z-0"
              }`}
              onClick={() => onListLayoutChange?.("table")}
            >
              <Table className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`h-8 w-8 rounded-l-none ${
                listLayout === "split"
                  ? "bg-primary/10 text-primary !border-primary hover:bg-primary/20 hover:text-primary z-10"
                  : "bg-transparent border-input text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted z-0"
              }`}
              onClick={() => onListLayoutChange?.("split")}
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 text-muted-foreground border-input rounded-md hover:text-foreground hover:border-border"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
