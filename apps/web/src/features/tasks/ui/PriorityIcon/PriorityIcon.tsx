export function PriorityIcon({ priority }: { priority: string }) {
  if (priority === "high") {
    return (
      <div className="flex items-end gap-0.5 h-3">
        <div className="w-0.75 h-3.5 bg-red-500 rounded-[1px]" />
        <div className="w-0.75 h-3.5 bg-red-500 rounded-[1px]" />
        <div className="w-0.75 h-3.5 bg-red-500 rounded-[1px]" />
      </div>
    );
  }
  if (priority === "medium") {
    return (
      <div className="flex items-end gap-0.5 h-3">
        <div className="w-0.75 h-3.5 bg-yellow-500 rounded-[1px]" />
        <div className="w-0.75 h-3.5 bg-yellow-500 rounded-[1px]" />
        <div className="w-0.75 h-3.5 bg-muted-foreground/40 rounded-[1px]" />
      </div>
    );
  }
  return (
    <div className="flex items-end gap-0.5 h-3">
      <div className="w-0.75 h-3.5 bg-blue-500 rounded-[1px]" />
      <div className="w-0.75 h-3.5 bg-muted-foreground/40 rounded-[1px]" />
      <div className="w-0.75 h-3.5 bg-muted-foreground/40 rounded-[1px]" />
    </div>
  );
}
