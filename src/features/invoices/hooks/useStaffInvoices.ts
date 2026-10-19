import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '@/api/endpoints/invoices.api';
import { queryKeys } from '@/api/queryKeys';
import { useAppSelector } from '@/store/index';
import { isStaffRole } from '@/routes/access';

export function useStaffInvoices(page: number, limit: number) {
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  return useQuery({
    queryKey: queryKeys.staff.invoices(user?.id ?? '', { page, limit }),
    queryFn: () => invoicesApi.getInvoices({ page, limit }),
    enabled: isAuthenticated && isStaffRole(user?.role),
    placeholderData: undefined,
  });
}
