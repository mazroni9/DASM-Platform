// ملف: lib/axios.ts

import axios from "axios";
import { useAuthStore } from "@/store/authStore";

// Create a proper base URL with full URL including http/https
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 30000, // Increase timeout to 30 seconds for deployment
});

// We need a flag to prevent infinite refresh loops
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Add debug logs for development
console.log("API Base URL:", API_BASE_URL);
console.log("Environment:", process.env.NODE_ENV);

// Load token from localStorage on startup
if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        console.log("Token loaded from localStorage");
    } else {
        console.log("No token found in localStorage");
    }
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Log the error in development only and less verbosely
        if (
            process.env.NODE_ENV !== "production" &&
            error.response?.status !== 401
        ) {
            console.log(
                "API Error:",
                error.response?.status,
                error.config?.url
            );
        }

        const originalRequest = error.config;

        // Don't try to refresh token for refresh endpoint itself
        if (
            originalRequest.url &&
            (originalRequest.url.includes("/api/refresh") ||
                originalRequest.url.includes("/api/logout"))
        ) {
            return Promise.reject(error);
        }

        // Only attempt refresh for 401 errors and when not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Check if we're already on the login page or trying to login
            if (typeof window !== "undefined") {
                const currentPath = window.location.pathname;
                if (
                    currentPath.includes("/auth/login") ||
                    originalRequest.url.includes("/api/login")
                ) {
                    return Promise.reject(error);
                }
            }

            try {
                // Use a shared promise to prevent multiple refresh calls
                if (!isRefreshing) {
                    isRefreshing = true;
                    refreshPromise = useAuthStore.getState().refreshToken();
                }

                // Wait for the refresh to complete
                const refreshSuccess = await refreshPromise;
                isRefreshing = false;
                refreshPromise = null;

                if (refreshSuccess) {
                    // Update Authorization header with new token
                    const newToken = useAuthStore.getState().token;
                    originalRequest.headers[
                        "Authorization"
                    ] = `Bearer ${newToken}`;
                    return api(originalRequest);
                } else {
                    // If refresh failed, clear auth state and redirect
                    console.log("Token refresh failed, rejecting request");

                    // Redirect to login page only if we're not already redirecting
                    if (typeof window !== "undefined") {
                        const currentPath = window.location.pathname;
                        const isAlreadyOnLoginPage =
                            currentPath.includes("/auth/login");

                        if (!isAlreadyOnLoginPage) {
                            const isRedirecting = sessionStorage.getItem(
                                "redirecting_to_login"
                            );

                            if (!isRedirecting) {
                                sessionStorage.setItem(
                                    "redirecting_to_login",
                                    "true"
                                );
                                console.log(
                                    "Auth refresh failed - redirecting to login"
                                );

                                // Immediate redirect without timeout
                                window.location.href = `/auth/login?returnUrl=${encodeURIComponent(
                                    currentPath
                                )}`;
                            }
                        }
                    }

                    return Promise.reject(error);
                }
            } catch (refreshError) {
                isRefreshing = false;
                refreshPromise = null;
                console.error("Error during token refresh:", refreshError);
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
