import { apiClient } from './client';
import {
  ApiResponse,
  DoctorDegree,
  DoctorDTO,
  DoctorShiftDTO,
  SpecialtyDTO,
} from '../types';

export interface DoctorQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  specialtyId?: number;
  degree?: DoctorDegree;
}

export interface SpecialtyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const doctorsApi = {
  getAllSpecialties: async (): Promise<
    ApiResponse<Array<{ id: number; name: string; iconUrl: string | null }>>
  > => {
    const response = await apiClient.get<
      ApiResponse<Array<{ id: number; name: string; iconUrl: string | null }>>
    >('/specialties/all');
    return response.data;
  },

  getSpecialties: async (
    params?: SpecialtyQueryParams
  ): Promise<ApiResponse<SpecialtyDTO[]>> => {
    const response = await apiClient.get<ApiResponse<SpecialtyDTO[]>>('/specialties', {
      params,
    });
    return response.data;
  },

  getDoctors: async (
    params?: DoctorQueryParams
  ): Promise<ApiResponse<DoctorDTO[]>> => {
    const response = await apiClient.get<ApiResponse<DoctorDTO[]>>('/doctors', {
      params,
    });
    return response.data;
  },

  getDoctorById: async (id: string): Promise<ApiResponse<DoctorDTO>> => {
    const response = await apiClient.get<ApiResponse<DoctorDTO>>(`/doctors/${id}`);
    return response.data;
  },

  getDoctorShifts: async (
    doctorId: string,
    date?: string
  ): Promise<ApiResponse<DoctorShiftDTO[]>> => {
    const response = await apiClient.get<ApiResponse<DoctorShiftDTO[]>>(
      `/doctors/${doctorId}/shifts`,
      {
        params: date ? { date } : undefined,
      }
    );
    return response.data;
  },
};
