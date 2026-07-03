import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTask,
  deleteTask,
  getTasksByProjectId,
  updateTask,
  updateTaskStatus,
} from "../api/tasksApi";
import { mockUsers } from "../../users/model/mockUsers";
import type { Task, TaskStatus, TaskUpdateData } from "./types";
import { commentKeys } from "./useComments";

export const tasksKeys = {
  all: ["tasks"] as const,
  byProject: (projectId: string) => ["tasks", "project", projectId] as const,
};

export function useTasksByProject(projectId: string) {
  return useQuery({
    queryKey: tasksKeys.byProject(projectId),
    queryFn: () => getTasksByProjectId(projectId),
    enabled: !!projectId,
    staleTime: 2000, // Prevent immediate background refetch after mutations (avoids DnD interruption)
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      updateTaskStatus(taskId, status),

    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.all });

      const previousData = queryClient.getQueriesData<Task[]>({
        queryKey: tasksKeys.all,
      });

      queryClient.setQueriesData<Task[]>({ queryKey: tasksKeys.all }, (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === taskId ? { ...task, status } : task,
        );
      });

      return { previousData };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: (updatedTask, _err, { taskId }) => {
      if (updatedTask) {
        queryClient.invalidateQueries({
          queryKey: tasksKeys.byProject(updatedTask.projectId),
        });
      }
      // Refresh history tab
      queryClient.invalidateQueries({ queryKey: commentKeys.activity(taskId) });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onMutate: async (newTaskData) => {
      await queryClient.cancelQueries({
        queryKey: tasksKeys.byProject(newTaskData.projectId),
      });
      const previousTasks = queryClient.getQueryData<Task[]>(
        tasksKeys.byProject(newTaskData.projectId),
      );

      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        code: `PRJ-${Math.floor(Math.random() * 1000)}`,
        projectId: newTaskData.projectId,
        title: newTaskData.title,
        status: newTaskData.status,
        type: newTaskData.type || "task",
        priority: newTaskData.priority || "medium",
        order: newTaskData.order ?? Number.MAX_SAFE_INTEGER,
        assigneeId: newTaskData.assigneeId || undefined,
        reporterId: "user-1",
        dueDate: newTaskData.dueDate || undefined,
        description: undefined,
        createdAt: new Date().toISOString(),
        isPending: true,
      };

      queryClient.setQueryData<Task[]>(
        tasksKeys.byProject(newTaskData.projectId),
        (old) => {
          return old ? [...old, optimisticTask] : [optimisticTask];
        },
      );

      return { previousTasks, projectId: newTaskData.projectId };
    },
    onError: (_err, _newTaskData, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          tasksKeys.byProject(context.projectId),
          context.previousTasks,
        );
      }
    },
    onSettled: (_newTask, _err, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: tasksKeys.byProject(context?.projectId || ""),
      });
    },
  });
}
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: TaskUpdateData }) =>
      updateTask(taskId, data),

    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.all });

      const previousData = queryClient.getQueriesData<Task[]>({
        queryKey: tasksKeys.all,
      });

      queryClient.setQueriesData<Task[]>({ queryKey: tasksKeys.all }, (old) => {
        if (!old) return old;
        return old.map((task) => {
          if (task.id !== taskId) return task;

          const { assigneeId, reporterId, parentId, ...taskFields } = data;
          const assignee =
            assigneeId === undefined
              ? task.assignee
              : assigneeId === null
                ? undefined
                : mockUsers.find((user) => user.id === assigneeId);
          const reporter =
            reporterId === undefined
              ? task.reporter
              : reporterId === null
                ? undefined
                : mockUsers.find((user) => user.id === reporterId);

          return {
            ...task,
            ...taskFields,
            assignee: assignee
              ? {
                  id: assignee.id,
                  name: assignee.name,
                  avatarUrl: assignee.avatarUrl || "",
                }
              : undefined,
            assigneeId:
              assigneeId === undefined
                ? task.assigneeId
                : (assigneeId ?? undefined),
            reporter: reporter
              ? {
                  id: reporter.id,
                  name: reporter.name,
                  avatarUrl: reporter.avatarUrl || "",
                }
              : undefined,
            reporterId:
              reporterId === undefined
                ? task.reporterId
                : (reporterId ?? undefined),
            parentId:
              parentId === undefined ? task.parentId : (parentId ?? undefined),
          };
        });
      });

      return { previousData };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: (updatedTask, _err, { taskId }) => {
      if (updatedTask) {
        queryClient.invalidateQueries({
          queryKey: tasksKeys.byProject(updatedTask.projectId),
        });
      }
      // Refresh history tab
      queryClient.invalidateQueries({ queryKey: commentKeys.activity(taskId) });
    },
  });
}
export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId }: { taskId: string; projectId: string }) =>
      deleteTask(taskId),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: tasksKeys.byProject(projectId),
      });
    },
  });
}
