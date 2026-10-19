export interface NotificationDTO {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'SYSTEM' | 'EXAMINATION' | 'PRESCRIPTION' | string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsListResponse {
  notifications: NotificationDTO[];
  unRead: number;
}

export interface RealtimeNotificationPayload {
  title: string;
  message: string;
  type: string;
}

// Examination Schema
