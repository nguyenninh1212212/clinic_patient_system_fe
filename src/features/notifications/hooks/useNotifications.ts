import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/api/endpoints/notifications.api';
import { queryKeys } from '@/api/queryKeys';
import { useStaffScope } from '@/features/shared/hooks/useStaffScope';

export function useNotifications(filters: { page: number; limit: number }, options: { enabled?: boolean; refetchInterval?: number } = {}) {
  const scope = useStaffScope();
  return useQuery({ queryKey: queryKeys.staff.resource('notifications', scope.userId, filters), queryFn: () => notificationsApi.getNotifications(filters), enabled: scope.enabled && options.enabled !== false, refetchInterval: options.refetchInterval });
}
