import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/store/index';
import { showRealtimeToast } from '@/store/slices/uiSlice';
import { connectNotificationsSocket, disconnectNotificationsSocket } from '@/services/socket';
import { syncStaffCache } from '@/api/cacheUpdates';
import { isStaffRole } from '@/routes/access';

export function useRealtimeNotifications() {
  const client = useQueryClient();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, accessToken } = useAppSelector(s => s.auth);
  useEffect(() => {
    if (isAuthenticated && accessToken && isStaffRole(user?.role)) {
      connectNotificationsSocket(accessToken, payload => {
        dispatch(showRealtimeToast({
          title: payload.title || 'Thông báo mới',
          message: payload.message || '',
          type: payload.type || 'SYSTEM',
        }));
        // Events contain no entity/ID, so reconcile the existing filtered pages.
        void syncStaffCache(client, 'notifications', user!.id);
        void syncStaffCache(client, 'appointments', user!.id);
      });
    } else {
      disconnectNotificationsSocket();
    }
    return () => { disconnectNotificationsSocket(); };
  }, [client, dispatch, user?.id, user?.role, isAuthenticated, accessToken]);
}
