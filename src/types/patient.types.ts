import { Gender } from "./enum";

export interface PatientDTO {
  id: string;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | string;
  phone: string;
  address?: string;
  medicalHistory?: string;
  identityNumber?: string;
  insuranceCode?: string;
  email?: string;
  patientAccountId?: string;
  /** @deprecated UI compatibility projection only; this is a patient account ID. */
  userId?: string;
}

export interface PatientProfileRequestDTO { id: string; status: string; patientAccountId: string; relationship: string; }

export interface AccessDTO {
  patientAccountId?: string;
  accessLevel?: 'FULL_ACCESS' | 'BOOKING_ONLY' | 'ADMINISTRATIVE';
  status?: 'ACTIVE' | 'PENDING_APPROVAL' | 'REVOKED';
  id: string;
  patientId: string;
  createdBy?: string;
  userId: string;
  createdAt: string;
  patient: {
    id: string;
    patientCode: string;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
  };
}

export interface CreatePatientDto {
  fullName: string;
  gender: Gender;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  medicalHistory?: string;
  identityNumber?: string;
}

export interface UpdatePatientDto {
  fullName?: string;
  gender?: Gender;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  medicalHistory?: string;
  identityNumber?: string;
}