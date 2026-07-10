import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import type { KanbanColumn, TaskStatus } from "../../model/types";
import {
  TASK_STATUS_ENTRIES,
  getTaskStatusPresentationWithColumns,
} from "./taskStatus";

interface TaskStatusSelectProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  className?: string;
  columns?: KanbanColumn[];
}

export function TaskStatusSelect({
  value,
  onChange,
  className,
  columns,
}: TaskStatusSelectProps) {
  const current = getTaskStatusPresentationWithColumns(value, columns);
  const entries = columns?.length
    ? columns.map(
        (column) =>
          [
            column.id,
            getTaskStatusPresentationWithColumns(column.id, columns),
          ] as const,
      )
    : TASK_STATUS_ENTRIES;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={`w-fit h-9 px-3 font-semibold border shadow-sm focus:ring-0 focus:outline-none text-sm transition-colors [&_svg]:text-current ${current.triggerClassName} ${className ?? ""}`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${current.dotClassName}`}
          />
          <span>{current.label}</span>
        </div>
      </SelectTrigger>
      <SelectContent align="start">
        {entries.map(([status, presentation]) => (
          <SelectItem key={status} value={status}>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${presentation.dotClassName}`}
              />
              {presentation.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
