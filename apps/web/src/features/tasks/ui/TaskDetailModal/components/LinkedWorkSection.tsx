import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LinkedWorkSection() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 w-fit transition-colors mb-3 group">
        <h3 className="text-[15px] font-semibold text-foreground">
          Linked work items
        </h3>
      </div>

      {!isFormOpen && (
        <button
          type="button"
          className="text-[13px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors w-fit"
          onClick={() => setIsFormOpen(true)}
        >
          Add linked work item
        </button>
      )}

      {isFormOpen && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Select defaultValue="blocked_by">
              <SelectTrigger className="w-40 h-9 text-[13px] bg-transparent border-border/50 focus:ring-1 focus:ring-primary/50 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blocked_by">Is blocked by</SelectItem>
                <SelectItem value="relates_to">Relates to</SelectItem>
                <SelectItem value="duplicates">Duplicates</SelectItem>
              </SelectContent>
            </Select>

            <input
              type="text"
              autoFocus
              placeholder="Type, search or paste URL"
              className="flex-1 h-9 px-3 bg-transparent border border-border/50 rounded-md text-[13px] outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground text-[13px] font-medium"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create linked work item
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[13px] font-medium"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 bg-muted text-muted-foreground hover:bg-muted/80 cursor-not-allowed shadow-none text-[13px] font-medium"
              >
                Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
