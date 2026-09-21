/**
 * Student self-service profile updates.
 *
 * Backend: PUT /user/:userSlug (see H:\e-learning-platform\src\routes\users.js).
 * Self-edits may change name; email/password changes must also send
 * `currentPassword` or the backend answers 401. grade/phoneNumber are
 * admin-only and are never sent from here.
 */
import { apiClient } from '@/lib/api-client';
import { clearUserCache, setCachedUser } from '@/lib/user-cache';
import type { User } from '@/types/api';

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
}

export async function updateMyProfile(
  userSlug: string,
  body: UpdateProfileInput,
): Promise<User> {
  const user = await apiClient.put<User>(`/user/${userSlug}`, body);
  // The 5-min localStorage profile cache (lib/user-cache.ts) would otherwise
  // serve the old name/email after this edit. Re-hydrate it with the fresh
  // row: cache is cleared then re-written so Navbar/guards see the change
  // immediately instead of waiting out the TTL.
  clearUserCache();
  setCachedUser(user);
  return user;
}
