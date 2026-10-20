import { apiClient } from '@/api/axios';
import { AuthResponse, IUser } from '@/types/index';

export const authApi = {
  login: (credentials: { identifier: string; password: string }): Promise<AuthResponse> =>
    apiClient.post<AuthResponse>('/auth/login', credentials, {
      timeout: 3000,
    }).then((r) => r.data),

  register: (payload: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<AuthResponse> =>
    apiClient.post<AuthResponse>('/auth/register', payload, {
      timeout: 3000,
    }).then((r) => r.data),

  getMe: (accessToken?: string): Promise<IUser> =>
    apiClient.get<IUser>('/auth/me', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    }).then((r) => r.data),

  refreshToken: (): Promise<{ accessToken: string }> =>
    apiClient.post<{ accessToken: string }>(
      '/auth/refresh-token',
      {},
      { timeout: 2000 }
    ).then((r) => r.data),

  logout: (): Promise<{ message: string }> =>
    apiClient.post<{ message: string }>('/auth/logout', {}).then((r) => r.data),
};
