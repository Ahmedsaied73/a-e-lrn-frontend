/**
 * Admin Dashboard Service — services/adminDashboardService.ts
 *
 * GET /admin/dashboard — headline counts, operational alerts, recent activity.
 */

import { apiClient } from '@/lib/api-client';
import type { AdminDashboardData } from '@/types/admin';

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return apiClient.get<AdminDashboardData>('/admin/dashboard');
}