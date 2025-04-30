import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// تعريف نوع المستخدم
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

// تعريف حالة المصادقة
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// الحالة الأولية
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// إنشاء شريحة المصادقة
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // بدء عملية تسجيل الدخول
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    // نجاح تسجيل الدخول
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    // فشل تسجيل الدخول
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    },
    // تسجيل الخروج
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    },
  },
});

// تصدير الإجراءات
export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

// اختيار الحالة من RootState
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;

export default authSlice.reducer;