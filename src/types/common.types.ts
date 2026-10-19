import type { UserRole } from './auth.types';
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

// Roles confirmed in backend UserRole; no separate PATIENT / DOCTOR / NURSE role.
