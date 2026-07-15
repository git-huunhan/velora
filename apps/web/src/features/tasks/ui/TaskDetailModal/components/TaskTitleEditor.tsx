import { useState } from "react";

interface TaskTitleEditorProps {
  title: string;
  onSave: (title: string) => void;
}

export function TaskTitleEditor({ title, onSave }: TaskTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="mb-6 -ml-2">
      <h1
        contentEditable={isEditing}
        suppressContentEditableWarning
        className={`!text-2xl !font-semibold text-foreground tracking-tight leading-[1.2] p-2 rounded-md cursor-text transition-colors border m-0 whitespace-pre-wrap outline-none ${isEditing ? "bg-background border-primary/50 ring-1 ring-primary/50 shadow-sm" : "border-transparent hover:bg-muted/40"}`}
        onClick={(event) => {
          if (isEditing) return;
          setIsEditing(true);
          const target = event.currentTarget;
          setTimeout(() => {
            target.focus();
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(target);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }, 0);
        }}
        onBlur={(event) => {
          setIsEditing(false);
          const nextTitle = event.currentTarget.textContent?.trim();
          if (nextTitle && nextTitle !== title) {
            onSave(nextTitle);
          } else {
            event.currentTarget.textContent = title;
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setIsEditing(false);
            event.currentTarget.textContent = title;
            event.currentTarget.blur();
          }
        }}
      >
        {title}
      </h1>
    </div>
  );
}
