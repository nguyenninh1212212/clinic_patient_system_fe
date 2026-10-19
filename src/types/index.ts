// TypeScript Definitions for Patient Portal

export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
  pagination?: Pagination;
  timestamp: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedList<T> {
  data: T[];
  pagination: Pagination;
}

export interface IUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'STAFF' | string;
  fullName: string;
  department: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: IUser;
}

export interface PatientDTO {
  id: string;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | string;
  phone: string;
  address?: string;
  medicalHistory?: string;
  identityNumber?: string;
  insuranceCode?: string;
  email?: string;
  userId?: string;
}

export interface AccessDTO {
  id: string;
  patientId: string;
  createdBy: string;
  createdAt: string;
  patient: {
    id: string;
    patientCode: string;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
  };
}

export interface SpecialtyDTO {
  id: number;
  name: string;
  description?: string;
  iconUrl: string | null;
  isActive?: boolean;
}

export type DoctorDegree = 'MD' | 'MASTER' | 'PHD' | 'PROFESSOR' | 'ASSOCIATE_PROFESSOR';

export interface DoctorDTO {
  id: string;
  userId: string;
  specialtyId: number;
  licenseNumber?: string;
  bio?: string;
  degree: DoctorDegree;
  yearsOfExperience?: number;
  user: {
    id: string;
    fullName: string;
    avatar?: string;
  };
  specialty: {
    id: number;
    name: string;
    iconUrl: string | null;
  };
}

export interface DoctorShiftDTO {
  id: string;
  doctorId: string;
  workDate: string;
  startTime: string;
  endTime: string;
}

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'WAITING_TRIAGE'
  | 'TRIAGED'
  | 'IN_EXAMINATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  notes?: string;
}

export interface AppointmentSummary {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  status: AppointmentStatus;
  bookingType?: string;
  notes?: string;
  createdAt: string;
  patient?: {
    id: string;
    patientCode?: string;
    fullName: string;
    phone?: string;
  };
  doctor?: {
    id: string;
    degree?: DoctorDegree;
    user?: {
      fullName: string;
    };
    specialty?: {
      name: string;
    };
  };
}

export interface MyBookingsResponse {
  data: AppointmentSummary[];
  pagination: Pagination;
}

export interface NotificationDTO {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'SYSTEM' | 'EXAMINATION' | 'PRESCRIPTION' | string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsListResponse {
  notifications: NotificationDTO[];
  unRead: number;
}

export interface RealtimeNotificationPayload {
  title: string;
  message: string;
  type: string;
}

// Examination Schema
export interface ExaminationDTO {
  id: string;
  appointmentId?: string;
  doctorId?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  icd10Code?: string;
  followUpDate?: string;
  examinedAt?: string;
  patient?: {
    id: string;
    fullName: string;
    dateOfBirth?: string;
    gender?: string;
    phone?: string;
  };
  prescription?: PrescriptionDTO;
}

// Medicine Schema
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
