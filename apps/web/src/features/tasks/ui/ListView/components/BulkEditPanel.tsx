import { useState } from "react";
import {
  Search,
  MessageSquarePlus,
  CalendarIcon,
  User,
  Tag,
  Network,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BulkEditPanelProps {
  selectedCount: number;
  onClose: () => void;
  onNext?: () => void;
}

export function BulkEditPanel({
  selectedCount,
  onClose,
  onNext,
}: BulkEditPanelProps) {
  const [search, setSearch] = useState("");

  const fields = [
    { id: "assignee", label: "Assignee", icon: User },
    { id: "dueDate", label: "Due date", icon: CalendarIcon },
    { id: "labels", label: "Labels", icon: Tag },
    { id: "parent", label: "Parent", icon: Network },
    { id: "priority", label: "Priority", icon: Flag },
  ];

  const filteredFields = fields.filter((f) =>
    f.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in slide-in-from-right-8 duration-300 [container-type:inline-size]">
      <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
        <div className="flex items-center justify-between gap-2 mb-6 min-w-0">
          <div className="flex items-baseline gap-2 min-w-0 shrink-1 overflow-hidden">
            <h2 className="text-[20px] font-semibold text-foreground tracking-tight leading-none whitespace-nowrap">
              Bulk edit
            </h2>
            <span className="text-[14px] text-muted-foreground whitespace-nowrap truncate">
              {selectedCount} work items
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[13px] text-muted-foreground hover:text-foreground shrink-0 gap-1.5"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 shrink-0" />
            <span className="[@container(max-width:360px)]:hidden">
              Give feedback
            </span>
          </Button>
        </div>

        <p className="text-[15px] text-foreground font-medium mb-6">
          Modify any of the below fields to continue.
        </p>

        <div className="relative mb-8">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 bg-transparent border border-muted-foreground/20 hover:border-muted-foreground/30 rounded-md text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          {filteredFields.map((field) => (
            <div key={field.id} className="flex items-center">
              <div className="w-[140px] text-[13px] text-foreground font-semibold shrink-0">
                {field.label}
              </div>
              <div className="flex-1">
                <Select defaultValue="keep">
                  <SelectTrigger className="w-full h-9 bg-transparent border-muted-foreground/20 hover:bg-muted/10 rounded-md transition-colors focus:ring-1 focus:ring-primary text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep as is</SelectItem>
                    <SelectItem value="clear">Clear value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 pt-4 flex items-center gap-2 bg-background mt-auto">
        <Button
          onClick={onNext}
          className="h-9 px-5 font-medium"
          disabled={selectedCount === 0}
        >
          Next
        </Button>
        <Button
          variant="ghost"
          onClick={onClose}
          className="h-9 px-4 font-medium text-foreground hover:bg-muted"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
