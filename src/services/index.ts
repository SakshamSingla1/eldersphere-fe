import axios, { type AxiosRequestConfig, type Method } from "axios";
import type { ApiEnvelope } from "../utils/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// The backend issues both an httpOnly access-token cookie and an httpOnly refresh-token
// cookie on login (see AuthController#setAuthCookies) — its JwtAuthFilter accepts a
// Bearer header OR that cookie, so the simplest and most robust approach for the SPA is
// to rely entirely on the cookie and never touch the token in JS (it isn't readable from
// JS anyway since it's httpOnly). CORS on the backend has allowCredentials(true) for the
// configured frontend origins, so this works cross-port in local dev.
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: Array<(ok: boolean) => void> = [];

const notifySubscribers = (ok: boolean) => {
  refreshSubscribers.forEach((cb) => cb(ok));
  refreshSubscribers = [];
};

const AUTH_FREE_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/forgot-password", "/auth/reset-password"];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | null;
    const requestUrl = originalRequest?.url ?? "";
    const isAuthFreePath = AUTH_FREE_PATHS.some((p) => requestUrl.includes(p));

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthFreePath) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((ok) => (ok ? resolve(apiClient(originalRequest)) : reject(error)));
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        isRefreshing = false;
        notifySubscribers(true);
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        notifySubscribers(false);
        localStorage.removeItem("es_user");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?auth=expired";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Calls the backend and unwraps com.eldersphere.payload.ResponseModel<T> down to just `T`.
 * Throws the original axios error on failure so callers can read `err.response?.data?.message`
 * (the human-readable message the GlobalExceptionHandler always sets) and `err.response?.data?.errorCode`.
 */
export async function request<T = unknown>(
  method: Method,
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.request<ApiEnvelope<T>>({
    method,
    url,
    data,
    ...config,
  });
  return response.data.data;
}
