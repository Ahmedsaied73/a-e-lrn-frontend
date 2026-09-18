import type { GradeEnum } from "./api";

export interface NotificationItem {
  id: number;
  userId: number;
  type: "QUIZ_GRADED" | "VIDEO_READY" | "ADMIN_BROADCAST" | string;
  title: string;
  body: string | null;
  read: boolean;
  linkUrl: string | null;
  metadata: Record<string, unknown> | null;
  batchId: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
}

export type BroadcastAudience =
  | { kind: "all" }
  | { kind: "course"; courseSlug: string }
  | { kind: "grade"; grade: GradeEnum };

export interface BroadcastResult {
  count: number;
  batchId: string;
}
