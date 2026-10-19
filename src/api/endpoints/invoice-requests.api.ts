import { apiClient } from '@/api/axios';
import { store } from '@/store/index';
import { isStaffRole } from '@/routes/access';
import { CreateInvoicePayload, InvoiceDTO, PaginatedList } from '@/types/index';

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  patientId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
const requireStaff = (): Promise<void> => Promise.resolve().then(() => {
  if (!store.getState().auth.isAuthenticated || !isStaffRole(store.getState().auth.user?.role)) {
    throw new Error('Chức năng hóa đơn này chỉ dành cho nhân viên.');
  }
});
function entity(value: unknown): InvoiceDTO {
  if (!value || typeof value !== 'object' || !('id' in value) || !('invoiceNumber' in value)) {
    throw new Error('Phản hồi hóa đơn không đúng định dạng.');
  }
  return value as InvoiceDTO;
}
export const invoiceEndpoints = {
  list: (params: InvoiceFilters = {}): Promise<PaginatedList<InvoiceDTO>> =>
    requireStaff()
      .then(() => apiClient.get('/invoices', { params: { page: 1, limit: 10, ...params } }))
      .then((r) => {
        const result = r.data;
        if (!Array.isArray(result?.data) || !result.pagination) {
          throw new Error('Danh sách hóa đơn không đúng định dạng.');
        }
        return { data: result.data.map(entity), pagination: result.pagination };
      }),

  detail: (id: string): Promise<InvoiceDTO> =>
    requireStaff()
      .then(() => apiClient.get(`/invoices/${encodeURIComponent(id)}`))
      .then((r) => entity(r.data)),

  create: (payload: CreateInvoicePayload): Promise<InvoiceDTO> =>
    requireStaff()
      .then(() => apiClient.post('/invoices', payload))
      .then((r) => entity(r.data)),

  importExcel: (file: File): Promise<{ message?: string }> =>
    requireStaff().then(() => {
      const body = new FormData();
      body.append('file', file);
      return apiClient.post('/invoices/import', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }).then((r) => r.data),

  exportExcel: (id?: string): Promise<void> =>
    requireStaff()
      .then(() => apiClient.get('/invoices/export', { params: { id }, responseType: 'blob' }))
      .then((r) => {
        const url = URL.createObjectURL(r.data);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'hoa-don.xlsx';
        anchor.click();
        URL.revokeObjectURL(url);
      }),
};
