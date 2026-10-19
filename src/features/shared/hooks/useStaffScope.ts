import { useAppSelector } from '@/store/index';
import { isStaffRole } from '@/routes/access';

export function useStaffScope() {
  const { user, isAuthenticated } = useAppSelector(s => s.auth);
  return { userId: user?.id ?? '', enabled: isAuthenticated && isStaffRole(user?.role) };
}
