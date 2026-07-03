import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ListFilter,
  MoreHorizontal,
  Pin,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useTasksByProject } from "../../model/useTasks";
import { FilterCategoryOptions } from "./FilterCategoryOptions";

export type FilterCategory =
  | "Parent"
  | "Assignee"
  | "Status"
  | "Priority"
  | "Work type"
  | "Labels";

interface AdvancedFilterPopoverProps {
  categoriesOrder: FilterCategory[];
  setCategoriesOrder: (val: FilterCategory[]) => void;
  pinnedCategories: FilterCategory[];
  setPinnedCategories: (val: FilterCategory[]) => void;
  parentIds: string[];
  setParentIds: (val: string[]) => void;
  assigneeIds: string[];
  setAssigneeIds: (val: string[]) => void;
  statuses: string[];
  setStatuses: (val: string[]) => void;
  priorities: string[];
  setPriorities: (val: string[]) => void;
  workTypes: string[];
  setWorkTypes: (val: string[]) => void;
  labels: string[];
  setLabels: (val: string[]) => void;
}

function SortableCategoryItem({
  cat,
  isActive,
  count,
  isPinned,
  onSelect,
  onTogglePin,
}: {
  cat: FilterCategory;
  isActive: boolean;
  count: number;
  isPinned: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: cat });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between pl-1 pr-3 py-1.5 text-[13px] rounded-sm mb-0.5 transition-colors cursor-pointer ${
        isActive
          ? "bg-primary/15 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/80 hover:text-foreground px-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        <span className="select-none">{cat}</span>
      </div>
      <div className="flex items-center h-5">
        {count > 0 && (
          <div className="h-5 min-w-7 px-2 flex items-center justify-center text-[13px] font-bold rounded-sm group-hover:hidden bg-primary text-primary-foreground">
            {count}
          </div>
        )}

        <div className="hidden group-hover:flex items-center gap-1">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className={`h-7 w-7 flex items-center justify-center transition-colors rounded-sm cursor-pointer ${isPinned ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/20"}`}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? "fill-primary" : ""}`} />
          </div>
          <div className="h-7 w-7 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground hover:bg-muted-foreground/20 rounded-sm cursor-pointer">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdvancedFilterPopover({
  categoriesOrder,
  setCategoriesOrder,
  pinnedCategories,
  setPinnedCategories,
  parentIds,
  setParentIds,
  assigneeIds,
  setAssigneeIds,
  statuses,
  setStatuses,
  priorities,
  setPriorities,
  workTypes,
  setWorkTypes,
  labels,
  setLabels,
}: AdvancedFilterPopoverProps) {
  const { id } = useParams<{ id: string }>();
  const { data: tasks = [] } = useTasksByProject(id || "");

  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>(
    categoriesOrder[0] || "Assignee",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const displayOrder = useMemo(() => {
    const pinned = categoriesOrder.filter((c) => pinnedCategories.includes(c));
    const unpinned = categoriesOrder.filter(
      (c) => !pinnedCategories.includes(c),
    );
    return [...pinned, ...unpinned];
  }, [categoriesOrder, pinnedCategories]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = displayOrder.indexOf(active.id as FilterCategory);
      const newIndex = displayOrder.indexOf(over.id as FilterCategory);
      setCategoriesOrder(arrayMove(displayOrder, oldIndex, newIndex));
    }
  };

  const availableLabels = useMemo(() => {
    const allLabels = tasks.flatMap((t) => t.labels || []);
    return Array.from(new Set(allLabels)).sort();
  }, [tasks]);

  const parentTasks = useMemo(() => {
    // Tasks that are Epics, or tasks that have children
    return tasks.filter(
      (t) =>
        t.type === "epic" || tasks.some((child) => child.parentId === t.id),
    );
  }, [tasks]);

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

  const handleClearCurrent = () => {
    switch (activeCategory) {
      case "Parent":
        setParentIds([]);
        break;
      case "Assignee":
        setAssigneeIds([]);
        break;
      case "Status":
        setStatuses([]);
        break;
      case "Priority":
        setPriorities([]);
        break;
      case "Work type":
        setWorkTypes([]);
        break;
      case "Labels":
        setLabels([]);
        break;
    }
  };

  const currentSelectionCount = () => {
    switch (activeCategory) {
      case "Parent":
        return parentIds.length;
      case "Assignee":
        return assigneeIds.length;
      case "Status":
        return statuses.length;
      case "Priority":
        return priorities.length;
      case "Work type":
        return workTypes.length;
      case "Labels":
        return labels.length;
      default:
        return 0;
    }
  };

  const getCategoryCount = (cat: FilterCategory) => {
    switch (cat) {
      case "Parent":
        return parentIds.length;
      case "Assignee":
        return assigneeIds.length;
      case "Status":
        return statuses.length;
      case "Priority":
        return priorities.length;
      case "Work type":
        return workTypes.length;
      case "Labels":
        return labels.length;
      default:
        return 0;
    }
  };

  const totalOptionsCount = () => {
    switch (activeCategory) {
      case "Parent":
        return parentTasks.length + 1; // + No parent
      case "Assignee":
        return 5 + 1; // mockUsers.length + Unassigned, but we don't have mockUsers here, just hardcoded 6 for now or omit it
      case "Status":
        return 4;
      case "Priority":
        return 3;
      case "Work type":
        return 3;
      case "Labels":
        return availableLabels.length;
      default:
        return 0;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 gap-1.5 transition-colors aria-expanded:bg-primary/10 aria-expanded:text-primary aria-expanded:!border-primary aria-expanded:hover:bg-primary/20 aria-expanded:hover:text-primary ${
            activeFilterCount > 0
              ? "bg-primary/10 text-primary !border-primary hover:bg-primary/20 hover:text-primary"
              : "bg-transparent border-muted text-muted-foreground hover:text-foreground hover:border-muted-foreground"
          }`}
        >
          <ListFilter className="w-4 h-4 opacity-70" />
          Filter
          {activeFilterCount > 0 && (
            <div className="h-5 min-w-7 px-2 ml-1 flex items-center justify-center text-[13px] font-bold rounded-sm bg-primary text-primary-foreground">
              {activeFilterCount}
            </div>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[520px] p-0 flex flex-col shadow-xl"
        align="start"
      >
        <div className="flex h-[360px]">
          {/* Left Panel: Categories */}
          <div className="w-[200px] border-r bg-muted/20 flex flex-col p-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayOrder}
                strategy={verticalListSortingStrategy}
              >
                {displayOrder.flatMap((cat, index) => {
                  const isLastPinned =
                    pinnedCategories.length > 0 &&
                    pinnedCategories.includes(cat) &&
                    index === pinnedCategories.length - 1 &&
                    index < displayOrder.length - 1;

                  const item = (
                    <SortableCategoryItem
                      key={cat}
                      cat={cat}
                      isActive={activeCategory === cat}
                      count={getCategoryCount(cat)}
                      isPinned={pinnedCategories.includes(cat)}
                      onSelect={() => {
                        setActiveCategory(cat);
                        setSearchQuery("");
                      }}
                      onTogglePin={() => {
                        if (pinnedCategories.includes(cat)) {
                          setPinnedCategories(
                            pinnedCategories.filter((c) => c !== cat),
                          );
                        } else {
                          setPinnedCategories([...pinnedCategories, cat]);
                        }
                      }}
                    />
                  );

                  if (isLastPinned) {
                    return [
                      item,
                      <div
                        key="divider"
                        className="h-px bg-border/60 my-1 mx-2"
                      />,
                    ];
                  }
                  return [item];
                })}
              </SortableContext>
            </DndContext>

            <Button
              variant="ghost"
              className="justify-start gap-2 h-8 px-3 mt-1 text-xs font-normal text-muted-foreground w-fit ml-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add field
            </Button>

            <div className="mt-auto px-3 pb-2 pt-4">
              <span
                onClick={handleClearAll}
                className={`text-xs cursor-pointer hover:underline ${activeFilterCount > 0 ? "text-foreground" : "text-muted-foreground opacity-50 pointer-events-none"}`}
              >
                Clear all
              </span>
            </div>
          </div>

          {/* Right Panel: Options */}
          <div className="flex-1 flex flex-col p-4 bg-background">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeCategory.toLowerCase()}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            <div className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar">
              <FilterCategoryOptions
                activeCategory={activeCategory}
                searchQuery={searchQuery}
                parentTasks={parentTasks}
                availableLabels={availableLabels}
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
              />
            </div>

            <div className="flex items-center justify-between pt-4 mt-2 border-t">
              <span
                onClick={handleClearCurrent}
                className={`text-xs cursor-pointer hover:underline ${currentSelectionCount() > 0 ? "text-foreground" : "text-muted-foreground opacity-50 pointer-events-none"}`}
              >
                Clear
              </span>
              <span className="text-xs text-muted-foreground">
                {currentSelectionCount()} of {totalOptionsCount()}
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
