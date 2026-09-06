/**
 * Admin Enrollments Service — services/adminEnrollmentsService.ts
 *
 * GET /admin/enrollments — paginated, filterable enrollment list (student + course joins).
 * POST /admin/enrollments — enroll a student into a course (auto-paid, 409 if duplicate).
 * DELETE /admin/enrollments/:id — hard unenroll.
 */

import { apiClient } from "@/lib/api-client";
import type {
  AdminEnrollment,
  AdminEnrollmentFilters,
  AdminEnrollmentListResponse,
} from "@/types/admin";

function toQuery(filters: AdminEnrollmentFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.userId) params.set("userId", String(filters.userId));
  if (filters.courseId) params.set("courseId", String(filters.courseId));
  if (filters.isPaid !== undefined && filters.isPaid !== "")
    params.set("isPaid", String(filters.isPaid));
  if (filters.isCompleted !== undefined && filters.isCompleted !== "")
    params.set("isCompleted", String(filters.isCompleted));
  if (filters.search && filters.search.trim())
    params.set("search", filters.search.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function getAdminEnrollments(
  filters: AdminEnrollmentFilters = {},
): Promise<AdminEnrollmentListResponse> {
  return apiClient.getFull<AdminEnrollmentListResponse>(
    `/admin/enrollments${toQuery(filters)}`,
  );
}

export async function adminEnrollStudent(
  userId: number,
  courseId: number,
): Promise<{ enrollment: { id: number } }> {
  return apiClient.post<{ enrollment: { id: number } }>(
    `/admin/enrollments`,
    { userId, courseId },
  );
}

export async function adminUnenroll(
  enrollmentId: number,
): Promise<{ success: boolean; message: string }> {
  return apiClient.delete<{ success: boolean; message: string }>(
    `/admin/enrollments/${enrollmentId}`,
  );
}