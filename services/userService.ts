/**
 * Student self-service profile updates.
 *
 * Backend: PUT /user/:userId (see H:\e-learning-platform\src\routes\users.js).
 * Self-edits may change name; email/password changes must also send
 * `currentPassword` or the backend answers 401. grade/phoneNumber are
 * admin-only and are never sent from here.
 */
import { apiClient } from '@/lib/api-client';
import type { User } from '@/types/api';

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
}

export async function updateMyProfile(
  userId: number | string,
  body: UpdateProfileInput,
): Promise<User> {
  return apiClient.put<User>(`/user/${userId}`, body);
}
