/**
 * Current-user profile cache.
 *
 * The /user/me profile is needed for Navbar, guards, and personal pages on
 * every app load. Without a cache, every full page refresh fires a new request
 * (AuthInitializer runs once per app session = once per hard navigation). This
 * stores a short-TTL copy of the profile so a refresh within the TTL hydrates
 * Redux with ZERO network calls, and /user/me fires again only when the cache is
 * absent or expired.
 *
 * Security notes:
 *  - Stores NON-secret profile data (name/email/role/grade) only. Session
 *    authentication NEVER touches this store — auth is HttpOnly cookies
 *    (invisible to JS). Nothing here can be replayed to impersonate a user.
 *  - Read is corruption-safe: a tampered/manually-edited value parses as a miss
 *    and triggers a normal /user/me fetch.
 *  - Short TTL (5 min) bounds staleness (e.g. role/grade edits or demo-seed
 *    resets), and the storage event in AuthInitializer drops this cache when
 *    another tab logs out.
 */
import { User } from '@/types/api';

export const USER_CACHE_KEY = 'elrn:user-cache';
const TTL_MS = 5 * 60 * 1000;

interface UserCacheEntry {
  user: User;
  expiresAt: number;
}

export function getCachedUser(): User | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as UserCacheEntry;
    if (!parsed?.user || typeof parsed.expiresAt !== 'number') return null;

    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(USER_CACHE_KEY);
      return null;
    }

    return parsed.user;
  } catch {
    return null;
  }
}

export function setCachedUser(user: User): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      USER_CACHE_KEY,
      JSON.stringify({ user, expiresAt: Date.now() + TTL_MS } satisfies UserCacheEntry),
    );
  } catch {
    // Quota/full-storage — cache is best-effort only.
  }
}

export function clearUserCache(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(USER_CACHE_KEY);
}