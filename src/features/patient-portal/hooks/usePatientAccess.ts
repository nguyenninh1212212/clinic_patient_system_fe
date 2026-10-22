import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { patientAccessEndpoints } from '@/api/endpoints/patient-access.api';
import { queryKeys } from '@/api/queryKeys';
import { useAppSelector } from '@/store/index';

// Keep linked-profile authorization briefly while moving between patient tabs.
// Mutations that change access must still invalidate these keys immediately.
const PATIENT_PORTAL_STALE_TIME = 30_000;
const PATIENT_PORTAL_CACHE_TIME = 5 * 60_000;

export function useMyPatients() {
  const { user, isAuthenticated, isDemoMode } = useAppSelector(s => s.auth);
  return useQuery({
    queryKey: queryKeys.patient.profiles(user?.id ?? ''),
    queryFn: ({ signal }) => patientAccessEndpoints.myPatients(user?.id ?? '', signal),
    enabled: isAuthenticated && user?.role === 'USER' && !isDemoMode,
    staleTime: PATIENT_PORTAL_STALE_TIME,
    refetchOnWindowFocus: false,
    placeholderData: undefined,
    gcTime: PATIENT_PORTAL_CACHE_TIME,
  });
}
export function useCheckAccess(patientId: string, linked: boolean) {
  const { user, isAuthenticated, isDemoMode } = useAppSelector(s => s.auth);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.patient.access(user?.id ?? '', patientId),
    queryFn: ({ signal }) => patientAccessEndpoints.check(patientId, signal),
    enabled: isAuthenticated && user?.role === 'USER' && !isDemoMode && !!patientId && linked,
    staleTime: PATIENT_PORTAL_STALE_TIME,
    refetchOnWindowFocus: false,
    placeholderData: undefined,
    gcTime: PATIENT_PORTAL_CACHE_TIME,
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
