// ملف: lib/axios.ts

import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { getLoadingFunctions } from "@/contexts/LoadingContext";

// Prefer same-origin relative API to leverage Next.js rewrites and avoid CORS preflights
// Fallback to explicit URL only if no rewrite environment is used
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL
  : "";

const api = axios.create({
  baseURL: API_BASE_URL,
  // Avoid cross-site cookies; we use Authorization Bearer tokens
  withCredentials: true,
  timeout: 30000, // Increased timeout for better reliability
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// We need a flag to prevent infinite refresh loops
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Add debug logs for development
if (process.env.NODE_ENV !== "production") {
  console.log("API Base URL:", API_BASE_URL || "<same-origin>");
  console.log("Environment:", process.env.NODE_ENV);
}

// Load token from localStorage on startup
if (typeof window !== "undefined") {
  const token = localStorage.getItem("token");
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (process.env.NODE_ENV === "development") {
      console.log("Token loaded from localStorage");
    }
  }
}

// Request interceptor to start loading
api.interceptors.request.use(
  (config) => {
    const loadingFunctions = getLoadingFunctions();
    if (loadingFunctions) {
      loadingFunctions.startLoading();
    }

    const authState = useAuthStore.getState();
    const token =
      authState.token ||
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    if (token) {
      if (!config.headers) {
        // @ts-ignore
        config.headers = {};
      }
      // @ts-ignore
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    const loadingFunctions = getLoadingFunctions();
    if (loadingFunctions) {
      loadingFunctions.stopLoading();
    }
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Stop loading on successful response
    const loadingFunctions = getLoadingFunctions();
    if (loadingFunctions) {
      loadingFunctions.stopLoading();
    }
    return response;
  },
  async (error) => {
    // Stop loading on error response
    const loadingFunctions = getLoadingFunctions();
    if (loadingFunctions) {
      loadingFunctions.stopLoading();
    }

    // Log the error in development only
    if (
      process.env.NODE_ENV !== "production" &&
      error.response?.status !== 401
    ) {
      console.log("API Error:", error.response?.status, error.config?.url);
    }

    const originalRequest = error.config;

    // 1. Don't retry if it's already a retry
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // 2. Don't retry for login/refresh/logout endpoints to avoid loops
    if (
      originalRequest.url &&
      (originalRequest.url.includes("/api/refresh") ||
        originalRequest.url.includes("/api/login") ||
        originalRequest.url.includes("/api/logout"))
    ) {
      return Promise.reject(error);
    }

    // 3. Handle 401 Unauthorized
    if (error.response?.status === 401) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          // We can use a simple array or just chain to the existing promise if we exposed it,
          // but since we have `refreshPromise`, we can wait for it.
          if (refreshPromise) {
            refreshPromise
              .then((success) => {
                if (success) {
                  // Update token in header
                  const newToken = useAuthStore.getState().token;
                  if (newToken) {
                    // @ts-ignore
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                  }
                  resolve(api(originalRequest));
                } else {
                  reject(error);
                }
              })
              .catch((err) => reject(err));
          } else {
            // Should not happen if isRefreshing is true
            reject(error);
          }
        });
      }

      // Start refreshing
      isRefreshing = true;
      refreshPromise = useAuthStore.getState().refreshToken();

      try {
        const success = await refreshPromise;
        isRefreshing = false;
        refreshPromise = null;

        if (success) {
          // Update token for this request
          const newToken = useAuthStore.getState().token;
          if (newToken) {
            if (!originalRequest.headers) {
              // @ts-ignore
              originalRequest.headers = {};
            }
            // @ts-ignore
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        } else {
          // Refresh failed - logout
          await useAuthStore
            .getState()
            .logout({ skipRequest: true, redirectToLogin: true });
          return Promise.reject(error);
        }
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
