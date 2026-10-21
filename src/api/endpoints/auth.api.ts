import { apiClient } from '@/api/axios';
import { requirePatientSession, requirePatientUser } from '@/features/auth/utils/patient-session';
import { decodeAccessToken } from '@/features/auth/utils/decodeAccessToken';
import { AuthResponse, IUser } from '@/types/index';

export const authApi = {
  login: (credentials: { identifier: string; password: string }): Promise<AuthResponse> =>
    apiClient.post<AuthResponse>('/auth/patient/login', credentials, {
      timeout: 3000,
    }).then((r) => requirePatientSession(r.data)),

  register: (payload: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<AuthResponse> =>
    apiClient.post<AuthResponse>('/auth/patient/register', payload, {
      timeout: 3000,
    }).then((r) => requirePatientSession(r.data)),

  getMe: (accessToken?: string): Promise<IUser> =>
    apiClient.get<IUser>('/auth/patient/me', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    }).then((r) => requirePatientUser(r.data)),

  refreshToken: (): Promise<{ accessToken: string }> =>
    apiClient.post<{ accessToken: string }>(
      '/auth/patient/refresh',
      {},
      { timeout: 2000 }
    ).then((r) => { decodeAccessToken(r.data.accessToken); return r.data; }),

  logout: (): Promise<{ message: string }> =>
    apiClient.post<{ message: string }>('/auth/patient/logout', {}).then((r) => r.data),
};
