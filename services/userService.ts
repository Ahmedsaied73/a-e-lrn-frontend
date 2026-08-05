/**
 * User Service — services/userService.ts
 *
 * Single source of truth for user-profile API calls.
 */

import { apiClient } from '@/lib/api-client';
import { User } from '@/types/api';

/**
 * GET /user/me
 * Returns the authenticated user's profile.
 * Response: { success: true, data: User }
 */
export async function getCurrentUser(): Promise<User> {
  return apiClient.get<User>('/user/me');
}
