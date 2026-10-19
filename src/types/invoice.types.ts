import type { MedicineDTO } from './prescription.types';
export type InvoiceItemType = 'MEDICINE' | 'COST';

export interface InvoiceItemDTO {
  id: string;
  invoiceId?: string;
  itemType: InvoiceItemType;
  medicineId: string | null;
  description: string | null;
  quantity: string | number;
  unitPrice: string | number;
  lineTotal: string | number;
  medicine?: MedicineDTO | null;
}



export interface InvoiceDTO {
  id: string;
  invoiceNumber: string;
  buyerName: string;
  buyerPhone?: string;
  buyerEmail?: string;
  buyerAddress?: string;
  buyerTaxCode?: string;
  patientId?: string | null;
  totalAmount: string | number;
  notes?: string;
  createdAt: string;
  patient?: {
    id: string;
    patientCode: string;
    fullName: string;
  } | null;
  items?: InvoiceItemDTO[];
}

// Confirmed CreateInvoiceDto / CreateInvoiceItemDto from the backend.
export interface CreateInvoiceItemPayload {
  itemType: InvoiceItemType;
  medicineId?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}
export interface CreateInvoicePayload {
  buyerName: string;
  buyerPhone?: string;
  buyerEmail?: string;
  buyerAddress?: string;
  buyerTaxCode?: string;
  patientId?: string;
  invoiceNumber?: string;
  notes?: string;
  items: CreateInvoiceItemPayload[];
}
