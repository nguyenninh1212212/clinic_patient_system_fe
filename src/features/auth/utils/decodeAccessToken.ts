import { z } from 'zod';
import type { IUser } from '@/types/auth.types';

const accessTokenPayload = z.object({
  id: z.string().min(1),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN', 'STAFF', 'MANAGER', 'GUEST']),
  email: z.string(),
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
  if (payload.exp * 1000 <= Date.now()) {
    throw new Error('Access token đã hết hạn.');
  }
  return {
    id: payload.id,
    role: payload.role,
    email: payload.email,
    fullName: payload.fullName,
    department: typeof payload.department === 'string'
      ? payload.department
      : payload.department?.departmentCode ?? null,
  };
}
