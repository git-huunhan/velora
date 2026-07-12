import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { SlidersHorizontal } from "lucide-react";
import { useViewSettingsStore } from "../../model/useViewSettingsStore";

interface ViewSettingsPopoverProps {
  groupBy?: string;
}

export function ViewSettingsPopover({
  groupBy = "None",
}: ViewSettingsPopoverProps) {
  const [open, setOpen] = useState(false);

  const {
    showWorkType,
    setShowWorkType,
    showWorkItemKey,
    setShowWorkItemKey,
    showEpic,
    setShowEpic,
    showLabels,
    setShowLabels,
    showDueDate,
    setShowDueDate,
    showPriority,
    setShowPriority,
    showAssignee,
    setShowAssignee,
    showComment,
    setShowComment,
    showAttachment,
    setShowAttachment,
    triggerExpandAll,
    triggerCollapseAll,
  } = useViewSettingsStore();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md transition-colors text-muted-foreground border-input hover:text-foreground hover:border-border aria-expanded:bg-primary/10 aria-expanded:text-primary aria-expanded:!border-primary aria-expanded:hover:bg-primary/20 aria-expanded:hover:text-primary"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 shadow-xl flex flex-col overflow-hidden p-0"
        style={{
          maxHeight: "calc(var(--radix-popper-available-height) - 16px)",
        }}
        align="end"
      >
        <div className="shrink-0 pt-3 px-3">
          <div className="flex items-center justify-between pb-2 mb-2 border-b">
            <span className="text-base font-semibold tracking-tight">
              View settings
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 pb-3">
          {/* General View Settings */}
          <div className="flex flex-col gap-3.5 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground font-medium">
                Open work items in sidebar
              </span>
              <Switch defaultChecked={false} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground font-medium">
                Work suggestions
              </span>
              <Switch defaultChecked={true} />
            </div>
          </div>

          <div className="h-px bg-border shrink-0" />

          {/* Fields */}
          <div className="flex flex-col gap-3 shrink-0">
            <span className="text-sm font-semibold text-foreground">
              Fields
            </span>
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Card cover
                </span>
                <Switch defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Work type
                </span>
                <Switch
                  checked={showWorkType}
                  onCheckedChange={setShowWorkType}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Work item key
                </span>
                <Switch
                  checked={showWorkItemKey}
                  onCheckedChange={setShowWorkItemKey}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Epic
                </span>
                <Switch checked={showEpic} onCheckedChange={setShowEpic} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Due date
                </span>
                <Switch
                  checked={showDueDate}
                  onCheckedChange={setShowDueDate}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Labels
                </span>
                <Switch checked={showLabels} onCheckedChange={setShowLabels} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Linked work items
                </span>
                <Switch defaultChecked={false} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Priority
                </span>
                <Switch
                  checked={showPriority}
                  onCheckedChange={setShowPriority}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Assignee
                </span>
                <Switch
                  checked={showAssignee}
                  onCheckedChange={setShowAssignee}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Comments
                </span>
                <Switch
                  checked={showComment}
                  onCheckedChange={setShowComment}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Attachments
                </span>
                <Switch
                  checked={showAttachment}
                  onCheckedChange={setShowAttachment}
                />
              </div>
            </div>
          </div>

          {groupBy !== "None" && (
            <>
              <div className="h-px bg-border shrink-0" />

              {/* Swimlanes */}
              <div className="flex flex-col gap-3 pb-1 shrink-0">
                <span className="text-sm font-semibold text-foreground">
                  Swimlanes
                </span>
                <div className="flex flex-col gap-3.5">
                  <div
                    className="flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/50 p-1 -mx-1 rounded-sm"
                    onClick={() => {
                      triggerExpandAll();
                    }}
                  >
                    <span className="text-sm text-muted-foreground font-medium">
                      Expand all
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/50 p-1 -mx-1 rounded-sm"
                    onClick={() => {
                      triggerCollapseAll();
                    }}
                  >
                    <span className="text-sm text-muted-foreground font-medium">
                      Collapse all
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
