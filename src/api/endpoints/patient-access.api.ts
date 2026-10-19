import { apiClient } from '@/api/axios';
import { AccessDTO, ApiResponse } from '@/types/index';

// The current backend check returns an access record or null, not a boolean.
export type CheckedAccess = Pick<AccessDTO, 'id' | 'patientId' | 'createdBy'>;
export const patientAccessEndpoints = {
  myPatients: (userId: string, signal?: AbortSignal): Promise<AccessDTO[]> =>
    apiClient.get<ApiResponse<AccessDTO[]>>('/user-patient-access/my-patients', { signal }).then((r) => {
      if (!Array.isArray(r.data.data)) throw new Error('Danh sách hồ sơ không đúng định dạng.');
      if (r.data.data.some(access => access.createdBy !== userId || access.patient?.id !== access.patientId)) {
        throw new Error('Danh sách hồ sơ không khớp tài khoản đăng nhập.');
      }
      return r.data.data;
    }),
  check: (patientId: string, signal?: AbortSignal): Promise<CheckedAccess | null> =>
    apiClient.get<ApiResponse<CheckedAccess | null>>(`/user-patient-access/check/${encodeURIComponent(patientId)}`, { signal }).then((r) => {
      const access = r.data.data;
      if (access === null) return null;
      if (!access || typeof access.id !== 'string' || access.patientId !== patientId || typeof access.createdBy !== 'string') {
        throw new Error('Thông tin quyền truy cập không đúng định dạng.');
      }
      return access;
    }),
};
