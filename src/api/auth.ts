import { apiClient } from './client';
import { AuthResponse, IUser } from '../types';

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials, {
      timeout: 3000,
    });
    return response.data;
  },

  register: async (payload: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload, {
      timeout: 3000,
    });
    return response.data;
  },

  getMe: async (): Promise<IUser> => {
    // GET /auth/me returns IUser directly without envelope
    const response = await apiClient.get<IUser>('/auth/me');
    return response.data;
  },

  refreshToken: async (): Promise<{ accessToken: string }> => {
    const response = await apiClient.post<{ accessToken: string }>(
      '/auth/refresh-token',
      {},
      { timeout: 2000 }
    );
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/logout', {});
    return response.data;
  },
};
