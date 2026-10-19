import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '@/types/index';

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isDemoMode: boolean;
}

const defaultDemoUser: IUser = {
  id: 'demo-user-patient-001',
  email: 'patient.demo@phongkham.vn',
  role: 'USER',
  fullName: 'Nguyễn Văn An',
  department: null,
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: true,
  isDemoMode: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: IUser; accessToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isInitializing = false;
      state.isDemoMode = false;
    },
    loginAsDemo: (state, action: PayloadAction<IUser | undefined>) => {
      state.user = action.payload || defaultDemoUser;
      state.accessToken = 'static-demo-jwt-token-patient-portal';
      state.isAuthenticated = true;
      state.isInitializing = false;
      state.isDemoMode = true;
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
      state.isInitializing = false;
    },
    setUser: (state, action: PayloadAction<IUser>) => {
      state.user = action.payload;
    },
    logoutAction: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isInitializing = false;
      state.isDemoMode = false;
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.isInitializing = action.payload;
    },
  },
});

export const {
  setCredentials,
  loginAsDemo,
  setAccessToken,
  setUser,
  logoutAction,
  setInitializing,
} = authSlice.actions;

export default authSlice.reducer;
