import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/endpoints/appointments.api';
import { useAppSelector } from '@/store';
import type { PaginatedList, AppointmentSummary } from '@/types';
import type { ScheduleEntry } from '../utils/bookingSlots';

function validatePage(result: PaginatedList<AppointmentSummary>) {
  if (!Array.isArray(result?.data) || !Number.isInteger(result.pagination?.totalPages) || result.pagination.totalPages < 0) {
    throw new Error('Không thể xác minh khung giờ khám.');
  }
  if (result.data.some(entry => !entry.doctorId || !entry.status || !Number.isFinite(Date.parse(entry.appointmentDate)))) {
    throw new Error('Lịch khám không đúng định dạng.');
  }
  return result;
}

export function useDoctorSchedule(doctorId: string, doctorName: string, date: string) {
  const userId = useAppSelector(state => state.auth.user?.id);
  return useQuery({
    queryKey: ['appointments', 'schedule', userId, doctorId, doctorName, date],
    enabled: Boolean(userId && doctorId && doctorName && date),
    queryFn: async (): Promise<ScheduleEntry[]> => {
      const params = { doctorName, date, limit: 100 };
      const first = validatePage(await appointmentsApi.getSchedulePage({ ...params, page: 1 }));
      const entries = [...first.data];
      for (let page = 2; page <= first.pagination.totalPages; page++) {
        const next = validatePage(await appointmentsApi.getSchedulePage({ ...params, page }));
        entries.push(...next.data);
      }
      return entries.filter(entry => entry.doctorId === doctorId).map(({ doctorId, appointmentDate, status }) => ({ doctorId, appointmentDate, status }));
    },
    refetchInterval: 15000,
    staleTime: 0,
  });
}
