import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { patientAccessEndpoints } from '@/api/endpoints/patient-access.api';
import { queryKeys } from '@/api/queryKeys';
import { useAppSelector } from '@/store/index';

export function useMyPatients() {
  const { user, isAuthenticated, isDemoMode } = useAppSelector(s => s.auth);
  return useQuery({
    queryKey: queryKeys.patient.profiles(user?.id ?? ''),
    queryFn: ({ signal }) => patientAccessEndpoints.myPatients(user?.id ?? '', signal),
    enabled: isAuthenticated && user?.role === 'USER' && !isDemoMode,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    placeholderData: undefined,
    gcTime: 0,
  });
}
export function useCheckAccess(patientId: string, linked: boolean) {
  const { user, isAuthenticated, isDemoMode } = useAppSelector(s => s.auth);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.patient.access(user?.id ?? '', patientId),
    queryFn: ({ signal }) => patientAccessEndpoints.check(patientId, signal),
    enabled: isAuthenticated && user?.role === 'USER' && !isDemoMode && !!patientId && linked,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
    placeholderData: undefined,
    gcTime: 0,
  });
  useEffect(() => {
    if (!linked || query.isError || (query.isSuccess && (!query.data || query.data.userId !== user?.id))) {
      const prefix = ['patient-portal', user?.id ?? '', patientId];
      void client.cancelQueries({ queryKey: prefix, predicate: q => q.queryKey[3] !== 'access' });
      client.removeQueries({ queryKey: prefix, predicate: q => q.queryKey[3] !== 'access' });
    }
  }, [client, patientId, linked, user?.id, query.isError, query.isSuccess, query.data]);
  return query;
}
