'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import { loginStart, loginSuccess, loginFailure, guestSessionChecked } from './slices/authSlice';
import { getCurrentUser } from '@/services/authService';
import { purgeLegacyAuthStorage } from '@/utils/auth-storage';
import { getCachedUser, setCachedUser, clearUserCache, USER_CACHE_KEY } from '@/lib/user-cache';

/**
 * Single source of truth for "am I logged in" on app load.
 *
 * Runs the /user/me check exactly ONCE per app session and writes the
 * result into Redux (authSlice). Every component that needs auth state
 * (Navbar, protected pages, etc.) should read it from Redux via
 * `useAppSelector(selectIsAuthenticated)` / `selectUser` instead of
 * calling getCurrentUser() itself — that's what was causing the same
 * "/user/me" request to fire multiple times per page load and cascade
 * into 429 "Too many requests" errors.
 *
 * A hard page refresh re-runs this initializer (new app session). To avoid
 * paying a /user/me round-trip on every refresh, a fresh cached profile
 * (lib/user-cache.ts, 5-minute TTL) hydrates Redux instantly with zero
 * requests; /user/me fires only when the cache is absent or expired.
 *
 * The `hasRun` ref also guards against React StrictMode's dev-mode
 * double-invocation of effects firing this twice.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const hasRun = useRef(false);
  // ponytail: Check if user already loaded (e.g., from login flow) to skip duplicate /user/me
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const hydrate = async () => {
      // One-time purge of legacy pre-cookie-auth localStorage keys from older
      // builds, so localStorage never holds anything resembling an auth token.
      purgeLegacyAuthStorage();

      // Cross-tab logout sync: if another tab clears the user cache, drop ours
      // too so a freshly-logged-out profile can't reappear from this tab's copy.
      const onStorage = (e: StorageEvent) => {
        if (e.key === USER_CACHE_KEY && e.newValue === null) {
          clearUserCache();
        }
      };
      window.addEventListener('storage', onStorage);

      // ponytail: Skip duplicate fetch if login flow already populated Redux
      if (isAuthenticated && user !== null) {
        return;
      }

      const loggedIn =
        typeof document !== 'undefined' && document.cookie.includes('isLoggedIn=true');

      if (!loggedIn) {
        dispatch(guestSessionChecked());
        return;
      }

      // Fresh cached profile → hydrate instantly, no /user/me request.
      const cachedUser = getCachedUser();
      if (cachedUser) {
        dispatch(loginSuccess(cachedUser));
        return;
      }

      dispatch(loginStart());
      try {
        const user = await getCurrentUser();
        setCachedUser(user);
        dispatch(loginSuccess(user));
      } catch {
        // Cookie said "logged in" but the session is actually invalid/expired.
        // apiClient's own 401 interceptor already clears the cookie and
        // redirects to /login when this happens, so we just reflect it in
        // Redux here for any UI that renders before that redirect completes.
        clearUserCache();
        dispatch(loginFailure('Session expired'));
      }
    };

    hydrate();
  }, [dispatch, isAuthenticated, user]);

  return <>{children}</>;
}
