import { authApi } from '@/api/endpoints/auth.api';
import { useAppDispatch, setMemoryAccessToken } from '@/store/index';
import { setCredentials, loginAsDemo } from '@/store/slices/authSlice';
import type { AuthResponse } from '@/types/auth.types';

export function useAuthActions() {
  const dispatch = useAppDispatch();
  const saveSession = (session: AuthResponse) => {
    setMemoryAccessToken(session.accessToken);
    dispatch(setCredentials({ user: session.user, accessToken: session.accessToken }));
  };
  const login = async (credentials: Parameters<typeof authApi.login>[0]) => {
    saveSession(await authApi.login(credentials));
  };
  const registerAccount = async (payload: Parameters<typeof authApi.register>[0]) => {
    saveSession(await authApi.register(payload));
  };
  const loginDemo = (name?: string, email?: string) => {
    dispatch(loginAsDemo({
      id: 'demo-user-patient-001', email: email || 'patient.demo@phongkham.vn',
      role: 'USER', fullName: name || 'Nguyễn Văn An', department: null,
    }));
  };
  return { login, registerAccount, loginDemo };
}
