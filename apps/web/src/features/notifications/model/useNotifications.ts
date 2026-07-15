import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationsApi";
import type { NotificationItem, PaginatedNotifications } from "./types";

export const notificationKeys = {
  all: ["notifications"] as const,
  count: () => [...notificationKeys.all, "unread-count"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters: { limit: number; page: number; unread?: boolean }) =>
    [...notificationKeys.lists(), filters] as const,
};

export function useNotifications(
  page: number = 1,
  limit: number = 10,
  unread?: boolean,
) {
  return useQuery({
    queryKey: notificationKeys.list({ limit, page, unread }),
    queryFn: () => getNotifications(page, limit, unread),
    refetchInterval: 30_000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.count(),
    queryFn: getUnreadNotificationCount,
    refetchInterval: 30_000,
  });
}

function markReadInList(
  previous: PaginatedNotifications | undefined,
  notificationId?: string,
) {
  if (!previous) return previous;

  return {
    ...previous,
    data: previous.data.map((notification) =>
      !notificationId || notification.id === notificationId
        ? {
            ...notification,
            readAt: notification.readAt ?? new Date().toISOString(),
          }
        : notification,
    ),
  };
}

function adjustUnreadCount(previous: number | undefined, amount: number) {
  if (previous === undefined) return previous;
  return Math.max(0, previous + amount);
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previousCount = queryClient.getQueryData<number>(
        notificationKeys.count(),
      );
      const previousLists = queryClient.getQueriesData<PaginatedNotifications>({
        queryKey: notificationKeys.lists(),
      });
      const target = previousLists
        .flatMap(([, list]) => list?.data ?? [])
        .find((notification) => notification.id === notificationId);

      queryClient.setQueriesData<PaginatedNotifications>(
        { queryKey: notificationKeys.lists() },
        (previous) => markReadInList(previous, notificationId),
      );

      if (target && !target.readAt) {
        queryClient.setQueryData<number>(notificationKeys.count(), (previous) =>
          adjustUnreadCount(previous, -1),
        );
      }

      return { previousCount, previousLists };
    },
    onError: (_error, _notificationId, context) => {
      if (!context) return;
      queryClient.setQueryData(notificationKeys.count(), context.previousCount);
      context.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previousCount = queryClient.getQueryData<number>(
        notificationKeys.count(),
      );
      const previousLists = queryClient.getQueriesData<PaginatedNotifications>({
        queryKey: notificationKeys.lists(),
      });

      queryClient.setQueriesData<PaginatedNotifications>(
        { queryKey: notificationKeys.lists() },
        (previous) => markReadInList(previous),
      );
      queryClient.setQueryData<number>(notificationKeys.count(), 0);

      return { previousCount, previousLists };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(notificationKeys.count(), context.previousCount);
      context.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export type { NotificationItem };
