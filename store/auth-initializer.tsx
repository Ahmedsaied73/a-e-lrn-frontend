'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import { loginStart, loginSuccess, loginFailure, guestSessionChecked } from './slices/authSlice';
import { getCurrentUser } from '@/services/authService';

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

      dispatch(loginStart());
      try {
        const user = await getCurrentUser();
        dispatch(loginSuccess(user));
      } catch {
        // Cookie said "logged in" but the session is actually invalid/expired.
        // apiClient's own 401 interceptor already clears the cookie and
        // redirects to /login when this happens, so we just reflect it in
        // Redux here for any UI that renders before that redirect completes.
        dispatch(loginFailure('Session expired'));
      }
    };

    hydrate();
  }, [dispatch, isAuthenticated, user]);

  return <>{children}</>;
}
