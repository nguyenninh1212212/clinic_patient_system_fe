import type { AuthResponse, IUser } from '@/types/auth.types';

export function requirePatientUser(user: IUser): IUser {
  if (!user || user.role !== 'USER' || user.accountType !== 'PATIENT') {
    throw new Error('Vui lòng dùng tài khoản người bệnh để đăng nhập.');
  }
  return user;
}

export function requirePatientSession(session: AuthResponse): AuthResponse {
  requirePatientUser(session.user);
  return session;
}
