/**
 * Legacy auth-storage cleanup.
 *
 * Pre-security-round-1 builds stored auth values (refreshToken, userData,
 * userId, ...) in localStorage. Nothing writes those keys anymore — auth is
 * HttpOnly-cookie only — but stale keys from an older cached build can still
 * sit in a user's browser and be confused for the live auth mechanism. This
 * helper purges them once (boot/login/logout/401) so localStorage never holds
 * session-looking data.
 *
 * This module intentionally imports NOTHING so it is safe to use from
 * api-client.ts without creating an import cycle.
 */
const LEGACY_AUTH_KEYS = [
  'authToken',
  'accessToken',
  'refreshToken',
  'token',
  'userData',
  'userId',
  'userName',
  'userEmail',
  'userRole',
  'isLoggedIn',
];

export function purgeLegacyAuthStorage(): void {
  if (typeof localStorage === 'undefined') return;
  for (const key of LEGACY_AUTH_KEYS) {
    localStorage.removeItem(key);
  }
}