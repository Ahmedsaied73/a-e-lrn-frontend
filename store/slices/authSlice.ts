import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { User } from '@/types/api';

// Define authentication state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  // True once the app-level "am I logged in" check has run at least once
  // (success, failure, or "no session cookie at all"). Lets consumers tell
  // "still checking, don't know yet" apart from "checked, definitely logged
  // out" — without this, a page guarding itself on !isAuthenticated could
  // redirect to /login before the initial check has even had a chance to run.
  initialized: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  initialized: false,
  error: null,
};

// Create auth slice
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Start login process
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    // Login success
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.initialized = true;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    // Login failure
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.initialized = true;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    },
    // No session cookie found at all on the initial check — a plain guest,
    // not an error. Keeps this out of loginFailure so the UI never shows an
    // "error" state for the ordinary case of a visitor who isn't logged in.
    guestSessionChecked: (state) => {
      state.loading = false;
      state.initialized = true;
    },
    // Logout
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      state.initialized = true;
    },
  },
});

// Export actions
export const { loginStart, loginSuccess, loginFailure, guestSessionChecked, logout } =
  authSlice.actions;

// Select state from RootState
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;

export default authSlice.reducer;