import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'loading';
  message: string;
  duration?: number;
}

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];
  globalLoading: boolean;
  sidebarOpen: boolean;
}

const initialState: UIState = {
  theme: 'dark',
  notifications: [],
  globalLoading: false,
  sidebarOpen: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = Date.now().toString();
      state.notifications.push({
        ...action.payload,
        id,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
  },
});

export const {
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
  setGlobalLoading,
  toggleSidebar,
  setSidebarOpen,
} = uiSlice.actions;

export const selectTheme = (state: RootState) => state.ui.theme;
export const selectNotifications = (state: RootState) => state.ui.notifications;
export const selectGlobalLoading = (state: RootState) => state.ui.globalLoading;
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;

export default uiSlice.reducer;