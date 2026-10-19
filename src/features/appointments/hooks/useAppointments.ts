import { useQuery } from '@tanstack/react-query';
import { appointmentsApi, MyBookingsQueryParams } from '@/api/endpoints/appointments.api';
import { queryKeys } from '@/api/queryKeys';
import { useStaffScope } from '@/features/shared/hooks/useStaffScope';

export function useMyBookings(filters: MyBookingsQueryParams) {
  const { userId, enabled } = useStaffScope();
  return useQuery({ queryKey: queryKeys.staff.resource('appointments', userId, filters), queryFn: () => appointmentsApi.getMyBookings(filters), enabled });
}
