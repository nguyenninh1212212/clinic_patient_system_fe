import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setMemoryAccessToken, store } from '@/store/index';
import { logoutAction, setAccessToken } from '@/store/slices/authSlice';

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('PATIENT_PORTAL_API_URL');
    if (saved) return saved;
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
};



export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true, // Enables sending and receiving HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Update baseURL if changed
export const updateApiBaseUrl = (newUrl: string) => {
  apiClient.defaults.baseURL = newUrl;
};

// Queue mechanism for handling 401 token refresh race conditions
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: Attach Bearer access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Dynamic baseURL sync
    config.baseURL = getApiBaseUrl();

    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 & silent refresh token via /auth/refresh-token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 on /auth/refresh-token or /auth/login itself, don't loop
    if (
      originalRequest?.url?.includes('/auth/refresh-token') ||
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Send refresh token request with credentials (HTTP-only cookie)
        const refreshResponse = await axios.post<{ accessToken: string }>(
          `${getApiBaseUrl()}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.accessToken;
        setMemoryAccessToken(newAccessToken);
        store.dispatch(setAccessToken(newAccessToken));

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError, null);
        setMemoryAccessToken(null);
        store.dispatch(logoutAction());
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
