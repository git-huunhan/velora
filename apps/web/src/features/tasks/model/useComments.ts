import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/model/useAuth";
import { getUserAvatarUrl } from "@/features/auth/model/userAvatar";
import { ApiError } from "@/shared/api/client";

import type { ActivityEntry, Comment } from "../model/types";
import {
  createComment,
  deleteComment,
  getActivityByTaskId,
  getCommentsByTaskId,
  updateComment,
  logActivityApi,
} from "../api/commentsApi";

export const commentKeys = {
  all: ["comments"] as const,
  byTask: (taskId: string) => ["comments", taskId] as const,
  activity: (taskId: string) => ["activity", taskId] as const,
};

export function useComments(taskId: string) {
  const { data, isLoading } = useQuery<Comment[]>({
    queryKey: commentKeys.byTask(taskId),
    queryFn: () => getCommentsByTaskId(taskId),
    enabled: !!taskId,
    staleTime: 30_000,
  });

  return { comments: data ?? [], isLoading };
}

export function useCreateComment(taskId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (body: string) => createComment(taskId, body),

    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: commentKeys.byTask(taskId) });
      const previous = qc.getQueryData<Comment[]>(commentKeys.byTask(taskId));

      const optimistic: Comment = {
        id: `optimistic-${Date.now()}`,
        taskId,
        authorId: user?.id ?? "",
        author: {
          id: user?.id ?? "",
          name: user?.name ?? "Current user",
          avatarUrl: getUserAvatarUrl(user),
        },
        body,
        createdAt: new Date().toISOString(),
      };

      qc.setQueryData<Comment[]>(commentKeys.byTask(taskId), (old = []) => [
        optimistic,
        ...old,
      ]);

      return { previous };
    },

    onError: (err, _body, ctx) => {
      qc.setQueryData(commentKeys.byTask(taskId), ctx?.previous ?? []);
      toast.error("Comment was not posted", {
        description:
          err instanceof ApiError && err.status === 403
            ? "You do not have permission to comment on this task."
            : err instanceof Error
              ? err.message
              : "Please try again.",
      });
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.byTask(taskId) });
      qc.invalidateQueries({ queryKey: commentKeys.activity(taskId) });
    },
  });
}

export function useUpdateComment(taskId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      updateComment(commentId, body),

    onMutate: async ({ commentId, body }) => {
      await qc.cancelQueries({ queryKey: commentKeys.byTask(taskId) });
      const previous = qc.getQueryData<Comment[]>(commentKeys.byTask(taskId));

      qc.setQueryData<Comment[]>(commentKeys.byTask(taskId), (old = []) =>
        old.map((c) =>
          c.id === commentId
            ? {
                ...c,
                body,
                isEdited: true,
                updatedAt: new Date().toISOString(),
              }
            : c,
        ),
      );

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(commentKeys.byTask(taskId), ctx.previous);
      }
      toast.error("Failed to update comment");
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.byTask(taskId) });
    },
  });
}

export function useDeleteComment(taskId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),

    onMutate: async (commentId) => {
      await qc.cancelQueries({ queryKey: commentKeys.byTask(taskId) });
      const previous = qc.getQueryData<Comment[]>(commentKeys.byTask(taskId));

      qc.setQueryData<Comment[]>(commentKeys.byTask(taskId), (old = []) =>
        old.filter((c) => c.id !== commentId),
      );

      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(commentKeys.byTask(taskId), ctx.previous);
      }
      toast.error("Failed to delete comment");
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.byTask(taskId) });
    },
  });
}

export function useActivity(taskId: string) {
  const { data, isLoading } = useQuery<ActivityEntry[]>({
    queryKey: commentKeys.activity(taskId),
    queryFn: () => getActivityByTaskId(taskId),
    enabled: !!taskId,
    staleTime: 30_000,
  });

  return { activity: data ?? [], isLoading };
}

export function useLogActivity(taskId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      field,
      from,
      to,
      fromAvatar,
      toAvatar,
    }: {
      field: string;
      from: string;
      to: string;
      fromAvatar?: string;
      toAvatar?: string;
    }) => logActivityApi(taskId, field, from, to, fromAvatar, toAvatar),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.activity(taskId) });
    },
  });
}
