import { apiClient } from '@/api/axios';
import { AccessDTO, ApiResponse } from '@/types/index';

// The current backend check returns an access record or null, not a boolean.
export type CheckedAccess = Pick<AccessDTO, 'id' | 'patientId' | 'userId' | 'patientAccountId' | 'accessLevel' | 'status'>;

// Preserve the existing view-model field while reading only the canonical patient account identity from the API.
export function normalizePatientAccess<T extends CheckedAccess>(access: T): T {
  if (typeof access.patientAccountId !== 'string' || access.status !== 'ACTIVE') throw new Error('Thông tin quyền truy cập không đúng loại tài khoản.');
  return { ...access, userId: access.patientAccountId };
}
export interface IdentityLinkChallenge {
  challengeId: string;
  expiresAt: string;
  message: string;
}
export interface ConfirmIdentityLinkDto { challengeId: string; otp: string; }
export const patientAccessEndpoints = {
  requestIdentityOtp: (identityNumber: string): Promise<IdentityLinkChallenge> =>
    apiClient.post<ApiResponse<IdentityLinkChallenge>>('/patient-profile-access/identity/request-otp', { identityNumber }).then((r) => {
      if (!r.data.data || typeof r.data.data.challengeId !== 'string') throw new Error('Phản hồi OTP không hợp lệ.');
      return r.data.data;
    }),
  confirmIdentity: (dto: ConfirmIdentityLinkDto): Promise<CheckedAccess> =>
    apiClient.post<ApiResponse<CheckedAccess>>('/patient-profile-access/identity/confirm', dto).then((r) => {
      if (!r.data.data) throw new Error('Phản hồi liên kết hồ sơ không hợp lệ.');
      return normalizePatientAccess(r.data.data);
    }),
  myPatients: (userId: string, signal?: AbortSignal): Promise<AccessDTO[]> =>
    apiClient.get<ApiResponse<AccessDTO[]>>('/patient-profile-access/my-patients', { signal }).then((r) => {
      if (!Array.isArray(r.data.data)) throw new Error('Danh sách hồ sơ không đúng định dạng.');
      const records = r.data.data.map(normalizePatientAccess);
      if (records.some(access => access.userId !== userId || access.patient?.id !== access.patientId)) {
        throw new Error('Danh sách hồ sơ không khớp tài khoản đăng nhập.');
      }
      return records;
    }),
  check: (patientId: string, signal?: AbortSignal): Promise<CheckedAccess | null> =>
    apiClient.get<ApiResponse<CheckedAccess | null>>(`/patient-profile-access/check/${encodeURIComponent(patientId)}`, { signal }).then((r) => {
      const access = r.data.data;
      if (access === null) return null;
      if (!access || typeof access.id !== 'string' || access.patientId !== patientId || typeof access.patientAccountId !== 'string') {
        throw new Error('Thông tin quyền truy cập không đúng định dạng.');
      }
      return normalizePatientAccess(access);
    }),
};
