import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from './client';
import { RealtimeNotificationPayload } from '../types';

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
  const socketUrl = `${baseUrl}/notifications`;

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
      // Socket connected
    });

    socket.on('notification', (data: RealtimeNotificationPayload) => {
      if (data && onNotificationReceived) {
        onNotificationReceived(data);
      }
    });

    socket.on('connect_error', () => {
      // Connect error - will retry automatically
    });

    socket.on('disconnect', () => {
      // Socket disconnected
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
