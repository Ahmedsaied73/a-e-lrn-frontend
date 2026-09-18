/**
 * Admin Courses Service — services/adminCoursesService.ts
 *
 * GET /courses — paginated course list with _count{videos,enrollments} + category.
 * POST /courses — create course (category supported).
 * PUT /courses/:slug — update course (category supported).
 * DELETE /courses/:slug — delete course + remote Bunny video cleanup.
 */

import { apiClient } from '@/lib/api-client';
import { clearShared } from '@/lib/data-cache';
import type {
  AdminCourse,
  AdminCourseFilters,
  AdminCourseInput,
  AdminCourseListResponse,
} from '@/types/admin';

function toQuery(filters: AdminCourseFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search && filters.search.trim()) params.set('search', filters.search.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getAdminCourses(filters: AdminCourseFilters = {}): Promise<AdminCourseListResponse> {
  return apiClient.getFull<AdminCourseListResponse>(`/courses${toQuery(filters)}`);
}

export async function createAdminCourse(body: AdminCourseInput): Promise<AdminCourse> {
  const created = await apiClient.post<AdminCourse>(`/courses`, body);
  clearShared(); // catalog lists (home + console) refetch with the new course
  return created;
}

export async function updateAdminCourse(courseSlug: string, body: Partial<AdminCourseInput>): Promise<AdminCourse> {
  const updated = await apiClient.put<AdminCourse>(`/courses/${courseSlug}`, body);
  clearShared();
  return updated;
}

export async function deleteAdminCourse(courseSlug: string): Promise<{ success: boolean; message: string }> {
  const result = await apiClient.delete<{ success: boolean; message: string }>(`/courses/${courseSlug}`);
  clearShared();
  return result;
}
