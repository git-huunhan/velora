import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/model/useAuth";
import { commentKeys } from "@/features/tasks/model/useComments";
import { tasksKeys } from "@/features/tasks/model/useTasks";
import { workflowKeys } from "@/features/tasks/model/useWorkflow";
import {
  subscribeToProject,
  unsubscribeFromProject,
  type RealtimeEvent,
} from "@/shared/api/realtime";

import { projectsKeys } from "./useProjects";

function getTaskIdsFromPayload(payload: Record<string, unknown>) {
  const ids = new Set<string>();

  if (typeof payload.taskId === "string") ids.add(payload.taskId);
  if (Array.isArray(payload.affectedTaskIds)) {
    payload.affectedTaskIds.forEach((taskId) => {
      if (typeof taskId === "string") ids.add(taskId);
    });
  }

  return ids;
}

export function useProjectRealtime(projectId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!projectId || !user?.id) return;

    const socket = subscribeToProject(projectId);
    if (!socket) return;

    const refreshProject = () => {
      queryClient.invalidateQueries({
        queryKey: projectsKeys.detail(projectId),
      });
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
    };

    const refreshTasks = (event: RealtimeEvent) => {
      queryClient.invalidateQueries({
        queryKey: tasksKeys.byProject(projectId),
      });

      getTaskIdsFromPayload(event.payload).forEach((taskId) => {
        queryClient.invalidateQueries({
          queryKey: commentKeys.activity(taskId),
        });
      });
    };

    const handleEvent = (event: RealtimeEvent) => {
      if (event.projectId !== projectId || event.actorId === user.id) return;

      switch (event.type) {
        case "task.commented":
          refreshTasks(event);
          if (event.taskId) {
            queryClient.invalidateQueries({
              queryKey: commentKeys.byTask(event.taskId),
            });
          }
          break;
        case "task.moved":
        case "task.updated":
          refreshTasks(event);
          break;
        case "project.member_added":
        case "project.member_removed":
          refreshProject();
          refreshTasks(event);
          break;
        case "project.updated":
          refreshProject();
          queryClient.invalidateQueries({
            queryKey: workflowKeys.byProject(projectId),
          });
          break;
        default:
          break;
      }
    };

    const handleReconnect = () => {
      socket.emit("project.subscribe", { projectId });
      refreshProject();
      queryClient.invalidateQueries({
        queryKey: tasksKeys.byProject(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: workflowKeys.byProject(projectId),
      });
    };

    socket.on("realtime.event", handleEvent);
    socket.on("connect", handleReconnect);
    socket.on("reconnect", handleReconnect);

    return () => {
      socket.off("realtime.event", handleEvent);
      socket.off("connect", handleReconnect);
      socket.off("reconnect", handleReconnect);
      unsubscribeFromProject(projectId);
    };
  }, [projectId, queryClient, user?.id]);
}
