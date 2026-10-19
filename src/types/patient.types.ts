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
  userId?: string;
}

export interface AccessDTO {
  id: string;
  patientId: string;
  createdBy: string;
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