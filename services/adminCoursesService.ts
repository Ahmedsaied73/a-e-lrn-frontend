/**
 * Admin Courses Service — services/adminCoursesService.ts
 *
 * GET /courses — paginated course list with _count{videos,enrollments} + category.
 * POST /courses — create course (category supported).
 * PUT /courses/:id — update course (category supported).
 * DELETE /courses/:id — delete course + remote Bunny video cleanup.
 */

import { apiClient } from '@/lib/api-client';
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
  return apiClient.post<AdminCourse>(`/courses`, body);
}

export async function updateAdminCourse(id: number, body: Partial<AdminCourseInput>): Promise<AdminCourse> {
  return apiClient.put<AdminCourse>(`/courses/${id}`, body);
}

export async function deleteAdminCourse(id: number): Promise<{ success: boolean; message: string }> {
  return apiClient.delete<{ success: boolean; message: string }>(`/courses/${id}`);
}
