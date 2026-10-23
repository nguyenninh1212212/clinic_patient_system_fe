import { queryClient } from '@/api/queryClient';
import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '@/api/axios';
import { RealtimeNotificationPayload } from '@/types/index';

let socket: Socket | null = null;

export const connectNotificationsSocket = (
  accessToken: string,
  onNotificationReceived: (payload: RealtimeNotificationPayload) => void
): Socket | null => {
  if (!accessToken) {
    disconnectNotificationsSocket();
    return null;
  }

  // If already connected with same auth, avoid reconnecting
  if (socket && socket.connected) {
    return socket;
  }

  const baseUrl = getApiBaseUrl();
  const socketUrl = new URL(baseUrl).origin;

  try {
    socket = io(socketUrl, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      for (const key of ['commerce', 'notifications', 'appointments', 'prescriptions']) void queryClient.invalidateQueries({queryKey:[key]});
    });
    const seen=new Set<string>();
    for(const name of ['PRESCRIPTION.ISSUED','INVOICE.CREATED','INVOICE.PAID','INVOICE.CANCELLED','PHARMACY.DISPENSING_REQUESTED','PHARMACY.DISPENSING_READY','PHARMACY.DISPENSING_COMPLETED']) {
      socket.on(name,(event:{eventId?:string})=>{
        if(event.eventId&&seen.has(event.eventId)) return;
        if(event.eventId) seen.add(event.eventId);
        if(seen.size>1000) seen.clear();
        void queryClient.invalidateQueries({queryKey:['commerce']});
      });
    }

    socket.on('notification', (data: RealtimeNotificationPayload) => {
      if (data && onNotificationReceived) {
        onNotificationReceived(data);
      }
    });

    socket.on('connect_error', () => {
    });

    socket.on('disconnect', () => {
    });

    return socket;
  } catch {
    return null;
  }
};

export const disconnectNotificationsSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
