import type { Pagination } from './common.types';
import type { DoctorDegree } from './doctor.types';
export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'WAITING_TRIAGE'
  | 'TRIAGED'
  | 'IN_EXAMINATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  notes?: string;
}

export interface AppointmentSummary {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  status: AppointmentStatus;
  bookingType?: string;
  notes?: string;
  createdAt: string;
  patient?: {
    id: string;
    patientCode?: string;
    fullName: string;
    phone?: string;
  };
  doctor: {
    id: string;
    degree?: DoctorDegree;
    user?: {
      fullName: string;
    };
    specialty?: {
      name: string;
    };
  };
}

export interface MyBookingsResponse {
  data: AppointmentSummary[];
  pagination: Pagination;
}

