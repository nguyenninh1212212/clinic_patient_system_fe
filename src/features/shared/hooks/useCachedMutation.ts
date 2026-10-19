import { useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { store, useAppSelector } from '@/store/index';

export interface MutationCallbacks<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: unknown) => void;
}
export function useCachedMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  sync: (client: QueryClient, userId: string, data: T, variables: V) => Promise<void>,
  callbacks: MutationCallbacks<T, V> = {},
) {
  const client = useQueryClient();
  const user = useAppSelector(state => state.auth.user);
  return useMutation({
    mutationFn,
    onSuccess: async (data, variables) => {
      if (!user || store.getState().auth.user !== user) return;
      await sync(client, user.id, data, variables);
      if (store.getState().auth.user === user) callbacks.onSuccess?.(data, variables);
    },
    onError: error => {
      if (store.getState().auth.user === user) callbacks.onError?.(error);
    },
  });
}
