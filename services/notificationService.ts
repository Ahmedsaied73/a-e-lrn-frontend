import { apiClient } from "@/lib/api-client";
import { cached, dropKey, userKey } from "@/lib/data-cache";
import type {
  BroadcastAudience,
  BroadcastResult,
  NotificationListResponse,
} from "@/types/notifications";

/**
 * Cache key for the inbox list — segmented by the only params the page sends.
 * Cached 30s (same convention as getEnrolledCourses / payment history):
 * navigations between the pages reuse one request. Mutations (mark read)
 * drop the affected keys explicitly, so correctness never depends on the TTL.
 */
function listCacheKey(page?: number, unreadOnly?: boolean): string {
  return userKey(`/notifications?p${page ?? 1}:u${unreadOnly ? 1 : 0}`);
}

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
  return cached(listCacheKey(params.page, params.unreadOnly), 30_000, async () =>
    apiClient.get<NotificationListResponse>(
      `/notifications${qs ? `?${qs}` : ""}`,
    ),
  );
}

/**
 * NOT cached, deliberately: the unread-count drives the navbar badge —
 * freshness is the whole point of the badge, and the endpoint is a cheap
 * COUNT. Cache failure mode here would be a wrong badge, not a slow page.
 */
export async function getUnreadCount(): Promise<number> {
  const data = await apiClient.get<{ count: number }>(
    "/notifications/unread-count",
  );
  return data.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`, {});
  // A read flips unread flags + count in the list payload — drop both list
  // variants so the next inbox load is exact, not TTL-bound.
  dropKey(listCacheKey(1, false));
  dropKey(listCacheKey(1, true));
}

export async function markAllNotificationsRead(): Promise<number> {
  const data = await apiClient.patch<{ updated: number }>(
    "/notifications/read-all",
    {},
  );
  dropKey(listCacheKey(1, false));
  dropKey(listCacheKey(1, true));
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
