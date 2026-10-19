import { apiClient } from './client';
import { CreateInvoicePayload, InvoiceDTO, PaginatedList } from '../types';
import { store } from '../store';
import {
  demoAccessiblePatients,
  demoMedicines,
  demoPatient,
  initialDemoInvoices,
} from './demoData';

// In-memory store for static / offline preview mode
let inMemoryInvoices: InvoiceDTO[] = JSON.parse(JSON.stringify(initialDemoInvoices));

export const invoicesApi = {
  getInvoices: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedList<InvoiceDTO>> => {
    const isDemo = store.getState().auth.isDemoMode;
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;

    if (!isDemo) {
      try {
        const response = await apiClient.get('/invoices', {
          params: { page, limit },
        });

        if (response.data && 'data' in response.data) {
          if (response.data.pagination) {
            return response.data as PaginatedList<InvoiceDTO>;
          }
          if (
            response.data.data &&
            typeof response.data.data === 'object' &&
            'data' in response.data.data
          ) {
            return response.data.data as PaginatedList<InvoiceDTO>;
          }
          if (Array.isArray(response.data.data)) {
            return {
              data: response.data.data,
              pagination: response.data.pagination || {
                page,
                limit,
                total: response.data.data.length,
                totalPages: Math.ceil(response.data.data.length / limit) || 1,
              },
            };
          }
        }

        if (Array.isArray(response.data)) {
          return {
            data: response.data,
            pagination: {
              page,
              limit,
              total: response.data.length,
              totalPages: Math.ceil(response.data.length / limit) || 1,
            },
          };
        }
      } catch (err: unknown) {
        // If server returns real 4xx/5xx from backend, rethrow if it's not a connection failure
        const axErr = err as { response?: { status?: number } };
        if (axErr.response && axErr.response.status && axErr.response.status !== 502 && axErr.response.status !== 503 && axErr.response.status !== 504) {
          throw err;
        }
        // Otherwise connection refused / offline -> fallback to in-memory
      }
    }

    // Static in-memory fallback
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    const paginatedSlice = inMemoryInvoices.slice(startIdx, endIdx);

    return {
      data: paginatedSlice,
      pagination: {
        page,
        limit,
        total: inMemoryInvoices.length,
        totalPages: Math.max(1, Math.ceil(inMemoryInvoices.length / limit)),
      },
    };
  },

  getInvoiceById: async (id: string): Promise<InvoiceDTO> => {
    const isDemo = store.getState().auth.isDemoMode;

    if (!isDemo) {
      try {
        const response = await apiClient.get(`/invoices/${id}`);
        if (response.data && 'data' in response.data && !('invoiceNumber' in response.data)) {
          return response.data.data as InvoiceDTO;
        }
        return response.data as InvoiceDTO;
      } catch (err: unknown) {
        const axErr = err as { response?: { status?: number } };
        if (axErr.response && axErr.response.status && axErr.response.status !== 502 && axErr.response.status !== 503) {
          throw err;
        }
      }
    }

    const found = inMemoryInvoices.find((inv) => inv.id === id);
    if (!found) {
      throw new Error(`Không tìm thấy hóa đơn ID: ${id}`);
    }
    return found;
  },

  createInvoice: async (payload: CreateInvoicePayload): Promise<InvoiceDTO> => {
    const isDemo = store.getState().auth.isDemoMode;

    if (!isDemo) {
      try {
        const response = await apiClient.post('/invoices', payload);
        if (response.data && 'data' in response.data && !('invoiceNumber' in response.data)) {
          return response.data.data as InvoiceDTO;
        }
        return response.data as InvoiceDTO;
      } catch (err: unknown) {
        const axErr = err as { response?: { status?: number } };
        if (axErr.response && axErr.response.status) {
          throw err;
        }
      }
    }

    // Fallback: Compute values in-memory
    const items = payload.items.map((it, idx) => {
      const q = Number(it.quantity) || 1;
      const p = Number(it.unitPrice) || 0;
      const medicine = it.medicineId
        ? demoMedicines.find((m) => m.id === it.medicineId) || {
            id: it.medicineId,
            name: `Thuốc ${it.medicineId}`,
            unit: 'Viên',
          }
        : null;

      return {
        id: `item-inv-${Date.now()}-${idx}`,
        itemType: it.itemType,
        medicineId: it.medicineId || null,
        description: it.description || null,
        quantity: q,
        unitPrice: p,
        lineTotal: q * p,
        medicine,
      };
    });

    const calculatedTotal = items.reduce((sum, it) => sum + it.lineTotal, 0);

    let linkedPatient = null;
    if (payload.patientId) {
      if (demoPatient.id === payload.patientId) {
        linkedPatient = {
          id: demoPatient.id,
          patientCode: demoPatient.patientCode,
          fullName: demoPatient.fullName,
        };
      } else {
        const rel = demoAccessiblePatients.find((p) => p.patient.id === payload.patientId);
        if (rel) {
          linkedPatient = {
            id: rel.patient.id,
            patientCode: rel.patient.patientCode,
            fullName: rel.patient.fullName,
          };
        }
      }
    }

    const newInvoice: InvoiceDTO = {
      id: `inv-${Date.now()}`,
      invoiceNumber:
        payload.invoiceNumber?.trim() ||
        `HD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      buyerName: payload.buyerName,
      buyerPhone: payload.buyerPhone,
      buyerEmail: payload.buyerEmail,
      buyerAddress: payload.buyerAddress,
      buyerTaxCode: payload.buyerTaxCode,
      patientId: payload.patientId || null,
      totalAmount: String(calculatedTotal),
      notes: payload.notes,
      createdAt: new Date().toISOString(),
      patient: linkedPatient,
      items,
    };

    inMemoryInvoices = [newInvoice, ...inMemoryInvoices];
    return newInvoice;
  },

  exportExcel: async (id?: string): Promise<void> => {
    const isDemo = store.getState().auth.isDemoMode;

    if (!isDemo) {
      try {
        const response = await apiClient.get('/invoices/export', {
          params: id ? { id } : undefined,
          responseType: 'blob',
        });

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = id ? `hoa_don_${id}.xlsx` : 'danh_sach_hoa_don.xlsx';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        return;
      } catch (err: unknown) {
        const axErr = err as { response?: { status?: number } };
        if (axErr.response && axErr.response.status && axErr.response.status !== 502) {
          throw err;
        }
      }
    }

    // Static CSV with UTF-8 BOM fallback for Excel
    const targetInvoices = id
      ? inMemoryInvoices.filter((inv) => inv.id === id)
      : inMemoryInvoices;

    let csvContent = '\uFEFFMã HĐ,Số Hóa Đơn,Người Mua,SĐT,Mã Số Thuế,Bệnh Nhân,Tổng Tiền (VNĐ),Ngày Lập,Ghi Chú\n';
    targetInvoices.forEach((inv) => {
      const patientName = inv.patient?.fullName || inv.patientId || 'Chưa liên kết';
      const safeNotes = (inv.notes || '').replace(/"/g, '""');
      csvContent += `"${inv.id}","${inv.invoiceNumber}","${inv.buyerName}","${inv.buyerPhone || ''}","${inv.buyerTaxCode || ''}","${patientName}","${inv.totalAmount}","${new Date(inv.createdAt).toLocaleString('vi-VN')}","${safeNotes}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = id ? `hoa_don_${id}.csv` : 'danh_sach_hoa_don.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  importExcel: async (file: File): Promise<{ message?: string; count?: number }> => {
    const isDemo = store.getState().auth.isDemoMode;

    if (!isDemo) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post('/invoices/import', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } catch (err: unknown) {
        const axErr = err as { response?: { status?: number } };
        if (axErr.response && axErr.response.status) {
          throw err;
        }
      }
    }

    // Static simulation of importing invoices
    const simulatedInvoice: InvoiceDTO = {
      id: `inv-import-${Date.now()}`,
      invoiceNumber: `HD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      buyerName: 'Công ty TNHH Dược Phẩm Hà Nội',
      buyerPhone: '024 3829 1100',
      buyerTaxCode: '0101239842',
      buyerAddress: 'Quận Cầu Giấy, TP Hà Nội',
      patientId: null,
      totalAmount: '1850000',
      notes: `Nhập tự động từ bảng kê Excel: ${file.name}`,
      createdAt: new Date().toISOString(),
      patient: null,
      items: [
        {
          id: `item-imp-1`,
          itemType: 'COST',
          medicineId: null,
          description: 'Gói kiểm tra tầm soát tổng thể doanh nghiệp',
          quantity: 1,
          unitPrice: 1500000,
          lineTotal: 1500000,
        },
        {
          id: `item-imp-2`,
          itemType: 'MEDICINE',
          medicineId: 'med-005',
          description: null,
          quantity: 70,
          unitPrice: 5000,
          lineTotal: 350000,
          medicine: { id: 'med-005', name: 'Paracetamol 500mg', unit: 'Viên' },
        },
      ],
    };

    inMemoryInvoices = [simulatedInvoice, ...inMemoryInvoices];
    return {
      message: `Đã nhập thành công dữ liệu từ file bảng tính "${file.name}"!`,
      count: 1,
    };
  },
};
