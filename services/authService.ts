/**
 * Authentication Service
 * Centralizes all authentication-related API calls
 */

import { apiClient } from '@/lib/api-client';
import { purgeLegacyAuthStorage } from '@/utils/auth-storage';
import { clearUserCache } from '@/lib/user-cache';
import { clearUserEntries } from '@/lib/data-cache';
import { User } from '@/types/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  phoneNumber: string;
  grade: string;
  password: string;
}

/**
 * Login user with email and password (cookie-only auth).
 * Tokens live in HttpOnly cookies; the middleware `isLoggedIn` flag is set
 * only after the server confirms authentication (via /user/me).
 */
export const loginUser = async (credentials: LoginCredentials): Promise<{ user: User }> => {
  // Stale pre-cookie-auth localStorage keys from older builds are purged on
  // every login so localStorage never looks like it holds an auth mechanism.
  purgeLegacyAuthStorage();
  await apiClient.post('/auth/login', credentials);
  // New session (possibly a different user on a shared device) — drop any
  // per-user entries cached under the previous identity before refetching.
  clearUserEntries();  if (typeof document !== 'undefined') {
    document.cookie = "isLoggedIn=true; path=/; max-age=604800; SameSite=Strict";
  }

  // Fetch current user immediately to populate Redux and confirm the session works
  const user = await getCurrentUser();
  return { user };
};

/**
 * Register a new user (cookie-only auth, same model as login)
 */
export const registerUser = async (userData: RegisterData): Promise<{ user: User }> => {
  purgeLegacyAuthStorage();
  await apiClient.post('/auth/register', userData);
  clearUserEntries();

  if (typeof document !== 'undefined') {
    document.cookie = "isLoggedIn=true; path=/; max-age=604800; SameSite=Strict";
  }

  const user = await getCurrentUser();
  return { user };
};

/**
 * Logout user - clear all stored data
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout', {});
  } catch (err) {
    // Ignore errors on logout
  } finally {
    purgeLegacyAuthStorage();
    clearUserCache();
    clearUserEntries();
    if (typeof document !== 'undefined') {
      document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }
};

/**
 * Get current user data from API
 */
export const getCurrentUser = async (): Promise<User> => {
  // Returns { success: true, data: User } -> apiClient unwraps it
  return await apiClient.get<User>('/user/me');
};