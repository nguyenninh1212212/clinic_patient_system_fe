import type { PrescriptionDTO } from './prescription.types';
export interface ExaminationDTO {
  id: string;
  appointmentId?: string;
  doctorId?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  icd10Code?: string;
  followUpDate?: string;
  examinedAt?: string;
  patient?: {
    id: string;
    fullName: string;
    dateOfBirth?: string;
    gender?: string;
    phone?: string;
  };
  prescription?: PrescriptionDTO;
}

// Medicine Schema
