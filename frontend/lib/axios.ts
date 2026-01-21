// ملف: lib/axios.ts
import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/store/authStore";
import { getLoadingFunctions } from "@/contexts/LoadingContext";

// Prefer same-origin relative API to leverage Next.js rewrites and avoid CORS
// Fallback to explicit URL only if no rewrite environment is used
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const api = axios.create({
  baseURL: API_BASE_URL, // "" => same-origin (recommended with Next rewrites)
  withCredentials: true, // needed for refresh_token HttpOnly cookie
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// Prevent infinite refresh loops
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Debug logs in dev
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.log("API Base URL:", API_BASE_URL || "<same-origin>");
  // eslint-disable-next-line no-console
  console.log("Environment:", process.env.NODE_ENV);
}

// Load token from localStorage on startup
if (typeof window !== "undefined") {
  const token = localStorage.getItem("token");
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("Token loaded from localStorage");
    }
  }
}

// routes/api.php عندك فيه /api/auth/refresh و /api/refresh (legacy)
// فخلينا نغطي الاتنين
const isAuthEndpoint = (url: string) =>
  url.includes("/api/refresh") ||
  url.includes("/api/auth/refresh") ||
  url.includes("/api/login") ||
  url.includes("/api/auth/login") ||
  url.includes("/api/logout");

const isRefreshEndpoint = (url: string) =>
  url.includes("/api/refresh") || url.includes("/api/auth/refresh");

const toAxiosHeaders = (h: InternalAxiosRequestConfig["headers"]) =>
  AxiosHeaders.from(h);

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const loadingFunctions = getLoadingFunctions();
    loadingFunctions?.startLoading();

    const authState = useAuthStore.getState();
    const token =
      authState.token ||
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    const url = config.url || "";

    // Normalize headers to AxiosHeaders to satisfy TS + safe set/get/delete
    const headers = toAxiosHeaders(config.headers);

    // ✅ Critical: NEVER send Bearer on refresh (even if defaults has it)
    if (isRefreshEndpoint(url)) {
      headers.delete("Authorization");
      config.headers = headers;
      return config;
    }

    // ✅ Inject Bearer token if available and Authorization not explicitly set
    if (token) {
      // if Authorization key exists (even empty string), do NOT override
      const hasAuthHeaderAlready = headers.has("Authorization");
      if (!hasAuthHeaderAlready) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    config.headers = headers;
    return config;
  },
  (error) => {
    const loadingFunctions = getLoadingFunctions();
    loadingFunctions?.stopLoading();
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const loadingFunctions = getLoadingFunctions();
    loadingFunctions?.stopLoading();
    return response;
  },
  async (error: AxiosError) => {
    const loadingFunctions = getLoadingFunctions();
    loadingFunctions?.stopLoading();

    if (process.env.NODE_ENV !== "production" && error.response?.status !== 401) {
      // eslint-disable-next-line no-console
      console.log("API Error:", error.response?.status, error.config?.url);
    }

    const originalRequest = (error.config ??
      {}) as InternalAxiosRequestConfig & { _retry?: boolean };

    // 1) Don't retry if already retried
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";

    // 2) Don't retry for login/refresh/logout endpoints to avoid loops
    if (url && isAuthEndpoint(url)) {
      return Promise.reject(error);
    }

    // 3) Handle 401 Unauthorized
    if (error.response?.status === 401) {
      originalRequest._retry = true;

      const authState = useAuthStore.getState();
      const token =
        authState.token ||
        (typeof window !== "undefined" ? localStorage.getItem("token") : null);

      // Check if the original request actually had Bearer
      const reqHeaders = toAxiosHeaders(originalRequest.headers);
      const reqAuthHeader = reqHeaders.get("Authorization") ?? "";
      const hadBearerOnRequest =
        typeof reqAuthHeader === "string" && reqAuthHeader.startsWith("Bearer ");

      // ✅ Critical: do NOT refresh if request wasn't authenticated OR no token exists
      if (!token || !hadBearerOnRequest) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          if (!refreshPromise) return reject(error);

          refreshPromise
            .then((success) => {
              if (!success) return reject(error);

              const newToken = useAuthStore.getState().token;
              if (newToken) {
                const h = toAxiosHeaders(originalRequest.headers);
                h.set("Authorization", `Bearer ${newToken}`);
                originalRequest.headers = h;
              }

              resolve(api(originalRequest));
            })
            .catch((err) => reject(err));
        });
      }

      isRefreshing = true;
      refreshPromise = useAuthStore.getState().refreshToken();

      try {
        const success = await refreshPromise;

        isRefreshing = false;
        refreshPromise = null;

        if (success) {
          const newToken = useAuthStore.getState().token;
          if (newToken) {
            const h = toAxiosHeaders(originalRequest.headers);
            h.set("Authorization", `Bearer ${newToken}`);
            originalRequest.headers = h;
          }
          return api(originalRequest);
        }

        // Refresh failed -> logout locally (no backend call)
        await useAuthStore
          .getState()
          .logout({ skipRequest: true, redirectToLogin: true });

        return Promise.reject(error);
      } catch (refreshError) {
        isRefreshing = false;
        refreshPromise = null;

        await useAuthStore
          .getState()
          .logout({ skipRequest: true, redirectToLogin: true });

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
