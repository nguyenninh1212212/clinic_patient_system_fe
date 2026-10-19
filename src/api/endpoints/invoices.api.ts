import type { InvoiceDTO, PaginatedList } from '@/types/index';
import { invoiceEndpoints, InvoiceFilters } from '@/api/endpoints/invoice-requests.api';

// Staff facade retained for existing components. No offline substitution for private data.
// Patient reads remain blocked until the backend enforces ownership on list AND detail.
export const invoicesApi = {
  getInvoices: invoiceEndpoints.list,
  getInvoiceById: invoiceEndpoints.detail,
  findByPatientId: (patientId: string, params: Omit<InvoiceFilters, 'patientId'> = {}): Promise<PaginatedList<InvoiceDTO>> =>
    invoiceEndpoints.list({ ...params, patientId }),
  createInvoice: invoiceEndpoints.create,
  importExcel: invoiceEndpoints.importExcel,
  exportExcel: invoiceEndpoints.exportExcel,
};
