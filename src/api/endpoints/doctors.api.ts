import { apiClient } from '@/api/axios';
import {
  ApiResponse,
  DoctorDTO,
  DoctorShiftDTO,
  SpecialtyDTO,
} from '@/types/index';

import type { DoctorQueryParams, SpecialtyQueryParams } from '@/types/doctor.types';

export const doctorsApi = {
  getAllSpecialties: (): Promise<
    ApiResponse<Array<{ id: number; name: string; iconUrl: string | null }>>
  > =>
    apiClient.get<
      ApiResponse<Array<{ id: number; name: string; iconUrl: string | null }>>
    >('/specialties/all').then((r) => r.data),

  getSpecialties: (
    params?: SpecialtyQueryParams
  ): Promise<ApiResponse<SpecialtyDTO[]>> =>
    apiClient.get<ApiResponse<SpecialtyDTO[]>>('/specialties', {
      params,
    }).then((r) => r.data),

  getDoctors: (
    params?: DoctorQueryParams
  ): Promise<ApiResponse<DoctorDTO[]>> =>
    apiClient.get<ApiResponse<DoctorDTO[]>>('/doctors', {
      params,
    }).then((r) => r.data),

  getDoctorById: (id: string): Promise<ApiResponse<DoctorDTO>> =>
    apiClient.get<ApiResponse<DoctorDTO>>(`/doctors/${id}`).then((r) => r.data),

  getDoctorShifts: (
    doctorId: string,
    date?: string
  ): Promise<ApiResponse<DoctorShiftDTO[]>> =>
    apiClient.get<ApiResponse<DoctorShiftDTO[]>>(
      `/doctors/${doctorId}/shifts`,
      {
        params: date ? { date } : undefined,
      }
    ).then((r) => r.data),
};
