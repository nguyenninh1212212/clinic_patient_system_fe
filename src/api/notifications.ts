import { apiClient } from './client';
import { NotificationDTO, NotificationsListResponse } from '../types';

export const notificationsApi = {
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<NotificationsListResponse> => {
    // Response is returned directly without ApiResponse envelope
    const response = await apiClient.get<NotificationsListResponse>('/notifications', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
      },
    });
    return response.data;
  },

  markAsRead: async (id: number): Promise<NotificationDTO> => {
    // Header Bearer; id is numeric ID; no body
    const response = await apiClient.put<NotificationDTO>(
      `/notifications/${id}/read`,
      {}
    );
    return response.data;
  },
};
