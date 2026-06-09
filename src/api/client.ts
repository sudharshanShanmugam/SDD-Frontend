import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';
import { nanoid } from 'nanoid';

// ============================================================
// Config
// ============================================================

import { API_VERSION, API_TIMEOUT } from '@/config/constants';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
const TIMEOUT  = API_TIMEOUT;
const IS_DEV   = import.meta.env.DEV as boolean;

// ============================================================
// Axios Instance
// ============================================================

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL ? `${BASE_URL}/api/${API_VERSION}` : `/api/${API_VERSION}`,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client': 'sdd-platform-web',
    'X-Client-Version': __APP_VERSION__,
  },
  withCredentials: true,   // Send cookies for CSRF protection
});

// ============================================================
// Request Interceptor — Request ID + Logging
// ============================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Inject auth token from Zustand store
    try {
      const raw = localStorage.getItem('sdd_auth_v2');
      if (raw) {
        const stored = JSON.parse(raw) as { state?: { tokens?: { accessToken?: string } } };
        const token = stored?.state?.tokens?.accessToken;
        if (token) config.headers.set('Authorization', `Bearer ${token}`);
      }
    } catch { /* ignore */ }

    // Inject request ID for distributed tracing
    const requestId = nanoid();
    config.headers.set('X-Request-ID', requestId);
    // Store on config for response logging
    (config as InternalAxiosRequestConfig & { _requestId: string })._requestId = requestId;
    (config as InternalAxiosRequestConfig & { _startTime: number })._startTime  = Date.now();

    // Dev logging
    if (IS_DEV) {
      console.debug(
        `[API] → ${config.method?.toUpperCase()} ${config.url}`,
        { params: config.params, data: config.data }
      );
    }

    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// ============================================================
// Response Interceptor — Error handling
// ============================================================

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (IS_DEV) {
      const cfg = response.config as InternalAxiosRequestConfig & { _startTime?: number; _requestId?: string };
      const duration = cfg._startTime ? Date.now() - cfg._startTime : 0;
      console.debug(
        `[API] ← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`
      );
    }

    // Normalize backend pagination: { items, total, page, page_size } → { data, meta }
    const d = response.data;
    if (d && typeof d === 'object' && 'items' in d && !('data' in d)) {
      response.data = {
        data:  d.items,
        meta: {
          total:      d.total      ?? 0,
          page:       d.page       ?? 1,
          pageSize:   d.page_size  ?? 20,
          totalPages: Math.ceil((d.total ?? 0) / Math.max(d.page_size ?? 20, 1)),
        },
      };
    }

    return response;
  },

  (error: unknown) => {
    if (!isAxiosError(error)) return Promise.reject(error);

    // ── 401 — Unauthorized → auto logout ──────────────────
    // Skip auth endpoints (login, refresh) — let them surface the error normally
    const url = error.config?.url ?? '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/token');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      import('@store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // ── 403 — Permission denied ────────────────────────────
    if (error.response?.status === 403) {
      showErrorToast('Permission denied', 'You do not have permission to perform this action.');
    }

    // ── 429 — Rate limited ─────────────────────────────────
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      showErrorToast(
        'Rate limited',
        `Too many requests. Please try again in ${retryAfter ?? 'a moment'}.`
      );
    }

    // ── 500+ — Server errors ───────────────────────────────
    if (error.response?.status && error.response.status >= 500) {
      showErrorToast(
        'Server error',
        'An unexpected server error occurred. Please try again.'
      );
    }

    // ── Network error ──────────────────────────────────────
    if (!error.response && error.request) {
      showErrorToast(
        'Connection error',
        'Unable to connect to the server. Check your internet connection.'
      );
    }

    if (IS_DEV) {
      console.error('[API Error]', {
        status:  error.response?.status,
        url:     error.config?.url,
        message: (error.response?.data as { error?: { message?: string } })?.error?.message ?? error.message,
      });
    }

    return Promise.reject(error);
  }
);

// ============================================================
// Helpers
// ============================================================

function showErrorToast(title: string, message: string): void {
  // Dispatch a custom event to be caught by the toast system
  window.dispatchEvent(
    new CustomEvent('sdd:toast', {
      detail: { severity: 'error', title, message },
    })
  );
}

// ============================================================
// File Upload Instance (with progress)
// ============================================================

export function createUploadRequest(
  url: string,
  formData: FormData,
  onProgress?: (progress: number) => void,
  config?: AxiosRequestConfig
) {
  return apiClient.post(url, formData, {
    ...config,
    headers: {
      'Content-Type': 'multipart/form-data',
      ...config?.headers,
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
}

// ============================================================
// Typed API helpers
// ============================================================

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

export async function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}

// ============================================================
// Retry helper for network errors
// ============================================================

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Only retry network errors
      if (isAxiosError(error) && error.response) {
        throw error;
      }
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError;
}

// Vite define global type
declare const __APP_VERSION__: string;

export default apiClient;
