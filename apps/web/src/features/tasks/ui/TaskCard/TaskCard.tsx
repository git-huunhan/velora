import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";

import {
  AlertTriangle,
  Bug,
  CalendarIcon,
  ClipboardList,
  Crown,
  Loader2,
  MessageSquare,
  Paperclip,
  SquaresExclude,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { flushSync } from "react-dom";
import { useParams } from "react-router-dom";
import type { Task, TaskUpdateData } from "../../model/types";
import { useTasksByProject } from "../../model/useTasks";
import { PriorityIcon } from "../PriorityIcon";
import { TaskCardActions } from "./TaskCardActions";

import { isSubtask } from "../../model/taskHierarchy";
import { useViewSettingsStore } from "../../model/useViewSettingsStore";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onUpdate?: (taskId: string, data: TaskUpdateData) => void;
  onDelete?: (task: Task) => void;
  isOverlay?: boolean;
}
export function TaskCard({
  task,
  onClick,
  onUpdate,
  onDelete,
  isOverlay,
}: TaskCardProps) {
  const {
    showWorkType,
    showWorkItemKey,
    showEpic,
    showLabels,
    showDueDate,
    showPriority,
    showAssignee,
    showComment,
    showAttachment,
  } = useViewSettingsStore();
  const dragRef = useRef<HTMLDivElement>(null); // inner card - drag source & preview
  const dropRef = useRef<HTMLDivElement>(null); // outer wrapper - drop target (covers pb-2.5 gap)
  const [isDragging, setIsDragging] = useState(false);
  const [previewContainer, setPreviewContainer] = useState<HTMLElement | null>(
    null,
  );
  const [previewWidth, setPreviewWidth] = useState(280);

  useEffect(() => {
    const element = dragRef.current;
    const dropElement = dropRef.current;
    if (!element || !dropElement || task.isPending) return;

    return combine(
      draggable({
        element,
        getInitialData: ({ input }) => {
          const rect = element.getBoundingClientRect();
          return {
            entityType: "task-card",
            taskId: task.id,
            offsetY: input.clientY - rect.top,
            cardHeight: rect.height,
          };
        },
        onGenerateDragPreview: ({ nativeSetDragImage, location }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({
              element,
              input: location.current.input,
            }),
            render({ container }) {
              // flushSync ensures React renders the portal synchronously
              // so the browser can capture it as the drag image
              const width = element.getBoundingClientRect().width;
              flushSync(() => {
                setPreviewWidth(width || 280);
                setPreviewContainer(container);
              });
              return () => setPreviewContainer(null);
            },
          });
        },
        onDragStart: () => setIsDragging(true),
        onDrop: () => {
          setIsDragging(false);
          setPreviewContainer(null);
        },
      }),
      dropTargetForElements({
        // Use outer wrapper as drop zone so the pb-2.5 gap is also covered - no dead zones
        element: dropElement,
        canDrop: ({ source }) =>
          source.data.entityType === "task-card" &&
          source.data.taskId !== task.id,
        getData: ({ input, source }) => {
          // Use the inner card's center for edge calculation (not the outer wrapper)
          const cardRect = dragRef.current?.getBoundingClientRect();
          if (!cardRect)
            return {
              entityType: "task-card",
              taskId: task.id,
              manualEdge: "bottom",
            };

          let pointerY = input.clientY;
          if (
            source &&
            typeof source.data.offsetY === "number" &&
            typeof source.data.cardHeight === "number"
          ) {
            const ghostTop = input.clientY - source.data.offsetY;
            pointerY = ghostTop + source.data.cardHeight / 2;
          }

          const midY = cardRect.top + cardRect.height / 2;
          const edge = pointerY < midY ? "top" : "bottom";

          return {
            entityType: "task-card",
            taskId: task.id,
            manualEdge: edge,
          };
        },
        getDropEffect: () => "move",
      }),
    );
  }, [task.id, task.isPending]);

  const { id } = useParams<{ id: string }>();
  const { data: tasks = [] } = useTasksByProject(id || "");
  const parentTask = task.parentId
    ? tasks.find((t) => t.id === task.parentId)
    : null;

  const hasMiddleContent =
    (showEpic && task.type !== "epic" && !!parentTask) ||
    (showLabels && task.labels && task.labels.length > 0) ||
    (showDueDate && !!task.dueDate);

  const hasBottomContent =
    showPriority || showAttachment || showComment || showAssignee;
  const hasAnyContentBelowTitle = hasMiddleContent || hasBottomContent;

  const cardContent = (
    <>
      <div
        className={`flex flex-col gap-1.5 ${!isOverlay && !task.isPending ? "pr-7" : ""} ${hasAnyContentBelowTitle ? "mb-2.5 pb-2.5 border-b border-border/40" : ""}`}
      >
        {(showWorkType || showWorkItemKey) && (
          <div className="min-h-[16px] text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            {showWorkType && (
              <>
                {task.type === "epic" ? (
                  <Crown className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                ) : task.type === "bug" ? (
                  <Bug className="w-3.5 h-3.5 text-red-500 shrink-0" />
                ) : isSubtask(task, tasks) ? (
                  <SquaresExclude className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                ) : (
                  <ClipboardList className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
              </>
            )}
            {showWorkItemKey && (
              <span className="translate-y-[0.5px]">
                {task.code || `TASK-${task.id.slice(-3)}`}
              </span>
            )}
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-medium leading-snug text-foreground/90 line-clamp-3">
            {task.title}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {task.isPending && (
              <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
            )}
          </div>
        </div>
      </div>

      {hasMiddleContent && (
        <div className="flex flex-col gap-2 mb-4">
          {showEpic && task.type !== "epic" && parentTask && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-foreground/70 hover:text-foreground cursor-pointer transition-colors bg-muted/40 px-1.5 py-0.5 rounded border border-border/50 w-fit">
              <Crown className="w-3 h-3 text-purple-500 shrink-0" />
              <span className="truncate max-w-[150px]" title={parentTask.title}>
                {parentTask.title}
              </span>
            </div>
          )}
          {showLabels && task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.labels.map((label) => {
                let hash = 0;
                for (let i = 0; i < label.length; i++) {
                  hash = label.charCodeAt(i) + ((hash << 5) - hash);
                }
                const colors = [
                  "border-pink-500/30 text-pink-500",
                  "border-blue-400/30 text-blue-400",
                  "border-amber-500/30 text-amber-500",
                  "border-purple-400/30 text-purple-400",
                  "border-emerald-500/30 text-emerald-500",
                ];
                const color = colors[Math.abs(hash) % colors.length];
                return (
                  <span
                    key={label}
                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded border bg-background/50 ${color}`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          )}
          {showDueDate &&
            task.dueDate &&
            (() => {
              const isOverdue =
                new Date(task.dueDate).getTime() <
                new Date().setHours(0, 0, 0, 0);
              return (
                <div
                  className={`w-fit flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded border ${isOverdue ? "border-[#e3244a]/40 text-[#e3244a] bg-[#e3244a]/10 dark:text-[#f23f66] dark:border-[#f23f66]/40 dark:bg-[#f23f66]/10" : "border-primary/30 text-primary bg-primary/10"}`}
                >
                  {isOverdue ? (
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                  ) : (
                    <CalendarIcon className="w-3 h-3 shrink-0" />
                  )}
                  <span className="translate-y-[1px]">
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              );
            })()}
        </div>
      )}

      {hasBottomContent && (
        <div
          className={`flex items-center justify-between mt-auto ${hasMiddleContent ? "pt-2 border-t border-border/40" : "pt-0.5"}`}
        >
          <div className="flex items-center gap-3 min-h-[22px]">
            {showPriority && <PriorityIcon priority={task.priority} />}

            {(showAttachment || showComment) && (
              <div className="flex items-center gap-3 text-muted-foreground text-xs font-medium">
                {showAttachment && (
                  <div className="flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{task.id.length % 4}</span>
                  </div>
                )}
                {showComment && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>
                      {(task.id.charCodeAt(task.id.length - 1) || 0) % 6}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {showAssignee && (
            <>
              {task.assignee ? (
                <Avatar className="h-[22px] w-[22px] ring-2 ring-background">
                  <AvatarImage src={task.assignee.avatarUrl} />
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {task.assignee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-[22px] w-[22px] rounded-full border border-dashed border-muted-foreground/60 flex items-center justify-center bg-muted/20">
                  <svg
                    className="w-3 h-3 text-muted-foreground/80"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );

  if (isOverlay) {
    return (
      <div className="flex flex-col rounded-xl border border-border/60 bg-card text-card-foreground p-3 mb-3 cursor-grabbing shadow-2xl scale-105 z-50">
        {cardContent}
      </div>
    );
  }

  return (
    <>
      <div ref={dropRef} className="relative pb-2.5">
        <div
          ref={dragRef}
          data-task-card-id={task.id}
          onClick={() => onClick(task)}
          className={`group relative flex flex-col rounded-xl border border-border/50 bg-card text-card-foreground p-3 transition-colors duration-200 hover:border-primary/40 hover:shadow-md cursor-grab active:cursor-grabbing ${task.isPending ? "opacity-50 pointer-events-none" : ""} ${isDragging ? "opacity-40" : ""}`}
        >
          {!task.isPending && (
            <div className="absolute top-2 right-2 z-10">
              <TaskCardActions
                task={task}
                onOpen={onClick}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            </div>
          )}
          {cardContent}
        </div>
      </div>

      {previewContainer &&
        createPortal(
          <div
            className="flex flex-col rounded-xl border border-primary/50 bg-card text-card-foreground p-3 shadow-2xl cursor-grabbing"
            style={{ width: previewWidth }}
          >
            {cardContent}
          </div>,
          previewContainer,
        )}
    </>
  );
}
