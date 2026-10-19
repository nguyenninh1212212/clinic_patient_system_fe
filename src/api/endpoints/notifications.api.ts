import { apiClient } from '@/api/axios';
import { NotificationDTO, NotificationsListResponse } from '@/types/index';

export const notificationsApi = {
  getNotifications: (params?: {
    page?: number;
    limit?: number;
  }): Promise<NotificationsListResponse> =>
    apiClient.get<NotificationsListResponse>('/notifications', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
      },
    }).then((r) => r.data),

  markAsRead: (id: number): Promise<NotificationDTO> =>
    apiClient.put<NotificationDTO>(
      `/notifications/${id}/read`,
      {}
    ).then((r) => r.data),
};
