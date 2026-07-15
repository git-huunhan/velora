import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

import {
  Bug,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Crown,
  Plus,
  User as UserIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useIsMutating } from "@tanstack/react-query";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getUserAvatarUrl,
  getUserInitials,
} from "@/features/auth/model/userAvatar";
import type { ProjectCapabilities } from "@/features/projects/model/types";
import { useUsers } from "@/features/users/model/useUsers";

import {
  useCreateTask,
  useCreateColumn,
  useDeleteColumn,
  useDeleteTask,
  useMoveTask,
  useProjectColumns,
  useReorderColumns,
  useTasksByProject,
  useUpdateColumn,
  useUpdateTask,
} from "@/features/tasks";
import type { Task, TaskStatus, TaskUpdateData } from "../../model/types";
import { calculateTaskOrder } from "../../model/taskOrder";
import {
  getTaskParent,
  isSubtask,
  validateParentAssignment,
} from "../../model/taskHierarchy";
import { filterTasks, mergeServerTasks } from "../../model/taskViewUtils";
import { BoardColumn } from "../BoardColumn/BoardColumn";
import { TaskDetailModal } from "../TaskDetailModal/TaskDetailModal";
import { TaskFormModal } from "../TaskFormModal/TaskFormModal";
import type { TaskFormData } from "../TaskFormModal/TaskFormModal";

type GroupBy = "None" | "Assignee" | "Epic" | "Subtask";

const EMPTY_TASKS: Task[] = [];

function getEpicLaneId(task: Task, tasks: Task[]) {
  let parentId = task.parentId;
  const visited = new Set<string>();

  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = tasks.find((candidate) => candidate.id === parentId);
    if (!parent) return undefined;
    if (parent.type === "epic") return parent.id;
    parentId = parent.parentId;
  }

  return undefined;
}

function getSubtaskLaneId(task: Task, tasks: Task[]) {
  const hasChildren = tasks.some((candidate) => candidate.parentId === task.id);
  if (
    hasChildren &&
    (task.type === "task" || task.type === "bug") &&
    !isSubtask(task, tasks)
  )
    return task.id;

  const parent = getTaskParent(task, tasks);
  return parent?.type === "task" || parent?.type === "bug"
    ? parent.id
    : undefined;
}

function getTaskLaneId(task: Task, tasks: Task[], groupBy: GroupBy) {
  if (groupBy === "Assignee") return task.assigneeId;
  if (groupBy === "Epic") return getEpicLaneId(task, tasks);
  if (groupBy === "Subtask") return getSubtaskLaneId(task, tasks);
  return undefined;
}

function isTaskInSameLane(
  task: Task,
  target: Task,
  tasks: Task[],
  groupBy: GroupBy,
) {
  if (task.status !== target.status || task.type === "epic") return false;
  if (groupBy !== "None")
    return (
      getTaskLaneId(task, tasks, groupBy) ===
      getTaskLaneId(target, tasks, groupBy)
    );
  return true;
}

interface KanbanBoardProps {
  projectId: string;
  searchQuery?: string;
  parentIds?: string[];
  assigneeIds?: string[];
  priorities?: string[];
  statuses?: string[];
  workTypes?: string[];
  labels?: string[];
  groupBy?: GroupBy;
  headerSlot?: React.ReactNode;
  initialTaskId?: string | null;
  onInitialTaskOpen?: () => void;
  capabilities?: ProjectCapabilities;
}

import { useViewSettingsStore } from "../../model/useViewSettingsStore";

function SwimlaneGroup({
  title,
  taskCount,
  avatarUserName,
  isFallbackGroup,
  parentTask,
  onParentTaskClick,
  children,
}: {
  title: string;
  taskCount: number;
  avatarUserName?: string;
  isFallbackGroup?: boolean;
  parentTask?: Task;
  onParentTaskClick?: (task: Task) => void;
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { expandAllCounter, collapseAllCounter } = useViewSettingsStore();

  useEffect(() => {
    if (expandAllCounter > 0) setIsExpanded(true);
  }, [expandAllCounter]);

  useEffect(() => {
    if (collapseAllCounter > 0) setIsExpanded(false);
  }, [collapseAllCounter]);

  return (
    <div className="flex flex-col w-full min-w-max mb-6 last:mb-0">
      <div
        className="flex items-center cursor-pointer hover:bg-muted/50 p-2 rounded-md mb-2 sticky left-0 w-fit transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="text-muted-foreground flex items-center justify-center w-5 h-6">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>

        {parentTask && (
          <button
            className="ml-1 flex items-center gap-2 rounded-md px-1.5 py-1 cursor-pointer no-underline hover:no-underline hover:bg-muted hover:text-foreground transition-colors"
            onClick={(event) => {
              event.stopPropagation();
              onParentTaskClick?.(parentTask);
            }}
          >
            {parentTask.type === "epic" ? (
              <Crown className="w-4 h-4 text-purple-500" />
            ) : parentTask.type === "bug" ? (
              <Bug className="w-4 h-4 text-red-500" />
            ) : (
              <ClipboardList className="w-4 h-4 text-primary" />
            )}
            <span className="text-[13px] leading-none text-muted-foreground font-medium">
              {parentTask.code || `TASK-${parentTask.id.slice(-3)}`}
            </span>
            <span className="font-semibold text-[13px] leading-none">
              {title}
            </span>
            <span className="inline-flex h-5 translate-y-px items-center text-[11px] leading-none text-muted-foreground font-medium">
              ({taskCount} work item{taskCount !== 1 ? "s" : ""})
            </span>
          </button>
        )}

        {!isFallbackGroup && !parentTask && avatarUserName && (
          <Avatar className="w-6 h-6 border ml-1">
            <AvatarImage src={getUserAvatarUrl({ name: avatarUserName })} />
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
              {getUserInitials(avatarUserName)}
            </AvatarFallback>
          </Avatar>
        )}

        {isFallbackGroup && title === "Unassigned" && (
          <div className="w-6 h-6 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center bg-muted/20 shrink-0 ml-1">
            <UserIcon className="w-3.5 h-3.5 text-muted-foreground/60" />
          </div>
        )}

        {!isFallbackGroup && !parentTask && !avatarUserName && (
          <Avatar className="w-6 h-6 border bg-muted flex items-center justify-center text-[10px] text-muted-foreground ml-1">
            <AvatarFallback>{title[0]}</AvatarFallback>
          </Avatar>
        )}

        {!parentTask && (
          <div className="flex items-center gap-2 ml-2">
            <span className="font-semibold text-[13px]">{title}</span>
            <span className="text-[11px] text-muted-foreground font-medium translate-y-[1px]">
              ({taskCount} work item{taskCount !== 1 ? "s" : ""})
            </span>
          </div>
        )}
      </div>
      {isExpanded && (
        <div className="flex h-fit max-h-full min-h-0">
          {children}
          <div className="w-6 shrink-0" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

export function KanbanBoard({
  projectId,
  searchQuery = "",
  parentIds = [],
  assigneeIds = [],
  priorities = [],
  statuses = [],
  workTypes = [],
  labels = [],
  groupBy = "None",
  headerSlot,
  initialTaskId,
  onInitialTaskOpen,
  capabilities,
}: KanbanBoardProps) {
  const { data: serverTaskData, isLoading } = useTasksByProject(projectId);
  const { users } = useUsers();
  const { data: columns = [] } = useProjectColumns(projectId);
  const createColumn = useCreateColumn(projectId);
  const updateColumn = useUpdateColumn(projectId);
  const deleteColumn = useDeleteColumn(projectId);
  const reorderColumns = useReorderColumns(projectId);
  const serverTasks = serverTaskData ?? EMPTY_TASKS;
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [isDropPersisting, setIsDropPersisting] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [draggedColumnId, setDraggedColumnId] = useState<TaskStatus | null>(
    null,
  );
  const [columnDropIndicator, setColumnDropIndicator] = useState<{
    instanceKey: string;
    side: "before" | "after";
  } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const isDraggingRef = useRef(false); // ref syncs synchronously, unlike state
  const initializedProjectIdRef = useRef<string | null>(null);
  const isMutating = useIsMutating();

  useEffect(() => {
    if (isLoading) return;

    // Initialize once per project, including projects with no tasks.
    if (initializedProjectIdRef.current !== projectId) {
      initializedProjectIdRef.current = projectId;
      setLocalTasks(serverTasks);
      return;
    }
    // While dragging (check ref) OR mutating (updating to server), skip sync
    // This prevents stale server responses from overwriting optimistic local state
    if (isDraggingRef.current || isDropPersisting || isMutating > 0) return;

    // Merge: preserve the current local order but update any field that changed on the server.
    // Also add newly-created tasks and remove deleted ones.
    setLocalTasks((previous) => mergeServerTasks(previous, serverTasks));
  }, [serverTasks, isMutating, isLoading, projectId, isDropPersisting]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!initialTaskId) return;
    const taskToOpen = localTasks.find((task) => task.id === initialTaskId);
    if (!taskToOpen) return;
    setSelectedTask(taskToOpen);
    onInitialTaskOpen?.();
  }, [initialTaskId, localTasks, onInitialTaskOpen]);

  // Sync selectedTask with the latest data from localTasks
  useEffect(() => {
    if (selectedTask) {
      const updated = localTasks.find((t) => t.id === selectedTask.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedTask)) {
        setSelectedTask(updated);
      }
    }
  }, [localTasks, selectedTask]);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const moveTask = useMoveTask();
  const deleteTask = useDeleteTask();
  const canCreateWorkItems = Boolean(capabilities?.canCreateWorkItems);
  const canUpdateWorkItems = Boolean(capabilities?.canUpdateWorkItems);
  const canDeleteWorkItems = Boolean(capabilities?.canDeleteWorkItems);
  const canManageWorkflow = Boolean(capabilities?.canManageWorkflow);

  const showPermissionError = useCallback(
    (action: string) => toast.error(`You do not have permission to ${action}.`),
    [],
  );

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousLocalTasksRef = useRef<Task[]>([]);
  const [draggingGroups, setDraggingGroups] = useState<{
    grouped: string[];
    hasUngrouped: boolean;
  }>({
    grouped: [],
    hasUngrouped: false,
  });

  useEffect(() => {
    if (!activeId) return;

    const edgeSize = 128;
    const scrollSpeed = 12;
    let latestClientX: number | null = null;
    let latestClientY: number | null = null;
    let animationFrameId = 0;

    const tick = () => {
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer && latestClientX !== null && latestClientY !== null) {
        const rect = scrollContainer.getBoundingClientRect();
        const leftDistance = latestClientX - rect.left;
        const rightDistance = rect.right - latestClientX;
        const topDistance = latestClientY - rect.top;
        const bottomDistance = rect.bottom - latestClientY;
        let horizontalDelta = 0;
        let verticalDelta = 0;

        if (leftDistance < edgeSize) {
          horizontalDelta = -scrollSpeed;
        } else if (rightDistance < edgeSize) {
          horizontalDelta = scrollSpeed;
        }

        if (topDistance < edgeSize) {
          verticalDelta = -scrollSpeed;
        } else if (bottomDistance < edgeSize) {
          verticalDelta = scrollSpeed;
        }

        if (horizontalDelta !== 0) {
          scrollContainer.scrollLeft += horizontalDelta;
        }
        if (verticalDelta !== 0) {
          scrollContainer.scrollTop += verticalDelta;
        }
      }

      animationFrameId = window.requestAnimationFrame(tick);
    };

    const handleTaskDragOver = (event: DragEvent) => {
      latestClientX = event.clientX;
      latestClientY = event.clientY;
    };

    window.addEventListener("dragover", handleTaskDragOver);
    animationFrameId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("dragover", handleTaskDragOver);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [activeId]);

  useEffect(() => {
    if (!draggedColumnId) return;

    const edgeSize = 96;
    const maxSpeed = 24;

    const handleColumnDragOver = (event: DragEvent) => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      event.preventDefault();
      event.dataTransfer!.dropEffect = "move";

      const rect = scrollContainer.getBoundingClientRect();
      const leftDistance = event.clientX - rect.left;
      const rightDistance = rect.right - event.clientX;
      let scrollDelta = 0;

      if (leftDistance < edgeSize) {
        scrollDelta = -Math.ceil(
          ((edgeSize - Math.max(leftDistance, 0)) / edgeSize) * maxSpeed,
        );
      } else if (rightDistance < edgeSize) {
        scrollDelta = Math.ceil(
          ((edgeSize - Math.max(rightDistance, 0)) / edgeSize) * maxSpeed,
        );
      }

      if (scrollDelta !== 0) {
        scrollContainer.scrollLeft += scrollDelta;
      }
    };

    window.addEventListener("dragover", handleColumnDragOver);
    return () => window.removeEventListener("dragover", handleColumnDragOver);
  }, [draggedColumnId]);
  const captureDraggingGroups = useCallback(
    (tasks: Task[]) => {
      const currentGroups = new Set<string>();
      let currentHasUngrouped = false;
      const visibleTasks = filterTasks(tasks, {
        searchQuery,
        parentIds,
        assigneeIds,
        priorities,
        statuses,
        workTypes,
        labels,
        hideEpics: true,
        supportNoParent: true,
        labelMatch: "any",
      });

      visibleTasks.forEach((task) => {
        if (groupBy === "Assignee") {
          if (task.assigneeId) currentGroups.add(task.assigneeId);
          else currentHasUngrouped = true;
        } else if (groupBy === "Epic" || groupBy === "Subtask") {
          const laneId = getTaskLaneId(task, tasks, groupBy);
          if (laneId) currentGroups.add(laneId);
          else currentHasUngrouped = true;
        }
      });

      setDraggingGroups({
        grouped: Array.from(currentGroups),
        hasUngrouped: currentHasUngrouped,
      });
    },
    [
      assigneeIds,
      groupBy,
      labels,
      parentIds,
      priorities,
      searchQuery,
      statuses,
      workTypes,
    ],
  );

  const getDroppedTaskPreview = useCallback(
    (
      activeTaskId: string,
      targetData: Record<string | symbol, unknown> | undefined,
      sourceTasks: Task[],
    ) => {
      if (!targetData) return sourceTasks;

      let effectiveTargetData = targetData;
      let targetType = effectiveTargetData.entityType;

      if (targetType === "task-column" && effectiveTargetData.nearestTaskId) {
        effectiveTargetData = {
          ...effectiveTargetData,
          entityType: "task-card",
          taskId: String(effectiveTargetData.nearestTaskId),
          manualEdge:
            effectiveTargetData.manualEdge === "bottom" ? "bottom" : "top",
        };
        targetType = "task-card";
      }

      const activeIndex = sourceTasks.findIndex(
        (task) => task.id === activeTaskId,
      );

      if (activeIndex < 0) return sourceTasks;

      if (targetType === "task-card") {
        const targetTaskId = String(effectiveTargetData.taskId ?? "");
        if (!targetTaskId || targetTaskId === activeTaskId) return sourceTasks;

        const overIndex = sourceTasks.findIndex(
          (task) => task.id === targetTaskId,
        );
        if (overIndex < 0) return sourceTasks;

        const activeTask = sourceTasks[activeIndex];
        const overTask = sourceTasks[overIndex];
        const newActiveTask = { ...activeTask, status: overTask.status };

        if (groupBy === "Assignee") {
          newActiveTask.assigneeId = overTask.assigneeId;
          if (overTask.assigneeId) {
            const newUser = users.find(
              (user) => user.id === overTask.assigneeId,
            );
            newActiveTask.assignee = newUser
              ? {
                  id: newUser.id,
                  name: newUser.name,
                  avatarUrl: newUser.avatarUrl || "",
                }
              : activeTask.assignee;
          } else {
            newActiveTask.assignee = undefined;
          }
        } else if (groupBy === "Epic" || groupBy === "Subtask") {
          const currentLaneId = getTaskLaneId(activeTask, sourceTasks, groupBy);
          const targetLaneId = getTaskLaneId(overTask, sourceTasks, groupBy);

          if (
            groupBy === "Subtask" &&
            isSubtask(activeTask, sourceTasks) &&
            !targetLaneId
          ) {
            return sourceTasks;
          }

          const targetParentId =
            currentLaneId === targetLaneId ||
            (groupBy === "Subtask" && targetLaneId === activeTask.id)
              ? activeTask.parentId
              : targetLaneId;

          if (
            !validateParentAssignment(activeTask, targetParentId, sourceTasks)
              .valid
          ) {
            return sourceTasks;
          }

          newActiveTask.parentId = targetParentId;
        }

        const nextTasks = [...sourceTasks];
        const [activeTaskObj] = nextTasks.splice(activeIndex, 1);
        Object.assign(activeTaskObj, newActiveTask);

        const targetIndex = nextTasks.findIndex(
          (task) => task.id === targetTaskId,
        );
        const closestEdge = effectiveTargetData.manualEdge as "top" | "bottom";
        const insertIndex =
          closestEdge === "bottom" ? targetIndex + 1 : targetIndex;

        nextTasks.splice(insertIndex, 0, activeTaskObj);
        return nextTasks;
      }

      if (targetType === "task-column") {
        const activeTask = sourceTasks[activeIndex];
        const overStatus = targetData.column as TaskStatus;
        const overGroupId = targetData.groupId as string | undefined;
        const newActiveTask = { ...activeTask, status: overStatus };

        if (groupBy === "Assignee") {
          const targetAssigneeId =
            overGroupId === "ungrouped" ? undefined : overGroupId;
          newActiveTask.assigneeId = targetAssigneeId;
          if (targetAssigneeId) {
            const newUser = users.find((user) => user.id === targetAssigneeId);
            newActiveTask.assignee = newUser
              ? {
                  id: newUser.id,
                  name: newUser.name,
                  avatarUrl: newUser.avatarUrl || "",
                }
              : activeTask.assignee;
          } else {
            newActiveTask.assignee = undefined;
          }
        } else if (groupBy === "Epic" || groupBy === "Subtask") {
          const currentLaneId = getTaskLaneId(activeTask, sourceTasks, groupBy);
          const targetLaneId =
            overGroupId === "ungrouped" ? undefined : overGroupId;

          if (
            groupBy === "Subtask" &&
            isSubtask(activeTask, sourceTasks) &&
            !targetLaneId
          ) {
            return sourceTasks;
          }

          const targetParentId =
            currentLaneId === targetLaneId ||
            (groupBy === "Subtask" && targetLaneId === activeTask.id)
              ? activeTask.parentId
              : targetLaneId;

          if (
            !validateParentAssignment(activeTask, targetParentId, sourceTasks)
              .valid
          ) {
            return sourceTasks;
          }

          newActiveTask.parentId = targetParentId;
        }

        const nextTasks = [...sourceTasks];
        const [activeTaskObj] = nextTasks.splice(activeIndex, 1);
        Object.assign(activeTaskObj, newActiveTask);

        if (targetData.columnEdge === "top") {
          nextTasks.unshift(activeTaskObj);
        } else {
          nextTasks.push(activeTaskObj);
        }

        return nextTasks;
      }

      return sourceTasks;
    },
    [groupBy, users],
  );

  const persistDroppedTask = useCallback(
    (activeTaskId: string, targetData?: Record<string | symbol, unknown>) => {
      isDraggingRef.current = false;
      setActiveId(null);

      if (!canUpdateWorkItems) {
        setLocalTasks(previousLocalTasksRef.current);
        showPermissionError("move work items");
        return;
      }

      if (!targetData) {
        setLocalTasks(previousLocalTasksRef.current);
        return;
      }

      const sourceTasks = previousLocalTasksRef.current.length
        ? previousLocalTasksRef.current
        : localTasks;
      const droppedTasks = getDroppedTaskPreview(
        activeTaskId,
        targetData,
        sourceTasks,
      );
      const updatedTask = droppedTasks.find((task) => task.id === activeTaskId);
      if (!updatedTask) return;

      const originalTask =
        sourceTasks.find((task) => task.id === activeTaskId) ??
        serverTasks.find((task) => task.id === activeTaskId);
      const dataToUpdate: TaskUpdateData = {};

      if (!originalTask) return;

      if (originalTask.status !== updatedTask.status) {
        dataToUpdate.status = updatedTask.status;
      }
      if (
        groupBy === "Assignee" &&
        originalTask.assigneeId !== updatedTask.assigneeId
      ) {
        dataToUpdate.assigneeId =
          updatedTask.assigneeId === undefined ? null : updatedTask.assigneeId;
      } else if (
        (groupBy === "Epic" || groupBy === "Subtask") &&
        originalTask.parentId !== updatedTask.parentId
      ) {
        dataToUpdate.parentId =
          updatedTask.parentId === undefined ? null : updatedTask.parentId;
      }

      const laneTasks = droppedTasks.filter((task) =>
        isTaskInSameLane(task, updatedTask, droppedTasks, groupBy),
      );
      const movedIndex = laneTasks.findIndex(
        (task) => task.id === updatedTask.id,
      );
      const previousTaskId = laneTasks[movedIndex - 1]?.id;
      const nextTaskId = laneTasks[movedIndex + 1]?.id;
      const nextOrder = calculateTaskOrder(
        laneTasks[movedIndex - 1]?.order,
        laneTasks[movedIndex + 1]?.order,
      );

      const originalLaneTasks = sourceTasks.filter((task) =>
        isTaskInSameLane(task, originalTask, sourceTasks, groupBy),
      );
      const originalIndex = originalLaneTasks.findIndex(
        (task) => task.id === originalTask.id,
      );
      const originalPreviousTaskId = originalLaneTasks[originalIndex - 1]?.id;
      const originalNextTaskId = originalLaneTasks[originalIndex + 1]?.id;
      const didPositionChange =
        previousTaskId !== originalPreviousTaskId ||
        nextTaskId !== originalNextTaskId;

      if (nextOrder !== originalTask.order || didPositionChange) {
        dataToUpdate.order = nextOrder;
      }

      if (Object.keys(dataToUpdate).length === 0 && !didPositionChange) return;

      setLocalTasks(
        droppedTasks.map((task) =>
          task.id === updatedTask.id ? { ...task, order: nextOrder } : task,
        ),
      );

      const shouldMoveTask =
        didPositionChange ||
        dataToUpdate.status !== undefined ||
        dataToUpdate.parentId !== undefined ||
        dataToUpdate.order !== undefined;

      setIsDropPersisting(true);

      if (shouldMoveTask) {
        moveTask.mutate(
          {
            taskId: updatedTask.id,
            data: {
              afterTaskId: previousTaskId,
              beforeTaskId: nextTaskId,
              targetColumnId: updatedTask.status,
              targetParentId: updatedTask.parentId ?? null,
            },
          },
          {
            onError: () => {
              setLocalTasks(previousLocalTasksRef.current);
              toast.error("Failed to save task position");
            },
            onSettled: () => {
              setIsDropPersisting(false);
            },
          },
        );
      } else {
        updateTask.mutate(
          { taskId: updatedTask.id, data: dataToUpdate },
          {
            onError: () => {
              setLocalTasks(previousLocalTasksRef.current);
              toast.error("Failed to update task");
            },
            onSettled: () => {
              setIsDropPersisting(false);
            },
          },
        );
      }
    },
    [
      getDroppedTaskPreview,
      groupBy,
      localTasks,
      moveTask,
      serverTasks,
      updateTask,
      canUpdateWorkItems,
      showPermissionError,
    ],
  );

  useEffect(() => {
    return monitorForElements({
      canMonitor: ({ source }) =>
        canUpdateWorkItems && source.data.entityType === "task-card",
      onDragStart: ({ source }) => {
        const taskId = String(source.data.taskId ?? "");
        if (!taskId) return;

        isDraggingRef.current = true;
        setActiveId(taskId);
        previousLocalTasksRef.current = localTasks;
        captureDraggingGroups(localTasks);
      },
      onDrop: ({ source, location }) => {
        const taskId = String(source.data.taskId ?? "");
        if (!taskId) return;

        const target = location.current.dropTargets.find((dropTarget) =>
          ["task-card", "task-column"].includes(
            String(dropTarget.data.entityType ?? ""),
          ),
        );

        persistDroppedTask(taskId, target?.data);
      },
    });
  }, [
    canUpdateWorkItems,
    captureDraggingGroups,
    localTasks,
    persistDroppedTask,
  ]);
  const handleCreate = (
    data: {
      title: string;
      type: "task" | "epic" | "bug";
      assigneeId: string | null;
      dueDate: string | null;
      status: TaskStatus;
    },
    lane?: { assigneeId?: string; parentId?: string },
  ) => {
    if (!canCreateWorkItems) {
      showPermissionError("create work items");
      return;
    }

    createTask.mutate(
      {
        title: data.title,
        type: data.type,
        status: data.status,
        priority: "medium",
        labels: [],
        assigneeId: lane?.assigneeId ?? data.assigneeId ?? undefined,
        parentId: lane?.parentId,
        dueDate: data.dueDate || undefined,
        projectId,
      },
      {
        onSuccess: () => toast.success("Task created"),
        onError: () => toast.error("Failed to create task"),
      },
    );
  };

  const handleAddColumn = async () => {
    if (!canManageWorkflow) {
      showPermissionError("manage workflow columns");
      return;
    }

    const title = newColumnTitle.trim();
    if (!title) return;
    try {
      await createColumn.mutateAsync(title);
      setNewColumnTitle("");
      setIsAddingColumn(false);
      toast.success("Column added");
    } catch {
      toast.error("Failed to add column");
    }
  };

  const getColumnManagementProps = useCallback(
    (column: (typeof columns)[number], instanceKey: string) => ({
      column,
      columns,
      canManageColumn: canManageWorkflow,
      onRenameColumn: (title: string) => {
        if (!canManageWorkflow) {
          showPermissionError("manage workflow columns");
          return;
        }
        updateColumn.mutate({ columnId: column.id, data: { title } });
      },
      onSetDoneColumn: () => {
        if (!canManageWorkflow) {
          showPermissionError("manage workflow columns");
          return;
        }
        updateColumn.mutate({ columnId: column.id, data: { isDone: true } });
      },
      onDeleteColumn: async (targetColumnId?: string) => {
        if (!canManageWorkflow) {
          showPermissionError("manage workflow columns");
          return;
        }
        if (targetColumnId) {
          const tasksToMove = localTasks.filter(
            (task) => task.status === column.id,
          );
          await Promise.all(
            tasksToMove.map((task) =>
              updateTask.mutateAsync({
                taskId: task.id,
                data: { status: targetColumnId as TaskStatus },
              }),
            ),
          );
          setLocalTasks((tasks) =>
            tasks.map((task) =>
              task.status === column.id
                ? { ...task, status: targetColumnId as TaskStatus }
                : task,
            ),
          );
        }
        await deleteColumn.mutateAsync(column.id);
        toast.success("Column deleted");
      },
      onColumnDragStart: () => setDraggedColumnId(column.id),
      canReorderColumn: canManageWorkflow && groupBy === "None",
      isColumnDragging: draggedColumnId !== null,
      onColumnDragEnd: () => {
        setDraggedColumnId(null);
        setColumnDropIndicator(null);
      },
      onColumnDragOver: (side: "before" | "after") => {
        if (!canManageWorkflow || !draggedColumnId) return;
        const sourceIndex = columns.findIndex(
          (item) => item.id === draggedColumnId,
        );
        const targetIndex = columns.findIndex((item) => item.id === column.id);
        const insertionIndex = side === "after" ? targetIndex + 1 : targetIndex;
        if (
          insertionIndex === sourceIndex ||
          insertionIndex === sourceIndex + 1
        ) {
          setColumnDropIndicator(null);
          return;
        }
        setColumnDropIndicator({ instanceKey, side });
      },
      dropIndicatorSide:
        columnDropIndicator?.instanceKey === instanceKey
          ? columnDropIndicator.side
          : null,
      onColumnDrop: (side: "before" | "after") => {
        if (!canManageWorkflow || !draggedColumnId) return;
        const ids = columns.map((item) => item.id);
        const from = ids.indexOf(draggedColumnId);
        const originalTargetIndex = ids.indexOf(column.id);
        const originalInsertionIndex =
          side === "after" ? originalTargetIndex + 1 : originalTargetIndex;
        if (
          originalInsertionIndex === from ||
          originalInsertionIndex === from + 1
        ) {
          setColumnDropIndicator(null);
          return;
        }
        const [movedColumnId] = ids.splice(from, 1);
        if (!movedColumnId) return;
        const targetIndex = ids.indexOf(column.id);
        const insertionIndex = side === "after" ? targetIndex + 1 : targetIndex;
        ids.splice(insertionIndex, 0, movedColumnId);
        reorderColumns.mutate(ids, {
          onError: () => toast.error("Failed to reorder columns"),
        });
        setDraggedColumnId(null);
        setColumnDropIndicator(null);
      },
    }),
    [
      columns,
      draggedColumnId,
      columnDropIndicator,
      localTasks,
      updateTask,
      deleteColumn,
      updateColumn,
      reorderColumns,
      groupBy,
      canManageWorkflow,
      showPermissionError,
    ],
  );

  const handleEdit = (data: TaskFormData) => {
    if (!editingTask) return;
    if (!canUpdateWorkItems) {
      showPermissionError("update work items");
      return;
    }
    updateTask.mutate(
      {
        taskId: editingTask.id,
        data: { ...data, assigneeId: data.assigneeId || undefined },
      },
      {
        onSuccess: () => {
          setEditingTask(null);
          toast.success("Task updated");
        },
        onError: () => toast.error("Failed to update task"),
      },
    );
  };

  const handleDelete = (task: Task) => {
    if (!canDeleteWorkItems) {
      showPermissionError("delete work items");
      return;
    }
    deleteTask.mutate(
      { taskId: task.id, projectId: task.projectId },
      {
        onSuccess: () => {
          setSelectedTask(null);
          toast.success("Task deleted");
        },
        onError: () => toast.error("Failed to delete task"),
      },
    );
  };

  const handleCardUpdate = useCallback(
    (taskId: string, data: TaskUpdateData) => {
      if (!canUpdateWorkItems) {
        showPermissionError("update work items");
        return;
      }
      updateTask.mutate(
        { taskId, data },
        {
          onError: () => toast.error("Failed to update task"),
        },
      );
    },
    [canUpdateWorkItems, showPermissionError, updateTask],
  );
  const baseFilteredTasks = useMemo(
    () =>
      filterTasks(localTasks, {
        searchQuery,
        parentIds,
        assigneeIds,
        priorities,
        statuses,
        workTypes,
        labels,
        hideEpics: true,
        supportNoParent: true,
        labelMatch: "any",
      }),
    [
      localTasks,
      searchQuery,
      parentIds,
      assigneeIds,
      priorities,
      statuses,
      workTypes,
      labels,
    ],
  );

  const filteredTasks = (() => {
    if (groupBy === "Subtask") {
      return baseFilteredTasks.filter(
        (task) => getSubtaskLaneId(task, localTasks) !== task.id,
      );
    }

    const tasksById = new Map(localTasks.map((task) => [task.id, task]));
    return baseFilteredTasks.filter((task) => {
      const parent = task.parentId ? tasksById.get(task.parentId) : undefined;
      return !parent || parent.type === "epic";
    });
  })();

  if (isLoading)
    return (
      <div className="flex flex-col h-full overflow-hidden pt-0">
        {headerSlot}
        <div className="flex flex-col flex-1 overflow-auto px-6 pt-0 pb-4 items-start">
          <div className="flex gap-4 h-fit max-h-full min-h-0 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex flex-col rounded-xl border border-neutral-300 bg-neutral-100 dark:border-border dark:bg-muted/50 min-w-70 w-70 h-[350px]"
              />
            ))}
            <div className="w-6 shrink-0" />
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-full overflow-hidden pt-0">
      {headerSlot}
      <div
        className="flex flex-col flex-1 min-h-0 overflow-x-auto overflow-y-auto px-6 pt-0 pb-6 items-start relative custom-scrollbar"
        ref={scrollContainerRef}
      >
        {groupBy !== "None" ? (
          <div className="flex flex-col w-full">
            {(() => {
              const grouped = new Map<string, Task[]>();
              const ungrouped: Task[] = [];
              let hasUngroupedInServer = false;

              // Pre-populate groups based on state before drag started to prevent them from disappearing
              if (activeId !== null) {
                draggingGroups.grouped.forEach((groupId) => {
                  grouped.set(groupId, []);
                });
                hasUngroupedInServer = draggingGroups.hasUngrouped;
              }

              filteredTasks.forEach((t) => {
                if (groupBy === "Assignee") {
                  if (t.assigneeId) {
                    if (!grouped.has(t.assigneeId))
                      grouped.set(t.assigneeId, []);
                    grouped.get(t.assigneeId)!.push(t);
                  } else {
                    ungrouped.push(t);
                  }
                } else if (groupBy === "Epic" || groupBy === "Subtask") {
                  const laneId = getTaskLaneId(t, localTasks, groupBy);
                  if (laneId) {
                    if (!grouped.has(laneId)) grouped.set(laneId, []);
                    grouped.get(laneId)!.push(t);
                  } else ungrouped.push(t);
                }
              });

              const ungroupedTitle =
                groupBy === "Assignee"
                  ? "Unassigned"
                  : groupBy === "Epic"
                    ? "No Epic"
                    : "Everything else";

              return (
                <>
                  {Array.from(grouped.entries()).map(([groupId, tasks]) => {
                    if (groupBy === "Assignee") {
                      const user = users.find((u) => u.id === groupId);
                      return (
                        <SwimlaneGroup
                          key={groupId}
                          title={user?.name || groupId}
                          avatarUserName={user?.name}
                          taskCount={tasks.length}
                        >
                          {columns.map((col, index) => {
                            const columnTasks = tasks.filter(
                              (t) => t.status === col.id,
                            );
                            return (
                              <BoardColumn
                                {...getColumnManagementProps(
                                  col,
                                  `${col.id}___${groupId}`,
                                )}
                                key={`${col.id}___${groupId}`}
                                columnId={col.id}
                                droppableId={`${col.id}___${groupId}`}
                                groupId={groupId}
                                title={col.title}
                                tasks={columnTasks}
                                onTaskClick={setSelectedTask}
                                onTaskUpdate={
                                  canUpdateWorkItems
                                    ? handleCardUpdate
                                    : undefined
                                }
                                onTaskDelete={
                                  canDeleteWorkItems ? handleDelete : undefined
                                }
                                isFirstColumn={index === 0}
                                onCreateTask={
                                  canCreateWorkItems
                                    ? (data) =>
                                        handleCreate(data, {
                                          assigneeId: groupId,
                                        })
                                    : undefined
                                }
                              />
                            );
                          })}
                        </SwimlaneGroup>
                      );
                    }

                    const parentTask = serverTasks.find(
                      (pt) => pt.id === groupId,
                    );

                    return (
                      <SwimlaneGroup
                        key={groupId}
                        title={parentTask?.title || groupId}
                        parentTask={parentTask}
                        onParentTaskClick={setSelectedTask}
                        taskCount={tasks.length}
                      >
                        {columns.map((col, index) => {
                          const columnTasks = tasks.filter(
                            (t) => t.status === col.id,
                          );
                          return (
                            <BoardColumn
                              {...getColumnManagementProps(
                                col,
                                `${col.id}___${groupId}`,
                              )}
                              key={`${col.id}___${groupId}`}
                              columnId={col.id}
                              droppableId={`${col.id}___${groupId}`}
                              groupId={groupId}
                              title={col.title}
                              tasks={columnTasks}
                              onTaskClick={setSelectedTask}
                              onTaskUpdate={
                                canUpdateWorkItems
                                  ? handleCardUpdate
                                  : undefined
                              }
                              onTaskDelete={
                                canDeleteWorkItems ? handleDelete : undefined
                              }
                              isFirstColumn={index === 0}
                              onCreateTask={
                                canCreateWorkItems
                                  ? (data) =>
                                      handleCreate(data, { parentId: groupId })
                                  : undefined
                              }
                            />
                          );
                        })}
                      </SwimlaneGroup>
                    );
                  })}
                  {(ungrouped.length > 0 ||
                    hasUngroupedInServer ||
                    grouped.size === 0) && (
                    <SwimlaneGroup
                      title={ungroupedTitle}
                      taskCount={ungrouped.length}
                      isFallbackGroup={true}
                    >
                      {columns.map((col, index) => {
                        const columnTasks = ungrouped.filter(
                          (t) => t.status === col.id,
                        );
                        return (
                          <BoardColumn
                            {...getColumnManagementProps(
                              col,
                              `${col.id}___ungrouped`,
                            )}
                            key={`${col.id}___ungrouped`}
                            columnId={col.id}
                            droppableId={`${col.id}___ungrouped`}
                            groupId="ungrouped"
                            title={col.title}
                            tasks={columnTasks}
                            onTaskClick={setSelectedTask}
                            onTaskUpdate={
                              canUpdateWorkItems ? handleCardUpdate : undefined
                            }
                            onTaskDelete={
                              canDeleteWorkItems ? handleDelete : undefined
                            }
                            isFirstColumn={index === 0}
                            onCreateTask={
                              canCreateWorkItems ? handleCreate : undefined
                            }
                          />
                        );
                      })}
                    </SwimlaneGroup>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          <div className="flex h-fit max-h-full min-h-0">
            {columns.map((col, index) => {
              const columnTasks = filteredTasks.filter(
                (t) => t.status === col.id,
              );
              return (
                <BoardColumn
                  {...getColumnManagementProps(col, col.id)}
                  key={col.id}
                  columnId={col.id}
                  droppableId={col.id}
                  title={col.title}
                  tasks={columnTasks}
                  onTaskClick={setSelectedTask}
                  onTaskUpdate={
                    canUpdateWorkItems ? handleCardUpdate : undefined
                  }
                  onTaskDelete={canDeleteWorkItems ? handleDelete : undefined}
                  isFirstColumn={index === 0}
                  onCreateTask={canCreateWorkItems ? handleCreate : undefined}
                />
              );
            })}
            <div className="w-70 shrink-0">
              {canManageWorkflow &&
                (isAddingColumn ? (
                  <input
                    autoFocus
                    value={newColumnTitle}
                    onChange={(event) => setNewColumnTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void handleAddColumn();
                      if (event.key === "Escape") {
                        setNewColumnTitle("");
                        setIsAddingColumn(false);
                      }
                    }}
                    onBlur={() => {
                      if (!newColumnTitle.trim()) setIsAddingColumn(false);
                    }}
                    placeholder="Column name"
                    className="h-10 w-full rounded-lg border border-primary bg-muted/50 px-3 text-sm font-medium outline-none ring-2 ring-primary/20 placeholder:text-muted-foreground"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingColumn(true)}
                    className="flex h-10 w-full items-center gap-2 rounded-lg border border-dashed px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" /> Add column
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onEdit={(task) => {
          setSelectedTask(null);
          setEditingTask(task);
        }}
        onDelete={canDeleteWorkItems ? handleDelete : undefined}
        onOpenTask={setSelectedTask}
        columns={columns}
        canUpdate={canUpdateWorkItems}
        canCreate={canCreateWorkItems}
      />

      {/* Edit modal */}
      <TaskFormModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={handleEdit}
        isLoading={updateTask.isPending}
        initialData={editingTask ?? undefined}
        mode="edit"
      />
    </div>
  );
}
