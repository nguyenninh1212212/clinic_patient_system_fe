import { apiClient } from '@/api/axios';
import {
  ApiResponse,
  AppointmentSummary,
  PaginatedList,
  AppointmentStatus,
  CreateAppointmentDto,
  MyBookingsResponse,
} from '@/types/index';

export interface MyBookingsQueryParams {
  page?: number;
  limit?: number;
  status?: AppointmentStatus;
}

export const appointmentsApi = {
  getSchedulePage: (params: { doctorName: string; date: string; page: number; limit: number }): Promise<PaginatedList<AppointmentSummary>> =>
    apiClient.get<PaginatedList<AppointmentSummary>>('/appointments', { params }).then((r) => r.data),

  createAppointment: (payload: CreateAppointmentDto): Promise<{
    message: string;
    rawResponse?: unknown;
  }> =>
    apiClient.post('/appointments', payload).then((r) => ({
      message:
        (r.data && r.data.message) ||
        'Yêu cầu đặt lịch đã được tiếp nhận và đưa vào hàng đợi xử lý.',
      rawResponse: r.data,
    })),

  getMyBookings: (
    params?: MyBookingsQueryParams
  ): Promise<ApiResponse<MyBookingsResponse>> =>
    apiClient.get<ApiResponse<MyBookingsResponse>>(
      '/appointments/my-bookings',
      {
        params,
      }
    ).then((r) => r.data),
};
