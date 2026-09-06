/**
 * Admin Users Service — services/adminUsersService.ts
 *
 * GET /user — paginated, filterable user list (admin).
 * POST /auth/register — add a student (public endpoint, re-used by the admin console).
 * PUT /user/:id — update name/email/password; admin may also set grade + phoneNumber.
 * DELETE /user/:id — transactional cascade delete (409 if user owns courses).
 */

import { apiClient } from '@/lib/api-client';
import type {
  AdminStudentInput,
  AdminUser,
  AdminUserFilters,
  AdminUserListResponse,
} from '@/types/admin';

function toQuery(filters: AdminUserFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.role) params.set('role', filters.role);
  if (filters.grade) params.set('grade', filters.grade);
  if (filters.search && filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.sort) params.set('sort', filters.sort);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getAdminUsers(filters: AdminUserFilters = {}): Promise<AdminUserListResponse> {
  return apiClient.getFull<AdminUserListResponse>(`/user${toQuery(filters)}`);
}

export async function registerStudent(body: AdminStudentInput): Promise<AdminUser> {
  const res = await apiClient.post<{ user: AdminUser }>('/auth/register', body);
  return res.user;
}

export async function updateAdminUser(
  id: number,
  body: { name?: string; email?: string; grade?: string; phoneNumber?: string },
): Promise<AdminUser> {
  return apiClient.put<AdminUser>(`/user/${id}`, body);
}

export async function deleteAdminUser(id: number): Promise<{ success: boolean; message: string }> {
  return apiClient.delete<{ success: boolean; message: string }>(`/user/${id}`);
}