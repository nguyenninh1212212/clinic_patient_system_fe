import { persistCurrentTab } from './tabPersistence';
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from '@/store/slices/authSlice';
import profileReducer from '@/store/slices/profileSlice';
import uiReducer from '@/store/slices/uiSlice';
import { queryClient } from '@/api/queryClient';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    ui: uiReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// In-memory token store helper for axios interceptors (avoids localStorage for auth token)
let currentAccessToken: string | null = null;

export const getAccessToken = () => currentAccessToken;
export const setMemoryAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

// Runs synchronously before the next React render, including interceptor-triggered logout.
let previousSession = '';
store.subscribe(() => {
  const { user, isAuthenticated, isDemoMode } = store.getState().auth;
  const session = isAuthenticated ? `${user?.id}:${user?.role}:${isDemoMode}` : '';
  if (session !== previousSession) {
    previousSession = session;
    void queryClient.cancelQueries();
    queryClient.clear();
    if (!isAuthenticated) setMemoryAccessToken(null);
  }
});

// Preserve this browser tab's location across page reloads.
let previousTab = store.getState().ui.currentTab;
store.subscribe(() => {
  const tab = store.getState().ui.currentTab;
  if (tab !== previousTab) {
    previousTab = tab;
    persistCurrentTab(tab);
  }
});
