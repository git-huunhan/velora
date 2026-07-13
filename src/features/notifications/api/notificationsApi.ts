import { apiRequest } from "@/shared/api/client";

import type { NotificationItem, PaginatedNotifications } from "../model/types";

interface ApiNotificationListResponse {
  data: NotificationItem[];
  meta: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
}

interface ApiUnreadCountResponse {
  count: number;
}

interface ApiReadAllResponse {
  updatedCount: number;
}

export async function getNotifications(
  page: number = 1,
  limit: number = 10,
  unread?: boolean,
): Promise<PaginatedNotifications> {
  const search = new URLSearchParams({
    limit: String(limit),
    page: String(page),
    sort: "createdAt:desc",
  });

  if (unread) {
    search.set("unread", "true");
  }

  const response = await apiRequest<ApiNotificationListResponse>(
    `/notifications?${search.toString()}`,
  );

  return {
    data: response.data,
    totalCount: response.meta.total,
    totalPages: response.meta.totalPages,
  };
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiRequest<ApiUnreadCountResponse>(
    "/notifications/unread-count",
  );
  return response.count;
}

export async function markNotificationRead(
  notificationId: string,
): Promise<NotificationItem> {
  return apiRequest<NotificationItem>(`/notifications/${notificationId}/read`, {
    method: "POST",
  });
}

export async function markAllNotificationsRead(): Promise<ApiReadAllResponse> {
  return apiRequest<ApiReadAllResponse>("/notifications/read-all", {
    method: "POST",
  });
}
