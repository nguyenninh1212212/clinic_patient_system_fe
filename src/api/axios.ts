import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setMemoryAccessToken, store } from '@/store/index';
import { logoutAction, setCredentials } from '@/store/slices/authSlice';
import { requirePatientUser } from '@/features/auth/utils/patient-session';

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('PATIENT_PORTAL_API_URL');
    if (saved) return saved;
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
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

// Response interceptor: Handle 401 & silent refresh token via /auth/patients/refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 on /auth/patient/refresh or /auth/login itself, don't loop
    if (
      originalRequest?.url?.includes('/auth/patients/refresh') ||
      originalRequest?.url?.includes('/auth/patients/me') ||
      originalRequest?.url?.includes('/auth/patients/login') ||
      originalRequest?.url?.includes('/auth/patients/register') 
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
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
        // Import lazily to avoid a circular dependency: authApi uses apiClient.
        const { authApi } = await import('@/api/endpoints/auth.api');
        const { accessToken: newAccessToken } = await authApi.refreshToken();
        // Match the staff portal: the backend, not JWT claims decoded in the
        // browser, is the authoritative source for the refreshed identity.
        const user = await authApi.getMe(newAccessToken);
        setMemoryAccessToken(newAccessToken);
        store.dispatch(
          setCredentials({
            user: requirePatientUser(user),
            accessToken: newAccessToken,
          }),
        );

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
