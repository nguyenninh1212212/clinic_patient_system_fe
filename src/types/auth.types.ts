export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'STAFF' | 'MANAGER' | 'GUEST';

export interface IUser {
  accountType?: 'PATIENT' | 'STAFF';
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  department: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: IUser;
}

