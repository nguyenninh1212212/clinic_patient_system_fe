import { z } from 'zod';
import type { IUser } from '@/types/auth.types';

const accessTokenPayload = z.object({
  id: z.string().min(1),
  sub: z.string().min(1),
  accountType: z.literal('PATIENT'),
  tokenUse: z.literal('ACCESS'),
  role: z.literal('USER'),
  email: z.string(),
  phone: z.string().nullable().optional(),
  fullName: z.string(),
  department: z.union([
    z.string(),
    z.object({ departmentCode: z.string() }),
  ]).nullish(),
  exp: z.number().finite(),
});

// Decode server-issued claims for UI state; the backend validates token signatures.
export function decodeAccessToken(accessToken: string): IUser {
  const parts = accessToken.split('.');
  if (parts.length !== 3 || parts.some(part => !part)) {
    throw new Error('Access token không hợp lệ.');
  }
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), char => char.charCodeAt(0));
  const payload = accessTokenPayload.parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
  if (payload.sub !== payload.id) throw new Error('Định danh access token không hợp lệ.');
  if (payload.exp * 1000 <= Date.now()) {
    throw new Error('Access token đã hết hạn.');
  }
  return {
    id: payload.id,
    accountType: 'PATIENT',
    role: payload.role,
    email: payload.email,
    phone: payload.phone ?? null,
    fullName: payload.fullName,
    department: typeof payload.department === 'string'
      ? payload.department
      : payload.department?.departmentCode ?? null,
  };
}
