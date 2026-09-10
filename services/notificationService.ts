import { apiClient } from "@/lib/api-client";
import type {
  BroadcastAudience,
  BroadcastResult,
  NotificationListResponse,
} from "@/types/notifications";

export async function listNotifications(params: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
} = {}): Promise<NotificationListResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.unreadOnly) search.set("unreadOnly", "true");
  const qs = search.toString();
  return apiClient.get<NotificationListResponse>(
    `/notifications${qs ? `?${qs}` : ""}`,
  );
}

export async function getUnreadCount(): Promise<number> {
  const data = await apiClient.get<{ count: number }>(
    "/notifications/unread-count",
  );
  return data.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsRead(): Promise<number> {
  const data = await apiClient.patch<{ updated: number }>(
    "/notifications/read-all",
    {},
  );
  return data.updated;
}

export async function broadcastNotification(input: {
  title: string;
  body?: string;
  linkUrl?: string;
  metadata?: Record<string, unknown>;
  audience: BroadcastAudience;
}): Promise<BroadcastResult> {
  return apiClient.post<BroadcastResult>("/notifications/broadcast", input);
}
