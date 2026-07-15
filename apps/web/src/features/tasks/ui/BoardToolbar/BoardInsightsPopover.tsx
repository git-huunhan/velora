import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  X,
  RotateCcw,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { PriorityIcon } from "../PriorityIcon/PriorityIcon";
import { useParams } from "react-router-dom";
import { useTasksByProject } from "../../model/useTasks";
import { KANBAN_COLUMNS } from "../../model/types";

export function BoardInsightsPopover() {
  const [open, setOpen] = useState(false);
  const [isAttentionExpanded, setIsAttentionExpanded] = useState(true);
  const [isTimeSpentExpanded, setIsTimeSpentExpanded] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hoverState, setHoverState] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  const { id } = useParams<{ id: string }>();
  const { data: tasks = [] } = useTasksByProject(id || "");
  const [now] = useState(() => Date.now());

  const overdueTasks = tasks.filter((task) => {
    if (task.status === "done") return false;
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  const timeSpentData = useMemo(() => {
    const activeStatuses = KANBAN_COLUMNS.filter((col) => col.id !== "done");
    const stats = activeStatuses.map((col) => {
      const colTasks = tasks.filter((t) => t.status === col.id);
      if (colTasks.length === 0) return { ...col, avgAgeMs: 0, count: 0 };

      const totalAgeMs = colTasks.reduce((acc, t) => {
        // Fallback to 0 if no createdAt (though all mock tasks have it)
        const created = t.createdAt ? new Date(t.createdAt).getTime() : now;
        return acc + Math.max(0, now - created);
      }, 0);

      return {
        ...col,
        avgAgeMs: totalAgeMs / colTasks.length,
        count: colTasks.length,
      };
    });

    const maxAgeMs = Math.max(...stats.map((s) => s.avgAgeMs));

    return stats
      .filter((s) => s.count > 0)
      .map((stat) => {
        const percent = maxAgeMs > 0 ? (stat.avgAgeMs / maxAgeMs) * 100 : 0;

        const days = Math.floor(stat.avgAgeMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (stat.avgAgeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );

        let timeText = "";
        if (days > 0) timeText += `${days} day${days > 1 ? "s" : ""} `;
        if (hours > 0 || days === 0)
          timeText += `${hours} hour${hours > 1 ? "s" : ""}`;

        return {
          id: stat.id,
          label: stat.title.toUpperCase(),
          title: stat.title,
          percent: Math.max(5, percent), // Ensure tiny bars are still visible
          color: "bg-primary",
          borderColor: "border-primary",
          description: `Work items have been in ${stat.title} for an average of ${timeText.trim()}`,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [now, tasks]);

  const PAGE_SIZE = 3;
  const totalPages = Math.ceil(overdueTasks.length / PAGE_SIZE);
  const safeCurrentPage = Math.min(currentPage, Math.max(0, totalPages - 1));
  const currentTasks = overdueTasks.slice(
    safeCurrentPage * PAGE_SIZE,
    (safeCurrentPage + 1) * PAGE_SIZE,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md transition-colors text-muted-foreground border-input hover:text-foreground hover:border-border aria-expanded:bg-primary/10 aria-expanded:text-primary aria-expanded:!border-primary aria-expanded:hover:bg-primary/20 aria-expanded:hover:text-primary"
        >
          <LineChart className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] shadow-xl flex flex-col overflow-hidden p-0 border-border"
        style={{
          maxHeight: "calc(var(--radix-popper-available-height) - 16px)",
        }}
        align="end"
      >
        {/* Header */}
        <div className="flex flex-col gap-1 shrink-0 pt-4 px-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold tracking-tight">
              Board insights
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Stay up to date with your work in progress.
          </p>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 pb-4 pt-4">
          {/* Section 1: Work items for attention */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden shrink-0">
            <div className="p-4">
              <div
                className={`flex items-center justify-between ${isAttentionExpanded ? "mb-3" : "mb-2"}`}
              >
                <h4 className="text-sm font-semibold">
                  Work items for attention
                </h4>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HelpCircle className="h-4 w-4 cursor-pointer hover:text-foreground" />
                  <div
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => setIsAttentionExpanded(!isAttentionExpanded)}
                  >
                    {isAttentionExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>

              {!isAttentionExpanded && (
                <p className="text-xs text-muted-foreground">
                  {overdueTasks.length} work items are overdue on your board.
                </p>
              )}

              {isAttentionExpanded && (
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="h-auto p-0 bg-transparent gap-4 justify-start border-b border-border w-full rounded-none focus-visible:ring-0 focus-visible:ring-offset-0">
                    <TabsTrigger
                      value="all"
                      className="px-0 py-1.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs data-[state=active]:text-primary text-muted-foreground font-medium transition-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      All
                    </TabsTrigger>
                    <TabsTrigger
                      value="due"
                      className="px-0 py-1.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs data-[state=active]:text-primary text-muted-foreground font-medium transition-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      Due
                    </TabsTrigger>
                    <TabsTrigger
                      value="stuck"
                      className="px-0 py-1.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs data-[state=active]:text-primary text-muted-foreground font-medium transition-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      Stuck
                    </TabsTrigger>
                    <TabsTrigger
                      value="blocked"
                      className="px-0 py-1.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs data-[state=active]:text-primary text-muted-foreground font-medium transition-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      Blocked
                    </TabsTrigger>
                    <TabsTrigger
                      value="flagged"
                      className="px-0 py-1.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs data-[state=active]:text-primary text-muted-foreground font-medium transition-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      Flagged
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>

            {isAttentionExpanded && (
              <div className="p-4 pt-0">
                <p className="text-xs text-muted-foreground mb-4">
                  {overdueTasks.length} work items are overdue on your board.
                </p>

                <div className="flex flex-col gap-2">
                  {overdueTasks.length === 0 && (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      No overdue work items!
                    </div>
                  )}
                  {currentTasks.map((task) => {
                    const dueDateStr = new Date(
                      task.dueDate!,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                    return (
                      <div
                        key={task.id}
                        className="flex gap-2.5 p-3 rounded-md border border-border bg-muted/40 relative group hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        <ClipboardList className="mt-0.5 w-3.5 h-3.5 text-primary shrink-0" />
                        <div className="flex flex-col gap-1 w-full min-w-0">
                          <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase leading-none">
                            {task.status.replace("-", " ")}
                          </span>
                          <span className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                            {task.title}
                          </span>
                          <div className="flex items-center justify-between mt-1">
                            <div className="w-fit flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded border border-[#e3244a]/40 text-[#e3244a] bg-[#e3244a]/10 dark:text-[#f23f66] dark:border-[#f23f66]/40 dark:bg-[#f23f66]/10">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span className="translate-y-[1px] dark:text-white text-foreground">
                                Due on {dueDateStr}
                              </span>
                            </div>
                            <PriorityIcon priority={task.priority} />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-1.5">
                      <Button
                        variant="outline"
                        className="h-7 text-xs px-3 bg-transparent text-muted-foreground"
                        disabled={safeCurrentPage === 0}
                        onClick={() =>
                          setCurrentPage((p) => Math.max(0, p - 1))
                        }
                      >
                        Prev
                      </Button>

                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <div
                            key={i}
                            className={`rounded-full ${i === safeCurrentPage ? "w-1.5 h-1.5 bg-muted-foreground" : "w-1.5 h-1.5 border border-border"}`}
                          />
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        className="h-7 text-xs px-3 bg-transparent text-foreground"
                        disabled={safeCurrentPage === totalPages - 1}
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                        }
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Time spent in status */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold">Time spent in status</h4>
              <div
                className="cursor-pointer hover:text-foreground text-muted-foreground"
                onClick={() => setIsTimeSpentExpanded(!isTimeSpentExpanded)}
              >
                {isTimeSpentExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </div>
            <p
              className={`text-xs text-muted-foreground ${isTimeSpentExpanded ? "mb-4" : ""}`}
            >
              Identify the statuses where your work items remain the longest to
              streamline your workflow.
            </p>

            {isTimeSpentExpanded && (
              <div className="space-y-2.5">
                {timeSpentData.length === 0 && (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    Not enough data yet.
                  </div>
                )}
                {timeSpentData.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold text-foreground border ${item.borderColor} rounded-[3px] px-1.5 py-0.5 tracking-wider uppercase w-24 shrink-0 text-center`}
                    >
                      {item.label}
                    </span>
                    <div className="h-3 flex-1 bg-muted rounded-sm flex">
                      <div
                        className={`h-full ${item.color} rounded-sm cursor-pointer hover:opacity-90 transition-opacity`}
                        style={{ width: `${item.percent}%` }}
                        onMouseMove={(e) =>
                          setHoverState({
                            id: item.id,
                            x: e.clientX,
                            y: e.clientY,
                          })
                        }
                        onMouseLeave={() => setHoverState(null)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {hoverState &&
            document.body &&
            createPortal(
              <div
                className="fixed z-[9999] bg-[#cbd1d6] text-black border-none shadow-lg max-w-[220px] p-2.5 rounded-md pointer-events-none transition-none"
                style={{ left: hoverState.x + 24, top: hoverState.y }}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-[13px]">
                    {timeSpentData.find((d) => d.id === hoverState.id)?.title}
                  </span>
                  <span className="text-xs leading-relaxed text-black/80">
                    {
                      timeSpentData.find((d) => d.id === hoverState.id)
                        ?.description
                    }
                  </span>
                </div>
              </div>,
              document.body,
            )}

          {/* Footer */}
          <div className="rounded-lg bg-card border p-3 hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-2.5 text-sm font-medium shrink-0">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            Give feedback
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
