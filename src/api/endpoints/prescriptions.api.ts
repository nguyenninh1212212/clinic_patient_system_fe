import { apiClient } from '@/api/axios';
import {
  CreatePrescriptionItemPayload,
  CreatePrescriptionPayload,
  PaginatedList,
  PrescriptionDTO,
  PrescriptionItemDTO,
  UpdatePrescriptionItemPayload,
  UpdatePrescriptionPayload,
} from '@/types/index';
import { store } from '@/store/index';
import { demoPrescriptionsService } from '@/services/demoPrescriptions';

type PrescriptionListParams = { page?: number; limit?: number; issuedAt?: string };

function normalizePrescriptionList(result: unknown, params?: PrescriptionListParams): PaginatedList<PrescriptionDTO> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const response = result as { data?: unknown; pagination?: PaginatedList<PrescriptionDTO>['pagination'] } | null;
  if (Array.isArray(response?.data) && response.pagination) {
    return response as PaginatedList<PrescriptionDTO>;
  }
  if (response?.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data as PaginatedList<PrescriptionDTO>;
  }
  const data = Array.isArray(response?.data) ? response.data : result;
  if (!Array.isArray(data)) throw new Error('Danh sách đơn thuốc không đúng định dạng.');
  return {
    data,
    pagination: { page, limit, total: data.length, totalPages: Math.ceil(data.length / limit) || 1 },
  };
}

function prescriptionEntity(data: PrescriptionDTO | { data: PrescriptionDTO }): PrescriptionDTO {
  return 'data' in data && !('examinationId' in data) ? data.data : data as PrescriptionDTO;
}

function prescriptionItem(data: PrescriptionItemDTO | { data: PrescriptionItemDTO }): PrescriptionItemDTO {
  return 'data' in data && !('dosage' in data) ? data.data : data as PrescriptionItemDTO;
}

export const prescriptionsApi = {
  getPrescriptions: (params?: {
    page?: number;
    limit?: number;
    issuedAt?: string;
  }): Promise<PaginatedList<PrescriptionDTO>> =>
    store.getState().auth.isDemoMode
      ? demoPrescriptionsService.getPrescriptions(params)
      : apiClient.get('/prescriptions', {
          params: { page: params?.page ?? 1, limit: params?.limit ?? 10, issuedAt: params?.issuedAt || undefined },
        }).then((r) => normalizePrescriptionList(r.data, params)),

  getPrescriptionById: (id: string): Promise<PrescriptionDTO> =>
    store.getState().auth.isDemoMode
      ? demoPrescriptionsService.getPrescriptionById(id)
      : apiClient.get(`/prescriptions/${id}`).then((r) => prescriptionEntity(r.data)),

  createPrescription: (payload: CreatePrescriptionPayload): Promise<PrescriptionDTO> =>
    store.getState().auth.isDemoMode
      ? demoPrescriptionsService.createPrescription(payload)
      : apiClient.post('/prescriptions', payload).then((r) => prescriptionEntity(r.data)),

  updatePrescription: (
    id: string,
    payload: UpdatePrescriptionPayload
  ): Promise<PrescriptionDTO> =>
    store.getState().auth.isDemoMode
      ? demoPrescriptionsService.updatePrescription(id, payload)
      : apiClient.patch(`/prescriptions/${id}`, payload).then((r) => prescriptionEntity(r.data)),

  deletePrescription: (id: string): Promise<{ success: boolean; message?: string }> =>
    store.getState().auth.isDemoMode
      ? demoPrescriptionsService.deletePrescription(id)
      : apiClient.delete(`/prescriptions/${id}`).then((r) => r.data),

  getPrescriptionItems: (prescriptionId: string): Promise<PrescriptionItemDTO[]> =>
    store.getState().auth.isDemoMode
      ? demoPrescriptionsService.getPrescriptionItems(prescriptionId)
      : apiClient.get('/prescription-items', { params: { prescriptionId } }).then((r) => {
          const items = r.data?.data ?? r.data;
          if (!Array.isArray(items)) throw new Error('Danh sách thuốc không đúng định dạng.');
          return items;
        }),

  addPrescriptionItem: (
    payload: CreatePrescriptionItemPayload
  ): Promise<PrescriptionItemDTO> =>
    store.getState().auth.isDemoMode
      ? demoPrescriptionsService.addPrescriptionItem(payload)
      : apiClient.post('/prescription-items', payload).then((r) => prescriptionItem(r.data)),

  updatePrescriptionItem: (
    id: string,
    payload: UpdatePrescriptionItemPayload
  ): Promise<PrescriptionItemDTO> =>
    store.getState().auth.isDemoMode
      ? demoPrescriptionsService.updatePrescriptionItem(id, payload)
      : apiClient.patch(`/prescription-items/${id}`, payload).then((r) => prescriptionItem(r.data)),

  deletePrescriptionItem: (id: string): Promise<{ success: boolean }> =>
    store.getState().auth.isDemoMode
      ? demoPrescriptionsService.deletePrescriptionItem(id)
      : apiClient.delete(`/prescription-items/${id}`).then((r) => r.data),
};
