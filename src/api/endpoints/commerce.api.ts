import { apiClient } from "@/api/axios";

export type InvoiceStatus =
  "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "REFUND_PENDING" | "REFUNDED";
export interface CommerceItem {
  id: string;
  medicine_id: string;
  description: string;
  quantity: string;
  unit_price: string;
  line_total: string;
}
export interface Dispensing {
  id: string;
  invoice_id: string;
  invoice_number?: string;
  buyer_name?: string;
  status: "PENDING" | "PREPARING" | "READY" | "DISPENSED" | "CANCELLED";
  items?: { name: string; quantity: string }[];
}
export interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  buyer_name: string;
  prescription_id: string | null;
  status: InvoiceStatus | null;
  total_amount: string;
  purchase_channel: "COUNTER" | "ONLINE";
  items?: CommerceItem[];
  dispensing?: Dispensing | null;
}
export interface PaymentAttempt {
  id: string;
  method: string;
  status: string;
  amount: string;
  checkout_url: string | null;
  expires_at: string;
  paid_at: string | null;
}
export interface Capabilities {
  cash: boolean;
  pharmacyRead: boolean;
  pharmacyWrite: boolean;
  price: boolean;
  refund: boolean;
}
export interface PurchasePrescription {
  id: string;
  status: "DRAFT" | "ISSUED" | "CANCELLED";
  issuedAt: string | null;
  validUntil: string | null;
  notes?: string;
  items: {
    id: string;
    quantity: number;
    dosage: string;
    frequency: string;
    duration: string;
    medicine: { name: string; unit: string,sellingPrice:number };
  }[];
}
export const commerceApi = {
  prescriptions: (
    patientId: string,
  ): Promise<{
    data: PurchasePrescription[];
    pagination: { totalPages: number };
  }> =>
    apiClient
      .get("/prescriptions", { params: { patientId, page: 1, limit: 100 } })
      .then((r) => r.data),
  purchase: (
    prescriptionId: string,
    purchaseChannel: "COUNTER" | "ONLINE",
  ): Promise<PurchaseInvoice> =>
    apiClient
      .post("/invoices", { prescriptionId, purchaseChannel })
      .then((r) => r.data),
  invoices: (params: {
    patientId: string;
    page: number;
    search?: string;
  }): Promise<{
    data: PurchaseInvoice[];
    pagination: { totalPages: number };
  }> =>
    apiClient
      .get("/invoices", { params: { ...params, limit: 20 } })
      .then((r) => r.data),
  invoice: (id: string): Promise<PurchaseInvoice> =>
    apiClient.get(`/invoices/${id}`).then((r) => r.data),
  payments: (id: string): Promise<PaymentAttempt[]> =>
    apiClient.get(`/invoices/${id}/payments`).then((r) => r.data),
  zalopay: (id: string): Promise<PaymentAttempt> =>
    apiClient.post(`/invoices/${id}/payments/zalopay`).then((r) => r.data),
  cancel: (id: string) =>
    apiClient.post(`/invoices/${id}/cancel`).then((r) => r.data),
  refund: (id: string, reason: string) =>
    apiClient.post(`/invoices/${id}/refunds`, { reason }).then((r) => r.data),
};
