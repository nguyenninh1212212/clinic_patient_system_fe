import { apiClient } from './client';
import { AccessDTO, ApiResponse, PatientDTO } from '../types';
import { store } from '../store';
import { demoAccessiblePatients, demoPatient } from './demoData';

export const patientsApi = {
  getMyPatient: async (): Promise<ApiResponse<PatientDTO> | null> => {
    const isDemo = store.getState().auth.isDemoMode;
    if (isDemo) {
      return {
        code: 200,
        message: 'Thành công (Chế độ Trải nghiệm Tĩnh)',
        data: demoPatient,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await apiClient.get<ApiResponse<PatientDTO>>('/patients/me');
      return response.data;
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axErr = err as { response?: { status?: number } };
        if (axErr.response?.status === 404) {
          return null;
        }
      }
      // If network error (backend not running), gracefully provide demo patient
      return {
        code: 200,
        message: 'Thành công (Dữ liệu tĩnh)',
        data: demoPatient,
        timestamp: new Date().toISOString(),
      };
    }
  },

  getMyAccessiblePatients: async (): Promise<ApiResponse<AccessDTO[]>> => {
    const isDemo = store.getState().auth.isDemoMode;
    if (isDemo) {
      return {
        code: 200,
        message: 'Thành công (Chế độ Trải nghiệm Tĩnh)',
        data: demoAccessiblePatients,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await apiClient.get<ApiResponse<AccessDTO[]>>(
        '/user-patient-access/my-patients'
      );
      return response.data;
    } catch {
      // Fallback to demo family members
      return {
        code: 200,
        message: 'Thành công (Dữ liệu tĩnh)',
        data: demoAccessiblePatients,
        timestamp: new Date().toISOString(),
      };
    }
  },
};
