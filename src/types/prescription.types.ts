export interface MedicineDTO {
  id: string;
  name: string;
  genericName?: string;
  unit: string;
}

// Prescription Schemas
export type PharmacyStatus = 'NEW' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface PrescriptionItemDTO {
  id: string;
  prescriptionId?: string;
  medicineId: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  note?: string;
  medicine?: MedicineDTO | null;
}

export interface CreatePrescriptionItemPayload {
  prescriptionId: string;
  medicineId: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  note?: string;
}

export interface UpdatePrescriptionItemPayload {
  medicineId?: string;
  quantity?: number;
  dosage?: string;
  frequency?: string;
  duration?: string;
  note?: string;
}

export interface PrescriptionDTO {
  id: string;
  examinationId: string;
  notes?: string;
  issuedAt: string;
  validUntil?: string;
  pharmacyStatus: PharmacyStatus;
  examination?: {
    doctorId?: string;
    diagnosis?: string;
    icd10Code?: string;
    examinedAt?: string;
    patient?: {
      id: string;
      fullName: string;
      dateOfBirth?: string;
      gender?: string;
      phone?: string;
    };
  };
  items?: PrescriptionItemDTO[];
}

export interface CreatePrescriptionPayload {
  examinationId: string;
  notes?: string;
  issuedAt?: string;
  validUntil?: string;
  pharmacyStatus?: PharmacyStatus;
}

export interface UpdatePrescriptionPayload {
  notes?: string;
  issuedAt?: string;
  validUntil?: string;
  pharmacyStatus?: PharmacyStatus;
}

// Invoice Schemas
