/**
 * Unified client-side data cache — lib/data-cache.ts
 *
 * THE single place for all frontend caching. Everything that memoizes an API
 * response lives here; services only declare *what* to cache (key + TTL),
 * never *how*. Two mechanisms:
 *
 *  1. `cached(key, ttlMs, loader)` — in-memory TTL entries with single-flight.
 *     Concurrent callers awaiting the same key share ONE loader promise, so
 *     three components mounting together fire one request, not three. Only
 *     successful resolutions are stored — rejections never populate the cache.
 *     Memory is per page load: a hard refresh starts cold (the backend Redis
 *     layer covers cold starts), so there is no cross-session staleness.
 *
 *  2. `persistedEntry(storageKey, ttlMs)` — localStorage-backed singleton with
 *     the same TTL + corruption-safe read semantics. Reserved for data that is
 *     BOTH non-secret AND useless for impersonation (today: only the user
 *     profile, via lib/user-cache.ts). Auth tokens must NEVER come near this
 *     module — auth is HttpOnly cookies, invisible to JS.
 *
 * Key discipline (the security model):
 *  - `shared:` keys hold public catalog data any visitor may see.
 *  - `user:` keys hold per-user responses (enrollment, progress) and are
 *    namespaced by profile id (`user:7:/courses/1`), `anon` when signed out.
 *  - EVERY auth transition (login, logout, 401, cross-tab logout) calls
 *    `clearUserEntries()`, so a previous user's responses can never surface
 *    in a later session on a shared device.
 *  - Never cached, anywhere: quiz questions/results/attempts, assignment
 *    bodies/submissions, playback URLs (signed + gate-checked per request),
 *    notifications, admin grading data.
 */

export const ELRN_USER_KEY = 'elrn:user-cache';

interface MemoryEntry {
  value: unknown;
  expiresAt: number;
}

const memory = new Map<string, MemoryEntry>();
const inflight = new Map<string, Promise<unknown>>();

/** Profile id for `user:` namespacing. Null-safe: unknown shape → null. */
export function peekUserId(): number | string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ELRN_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      value?: { id?: unknown };
      user?: { id?: unknown };
    };
    // `.value` = current persistedEntry shape, `.user` = pre-unification shape.
    const id = parsed?.value?.id ?? parsed?.user?.id;
    return typeof id === 'number' || typeof id === 'string' ? id : null;
  } catch {
    return null;
  }
}

/** Key builder for public catalog data (courses list, categories). */
export function sharedKey(path: string): string {
  return `shared:${path}`;
}

/** Key builder for per-user responses (detail+progress, enrolled, videos). */
export function userKey(path: string): string {
  return `user:${peekUserId() ?? 'anon'}:${path}`;
}

/**
 * Get-or-load with TTL + single-flight. Only `loader` successes are stored.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = memory.get(key);
  if (hit && Date.now() < hit.expiresAt) return hit.value as T;

  const ongoing = inflight.get(key);
  if (ongoing) return ongoing as Promise<T>;

  const pending = loader().then(
    (value) => {
      memory.set(key, { value, expiresAt: Date.now() + ttlMs });
      inflight.delete(key);
      return value;
    },
    (err: unknown) => {
      inflight.delete(key);
      throw err;
    },
  );
  inflight.set(key, pending);
  return pending;
}

/** Drop one exact entry (plus any in-flight waiter for it). */
export function dropKey(key: string): void {
  memory.delete(key);
  inflight.delete(key);
}

/** Drop every entry whose key starts with `prefix`. */
export function dropByPrefix(prefix: string): void {
  // Map.forEach (not spread-iteration): tsconfig targets pre-ES2015, and
  // deleting the current key during forEach is safe per the Map contract.
  memory.forEach((_entry, key) => {
    if (key.startsWith(prefix)) {
      memory.delete(key);
      inflight.delete(key);
    }
  });
}

/**
 * Wipe ALL per-user entries. Call on login, logout, 401, and cross-tab
 * logout — the backstop behind `user:` id-namespacing.
 */
export function clearUserEntries(): void {
  dropByPrefix('user:');
}

/** Wipe shared catalog entries (admin mutations; rarely needed client-side). */
export function clearShared(prefix = 'shared:'): void {
  dropByPrefix(prefix);
}

export interface PersistedEntry<T> {
  get: () => T | null;
  set: (value: T) => void;
  clear: () => void;
}

/**
 * localStorage-backed singleton with TTL + corruption-safe reads.
 * A tampered/unparseable/expired value reads as a miss, never a throw.
 * Storage-full is swallowed: cache is best-effort only.
 */
export function persistedEntry<T>(storageKey: string, ttlMs: number): PersistedEntry<T> {
  interface Stored {
    value: T;
    expiresAt: number;
  }

  const get = (): T | null => {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Stored;
      if (!parsed || typeof parsed.expiresAt !== 'number' || !('value' in parsed)) {
        return null;
      }
      if (Date.now() > parsed.expiresAt) {
        try {
          localStorage.removeItem(storageKey);
        } catch {
          // Ignore cleanup failures — the entry already reads as a miss.
        }
        return null;
      }
      return parsed.value;
    } catch {
      return null;
    }
  };

  const set = (value: T): void => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ value, expiresAt: Date.now() + ttlMs }),
      );
    } catch {
      // Quota/full-storage — cache is best-effort only.
    }
  };

  const clear = (): void => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Best-effort.
    }
  };

  return { get, set, clear };
}
