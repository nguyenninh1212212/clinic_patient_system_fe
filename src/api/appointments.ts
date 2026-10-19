import { apiClient } from './client';
import {
  ApiResponse,
  AppointmentStatus,
  CreateAppointmentDto,
  MyBookingsResponse,
} from '../types';

export interface MyBookingsQueryParams {
  page?: number;
  limit?: number;
  status?: AppointmentStatus;
}

export const appointmentsApi = {
  createAppointment: async (payload: CreateAppointmentDto): Promise<{
    message: string;
    rawResponse?: unknown;
  }> => {
    // Note: Backend publishes RabbitMQ event and currently does not return synchronous confirmation DTO
    const response = await apiClient.post('/appointments', payload);
    return {
      message:
        (response.data && response.data.message) ||
        'Yêu cầu đặt lịch đã được tiếp nhận và đưa vào hàng đợi xử lý.',
      rawResponse: response.data,
    };
  },

  getMyBookings: async (
    params?: MyBookingsQueryParams
  ): Promise<ApiResponse<MyBookingsResponse>> => {
    const response = await apiClient.get<ApiResponse<MyBookingsResponse>>(
      '/appointments/my-bookings',
      {
        params,
      }
    );
    return response.data;
  },
};
