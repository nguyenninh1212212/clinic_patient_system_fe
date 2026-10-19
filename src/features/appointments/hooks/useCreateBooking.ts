import { useCachedMutation, MutationCallbacks } from '@/features/shared/hooks/useCachedMutation';
import { syncStaffCache } from '@/api/cacheUpdates';
import { appointmentsApi } from '@/api/endpoints/appointments.api';

interface BookingFormData { patientId: string; doctorId: string; appointmentDate: string; appointmentTime: string; notes?: string }

const createBookingRequest = async (data: BookingFormData) => {
      const combinedDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}:00`);
      const isoDateString = combinedDateTime.toISOString();

      return appointmentsApi.createAppointment({
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentDate: isoDateString,
        notes: data.notes?.trim() || undefined,
      });
    };
export function useCreateBooking(callbacks: MutationCallbacks<Awaited<ReturnType<typeof createBookingRequest>>, Parameters<typeof createBookingRequest>[0]> = {}) {
  return useCachedMutation(createBookingRequest, async (client, userId) => {
    await syncStaffCache(client, 'appointments', userId);
  }, callbacks);
}
