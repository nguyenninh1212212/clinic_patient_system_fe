import { restoreCurrentTab } from '../tabPersistence';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AppTab =
  | 'dashboard'
  | 'profile'
  | 'doctors'
  | 'booking'
  | 'appointments'
  | 'examinations'
  | 'prescriptions'
  | 'invoices'
  | 'api-audit';

interface UiState {
  currentTab: AppTab;
  mobileSidebarOpen: boolean;
  notificationDrawerOpen: boolean;
  serverConfigModalOpen: boolean;
  realtimeToast: {
    open: boolean;
    title: string;
    message: string;
    type: string;
  } | null;
  customApiBaseUrl: string;
}

const initialState: UiState = {
  currentTab: restoreCurrentTab(),
  mobileSidebarOpen: false,
  notificationDrawerOpen: false,
  serverConfigModalOpen: false,
  realtimeToast: null,
  customApiBaseUrl:
    (typeof window !== 'undefined' && localStorage.getItem('PATIENT_PORTAL_API_URL')) ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8000',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCurrentTab: (state, action: PayloadAction<AppTab>) => {
      state.currentTab = action.payload;
      state.mobileSidebarOpen = false; // automatically close mobile sidebar on navigation
    },
    setMobileSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileSidebarOpen = action.payload;
    },
    setNotificationDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.notificationDrawerOpen = action.payload;
    },
    setServerConfigModalOpen: (state, action: PayloadAction<boolean>) => {
      state.serverConfigModalOpen = action.payload;
    },
    showRealtimeToast: (
      state,
      action: PayloadAction<{ title: string; message: string; type: string }>
    ) => {
      state.realtimeToast = {
        open: true,
        title: action.payload.title,
        message: action.payload.message,
        type: action.payload.type,
      };
    },
    hideRealtimeToast: (state) => {
      if (state.realtimeToast) {
        state.realtimeToast.open = false;
      }
    },
    setCustomApiBaseUrl: (state, action: PayloadAction<string>) => {
      state.customApiBaseUrl = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('PATIENT_PORTAL_API_URL', action.payload);
      }
    },
  },
});

export const {
  setCurrentTab,
  setMobileSidebarOpen,
  setNotificationDrawerOpen,
  setServerConfigModalOpen,
  showRealtimeToast,
  hideRealtimeToast,
  setCustomApiBaseUrl,
} = uiSlice.actions;

export default uiSlice.reducer;
