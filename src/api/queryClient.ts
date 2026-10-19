import { QueryCache, QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (isAxiosError(error) && error.response?.status === 403 && query.queryKey[0] === 'patient-portal') {
        // Remove successful data too: a failed refetch must never expose stale private data.
        queryClient.removeQueries({ queryKey: ['patient-portal', query.queryKey[1]] });
      }
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (count, error) => !(isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) && count < 1,
      staleTime: 30_000,
    },
  },
});
