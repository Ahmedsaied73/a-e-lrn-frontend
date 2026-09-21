/**
 * Achievements Service — services/achievementsService.ts
 *
 * Single source of truth for the achievements/exam-results-aggregate API.
 * GET /user/me/achievements — enrolled course progress + quiz results summary.
 *
 * User-scoped 60s cache (lib/data-cache): the payload embeds the viewer's own
 * progress + quiz best scores, and the backend runs a 3-query Prisma aggregate
 * per miss. The backend drops its Redis twin (v1:achievements:{userId}) on
 * video completion / quiz grading / enroll-unenroll, so any mutation flips it
 * immediately; the TTL here is only a backstop. Matches the FE course-detail
 * TTL convention.
 */

import { apiClient } from '@/lib/api-client';
import { cached, userKey } from '@/lib/data-cache';
import type { AchievementsData } from '@/types/quiz';

export async function getAchievements(): Promise<AchievementsData> {
  return cached(userKey('/user/me/achievements'), 60_000, async () => {
    return apiClient.get<AchievementsData>('/user/me/achievements');
  });
}