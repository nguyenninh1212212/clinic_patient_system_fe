import { apiClient } from '@/api/axios';
import { requirePatientSession, requirePatientUser } from '@/features/auth/utils/patient-session';
import { decodeAccessToken } from '@/features/auth/utils/decodeAccessToken';
import { AuthResponse, IUser } from '@/types/index';

export type PatientAuthProvider = 'LOCAL' | 'GOOGLE' | 'FACEBOOK';

export const authApi = {
  login: (credentials: { identifier: string; password: string }): Promise<AuthResponse> =>
    apiClient.post<AuthResponse>('/auth/patients/login', credentials, {
      timeout: 3000,
    }).then((r) => requirePatientSession(r.data)),

  register: (payload: {
    email?: string;
    phone: string;
    password: string;
    fullName: string;
  }): Promise<AuthResponse> =>
    apiClient.post<AuthResponse>('/auth/patients/register', payload, {
      timeout: 3000,
    }).then((r) => requirePatientSession(r.data)),

  getMe: (accessToken?: string): Promise<IUser> =>
    apiClient.get<IUser>('/auth/patients/me', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    }).then((r) => requirePatientUser(r.data)),

  updateMe: (payload: {
    fullName?: string;
    phone?: string;
    email?: string | null;
  }): Promise<IUser> =>
    apiClient.patch<IUser>('/auth/patients/me', payload, {
      timeout: 3000,
    }).then((r) => requirePatientUser(r.data)),

  getProviders: (): Promise<PatientAuthProvider[]> =>
    apiClient.get<PatientAuthProvider[]>('/auth/patients/providers', {
      timeout: 3000,
    }).then((r) => r.data),

  beginProviderLink: (
    provider: Extract<PatientAuthProvider, 'GOOGLE' | 'FACEBOOK'>,
  ): Promise<{ url: string }> =>
    apiClient.post<{ url: string }>(
      `/auth/patients/providers/${provider.toLowerCase()}/link`,
      {},
      { timeout: 3000 },
    ).then((r) => r.data),

  refreshToken: (): Promise<{ accessToken: string }> =>
    apiClient.post<{ accessToken: string }>(
      '/auth/patients/refresh',
      {},
      { timeout: 2000 }
    ).then((r) => { decodeAccessToken(r.data.accessToken); return r.data; }),

  logout: (): Promise<{ message: string }> =>
    apiClient.post<{ message: string }>('/auth/patients/logout', {}).then((r) => r.data),
};
