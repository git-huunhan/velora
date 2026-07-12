import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getUserAvatarUrl,
  getUserInitials,
} from "@/features/auth/model/userAvatar";
import type { User } from "@/features/users";
import { Bug, ClipboardList, Crown, User as UserIcon } from "lucide-react";
import type { Task } from "../../model/types";
import { KANBAN_COLUMNS } from "../../model/types";
import type { FilterCategory } from "./AdvancedFilterPopover";

const WORK_TYPES = [
  {
    id: "epic",
    label: "Epic",
    icon: <Crown className="w-3.5 h-3.5 text-purple-500" />,
  },
  {
    id: "task",
    label: "Task",
    icon: <ClipboardList className="w-3.5 h-3.5 text-primary" />,
  },
  {
    id: "bug",
    label: "Bug",
    icon: <Bug className="w-3.5 h-3.5 text-red-500" />,
  },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; trigger: string; dot: string }
> = {
  todo: {
    label: "To Do",
    trigger:
      "bg-violet-500/15 border-violet-500/40 text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500 dark:bg-violet-400",
  },
  "in-progress": {
    label: "In Progress",
    trigger:
      "bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500 dark:bg-blue-400",
  },
  review: {
    label: "Review",
    trigger:
      "bg-yellow-500/15 border-yellow-500/40 text-yellow-700 dark:text-yellow-300",
    dot: "bg-yellow-600 dark:bg-yellow-400",
  },
  done: {
    label: "Done",
    trigger:
      "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-600 dark:bg-emerald-400",
  },
};

interface FilterCategoryOptionsProps {
  activeCategory: FilterCategory;
  searchQuery: string;
  parentTasks: Task[];
  availableLabels: string[];
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
  users: User[];
}

export function FilterCategoryOptions({
  activeCategory,
  searchQuery,
  parentTasks,
  availableLabels,
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
  users,
}: FilterCategoryOptionsProps) {
  const toggleArray = (
    val: string,
    arr: string[],
    setArr: (v: string[]) => void,
  ) => {
    if (arr.includes(val)) {
      setArr(arr.filter((x) => x !== val));
    } else {
      setArr([...arr, val]);
    }
  };

  const q = searchQuery.toLowerCase();

  if (activeCategory === "Parent") {
    const options = [
      { id: "no-parent", title: "No parent", code: "" },
      ...parentTasks.map((t) => ({ id: t.id, title: t.title, code: t.code })),
    ].filter(
      (o) =>
        o.title.toLowerCase().includes(q) || o.code.toLowerCase().includes(q),
    );

    return (
      <div className="flex flex-col gap-1 mt-2">
        {options.map((opt) => (
          <label
            key={opt.id}
            className="flex items-start gap-3 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer text-sm"
          >
            <Checkbox
              checked={parentIds.includes(opt.id)}
              onCheckedChange={() =>
                toggleArray(opt.id, parentIds, setParentIds)
              }
              className="mt-0.5"
            />
            <div className="flex flex-col">
              <span className="font-medium">{opt.title}</span>
              {opt.code && (
                <span className="text-xs text-muted-foreground">
                  {opt.code}
                </span>
              )}
            </div>
          </label>
        ))}
      </div>
    );
  }

  if (activeCategory === "Assignee") {
    const options = [
      { id: "unassigned", name: "Unassigned", avatar: "" },
      ...users.map((u) => ({
        id: u.id,
        name: u.name,
        avatar: getUserAvatarUrl(u),
      })),
    ].filter((o) => o.name.toLowerCase().includes(q));

    return (
      <div className="flex flex-col gap-1 mt-2">
        {options.map((opt) => (
          <label
            key={opt.id}
            className="flex items-center gap-3 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer text-sm"
          >
            <Checkbox
              checked={assigneeIds.includes(opt.id)}
              onCheckedChange={() =>
                toggleArray(opt.id, assigneeIds, setAssigneeIds)
              }
            />
            {opt.avatar ? (
              <Avatar className="w-5 h-5">
                <AvatarImage src={opt.avatar} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                  {getUserInitials(opt.name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-5 h-5 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center bg-muted/20 shrink-0">
                {opt.id === "unassigned" ? (
                  <UserIcon className="w-3 h-3 text-muted-foreground/60" />
                ) : (
                  <span className="text-[10px] font-semibold text-primary">
                    {getUserInitials(opt.name)}
                  </span>
                )}
              </div>
            )}
            {opt.name}
          </label>
        ))}
      </div>
    );
  }

  if (activeCategory === "Status") {
    const options = KANBAN_COLUMNS.filter((c) =>
      c.title.toLowerCase().includes(q),
    );
    return (
      <div className="flex flex-col gap-1 mt-2">
        {options.map((opt) => {
          const cfg = STATUS_CONFIG[opt.id] || STATUS_CONFIG["todo"];
          return (
            <label
              key={opt.id}
              className="flex items-center gap-3 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer text-sm"
            >
              <Checkbox
                checked={statuses.includes(opt.id)}
                onCheckedChange={() =>
                  toggleArray(opt.id, statuses, setStatuses)
                }
              />
              <div
                className={`flex items-center gap-1.5 px-2 h-5 rounded border text-[11px] font-semibold uppercase tracking-wider ${cfg.trigger}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {opt.title}
              </div>
            </label>
          );
        })}
      </div>
    );
  }

  if (activeCategory === "Priority") {
    const options = ["high", "medium", "low"].filter((p) => p.includes(q));
    return (
      <div className="flex flex-col gap-1 mt-2">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-3 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer text-sm capitalize"
          >
            <Checkbox
              checked={priorities.includes(opt)}
              onCheckedChange={() =>
                toggleArray(opt, priorities, setPriorities)
              }
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  if (activeCategory === "Work type") {
    const options = WORK_TYPES.filter((w) => w.label.toLowerCase().includes(q));
    return (
      <div className="flex flex-col gap-1 mt-2">
        {options.map((opt) => (
          <label
            key={opt.id}
            className="flex items-center gap-3 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer text-sm"
          >
            <Checkbox
              checked={workTypes.includes(opt.id)}
              onCheckedChange={() =>
                toggleArray(opt.id, workTypes, setWorkTypes)
              }
            />
            <div className="flex items-center justify-center w-5 h-5 shrink-0">
              {opt.icon}
            </div>
            {opt.label}
          </label>
        ))}
      </div>
    );
  }

  if (activeCategory === "Labels") {
    const options = availableLabels.filter((l) => l.toLowerCase().includes(q));
    return (
      <div className="flex flex-col gap-1 mt-2">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-3 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer text-sm"
          >
            <Checkbox
              checked={labels.includes(opt)}
              onCheckedChange={() => toggleArray(opt, labels, setLabels)}
            />
            <Badge
              variant="outline"
              className="font-normal text-xs bg-transparent border-border/50 text-foreground"
            >
              {opt}
            </Badge>
          </label>
        ))}
      </div>
    );
  }

  return null;
}
