import {
  CreatePrescriptionItemPayload,
  CreatePrescriptionPayload,
  PaginatedList,
  PrescriptionDTO,
  PrescriptionItemDTO,
  UpdatePrescriptionItemPayload,
  UpdatePrescriptionPayload,
} from '@/types/index';
import { demoMedicines, demoPatient, initialDemoPrescriptions } from '@/api/demoData';

// In-memory store used only in explicit demo mode
let inMemoryPrescriptions: PrescriptionDTO[] = JSON.parse(
  JSON.stringify(initialDemoPrescriptions)
);

export const demoPrescriptionsService = {
  getPrescriptions: async (params?: {
    page?: number;
    limit?: number;
    issuedAt?: string;
  }): Promise<PaginatedList<PrescriptionDTO>> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const issuedAt = params?.issuedAt;

    // Explicit demo mode
    let filtered = [...inMemoryPrescriptions];
    if (issuedAt) {
      const targetDate = issuedAt.slice(0, 10);
      filtered = filtered.filter((p) => p.issuedAt.startsWith(targetDate));
    }

    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    const paginatedSlice = filtered.slice(startIdx, endIdx);

    return {
      data: paginatedSlice,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      },
    };
  },

  getPrescriptionById: async (id: string): Promise<PrescriptionDTO> => {
    const found = inMemoryPrescriptions.find((p) => p.id === id);
    if (!found) {
      throw new Error(`Không tìm thấy đơn thuốc ID: ${id}`);
    }
    return found;
  },

  createPrescription: async (payload: CreatePrescriptionPayload): Promise<PrescriptionDTO> => {
    // Demo data
    const newPrescription: PrescriptionDTO = {
      id: `pres-${Date.now()}`,
      examinationId: payload.examinationId,
      notes: payload.notes || undefined,
      issuedAt: payload.issuedAt || new Date().toISOString(),
      validUntil: payload.validUntil || new Date(Date.now() + 7 * 86400000).toISOString(),
      pharmacyStatus: payload.pharmacyStatus || 'NEW',
      examination: {
        doctorId: 'doc-001',
        diagnosis: `Chẩn đoán theo đợt khám ${payload.examinationId}`,
        icd10Code: 'Z00.0',
        examinedAt: payload.issuedAt || new Date().toISOString(),
        patient: {
          id: demoPatient.id,
          fullName: demoPatient.fullName,
          dateOfBirth: demoPatient.dateOfBirth,
          gender: demoPatient.gender,
          phone: demoPatient.phone,
        },
      },
      items: [],
    };

    inMemoryPrescriptions = [newPrescription, ...inMemoryPrescriptions];
    return newPrescription;
  },

  updatePrescription: async (
    id: string,
    payload: UpdatePrescriptionPayload
  ): Promise<PrescriptionDTO> => {
    const index = inMemoryPrescriptions.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Không tìm thấy đơn thuốc ID: ${id}`);
    }

    const current = inMemoryPrescriptions[index];
    const updated: PrescriptionDTO = {
      ...current,
      notes: payload.notes !== undefined ? payload.notes : current.notes,
      validUntil: payload.validUntil !== undefined ? payload.validUntil : current.validUntil,
      pharmacyStatus: payload.pharmacyStatus !== undefined ? payload.pharmacyStatus : current.pharmacyStatus,
    };

    inMemoryPrescriptions[index] = updated;
    return updated;
  },

  deletePrescription: async (id: string): Promise<{ success: boolean; message?: string }> => {
    inMemoryPrescriptions = inMemoryPrescriptions.filter((p) => p.id !== id);
    return { success: true, message: 'Đã xóa đơn thuốc thành công' };
  },

  // Prescription Items endpoints
  getPrescriptionItems: async (prescriptionId: string): Promise<PrescriptionItemDTO[]> => {
    const pres = inMemoryPrescriptions.find((p) => p.id === prescriptionId);
    return pres?.items || [];
  },

  addPrescriptionItem: async (
    payload: CreatePrescriptionItemPayload
  ): Promise<PrescriptionItemDTO> => {
    // Demo data
    const matchedMed = demoMedicines.find((m) => m.id === payload.medicineId) || {
      id: payload.medicineId,
      name: `Thuốc ${payload.medicineId}`,
      genericName: payload.medicineId,
      unit: 'Viên',
    };

    const newItem: PrescriptionItemDTO = {
      id: `pitem-${Date.now()}`,
      prescriptionId: payload.prescriptionId,
      medicineId: payload.medicineId,
      quantity: Number(payload.quantity) || 1,
      dosage: payload.dosage,
      frequency: payload.frequency,
      duration: payload.duration,
      note: payload.note || undefined,
      medicine: matchedMed,
    };

    const presIndex = inMemoryPrescriptions.findIndex((p) => p.id === payload.prescriptionId);
    if (presIndex !== -1) {
      const currentItems = inMemoryPrescriptions[presIndex].items || [];
      inMemoryPrescriptions[presIndex].items = [...currentItems, newItem];
    }

    return newItem;
  },

  updatePrescriptionItem: async (
    id: string,
    payload: UpdatePrescriptionItemPayload
  ): Promise<PrescriptionItemDTO> => {
    // Demo data: find which prescription contains this item
    let updatedItem: PrescriptionItemDTO | null = null;
    for (const p of inMemoryPrescriptions) {
      if (p.items) {
        const itemIdx = p.items.findIndex((it) => it.id === id);
        if (itemIdx !== -1) {
          const current = p.items[itemIdx];
          const matchedMed = payload.medicineId
            ? demoMedicines.find((m) => m.id === payload.medicineId) || current.medicine
            : current.medicine;

          updatedItem = {
            ...current,
            medicineId: payload.medicineId ?? current.medicineId,
            quantity: payload.quantity !== undefined ? Number(payload.quantity) : current.quantity,
            dosage: payload.dosage ?? current.dosage,
            frequency: payload.frequency ?? current.frequency,
            duration: payload.duration ?? current.duration,
            note: payload.note !== undefined ? payload.note : current.note,
            medicine: matchedMed,
          };
          p.items[itemIdx] = updatedItem;
          break;
        }
      }
    }

    if (!updatedItem) {
      throw new Error(`Không tìm thấy dòng thuốc ID: ${id}`);
    }
    return updatedItem;
  },

  deletePrescriptionItem: async (id: string): Promise<{ success: boolean }> => {
    for (const p of inMemoryPrescriptions) {
      if (p.items) {
        p.items = p.items.filter((it) => it.id !== id);
      }
    }
    return { success: true };
  },
};
