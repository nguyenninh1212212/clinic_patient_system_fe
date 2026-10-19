import { useQuery } from '@tanstack/react-query';
import { doctorsApi } from '@/api/endpoints/doctors.api';
import type { DoctorQueryParams } from '@/types/doctor.types';
import { queryKeys } from '@/api/queryKeys';
import { useStaffScope } from '@/features/shared/hooks/useStaffScope';

export function useSpecialties() {
  const { userId, enabled } = useStaffScope();
  return useQuery({ queryKey: queryKeys.staff.resource('specialties', userId), queryFn: doctorsApi.getAllSpecialties, enabled });
}
export function useDoctors(filters: DoctorQueryParams) {
  const { userId, enabled } = useStaffScope();
  return useQuery({ queryKey: queryKeys.staff.resource('doctors', userId, filters), queryFn: () => doctorsApi.getDoctors(filters), enabled });
}
export function useDoctorShifts(doctorId: string | undefined, date: string) {
  const { userId, enabled } = useStaffScope();
  return useQuery({ queryKey: queryKeys.staff.resource('doctor-shifts', userId, { doctorId, date }), queryFn: () => doctorsApi.getDoctorShifts(doctorId!, date), enabled: enabled && !!doctorId && !!date });
}
