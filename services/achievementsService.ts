/**
 * Achievements Service — services/achievementsService.ts
 *
 * Single source of truth for the achievements/exam-results-aggregate API.
 * GET /user/me/achievements — enrolled course progress + quiz results summary.
 */

import { apiClient } from '@/lib/api-client';
import type { AchievementsData } from '@/types/quiz';

export async function getAchievements(): Promise<AchievementsData> {
  return apiClient.get<AchievementsData>('/user/me/achievements');
}