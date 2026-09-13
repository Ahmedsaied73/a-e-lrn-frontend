/**
 * Current-user profile cache.
 *
 * Thin facade over lib/data-cache.ts `persistedEntry` — the mechanics (TTL,
 * corruption-safe reads, best-effort writes) live in the unified cache layer.
 * Behavior is unchanged from the original implementation:
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
import { persistedEntry, ELRN_USER_KEY } from '@/lib/data-cache';
import { User } from '@/types/api';

export const USER_CACHE_KEY = ELRN_USER_KEY;
const TTL_MS = 5 * 60 * 1000;

const entry = persistedEntry<User>(USER_CACHE_KEY, TTL_MS);

export function getCachedUser(): User | null {
  return entry.get();
}

export function setCachedUser(user: User): void {
  entry.set(user);
}

export function clearUserCache(): void {
  entry.clear();
}
