import {
  useCachedMutation,
  MutationCallbacks,
} from "@/features/shared/hooks/useCachedMutation";
import { commitReadNotification } from "@/api/cacheUpdates";
import { notificationsApi } from "@/api/endpoints/notifications.api";

const markNotificationReadRequest = (id: number) =>
  notificationsApi.markAsRead(id);
export function useMarkNotificationRead(
  callbacks: MutationCallbacks<
    Awaited<ReturnType<typeof markNotificationReadRequest>>,
    Parameters<typeof markNotificationReadRequest>[0]
  > = {},
) {
  return useCachedMutation(
    markNotificationReadRequest,
    async (client, userId, data) => {
      await commitReadNotification(client, userId, data);
    },
    callbacks,
  );
}
