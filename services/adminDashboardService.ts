/**
 * Admin Dashboard Service — services/adminDashboardService.ts
 *
 * GET /admin/dashboard — headline counts, operational alerts, recent activity.
 */

import { apiClient } from '@/lib/api-client';
import { cached, sharedKey } from '@/lib/data-cache';
import type { AdminDashboardData } from '@/types/admin';

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return cached(sharedKey('/admin/dashboard'), 60_000, async () => {
    return apiClient.get<AdminDashboardData>('/admin/dashboard');
  });
}