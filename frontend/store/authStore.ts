import { create } from "zustand";
import axios from "axios";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "@/lib/axios";

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoggedIn: boolean;
    loading: boolean;
    error: string | null;
    initialized: boolean;

    login: (
        email: string,
        password: string
    ) => Promise<{
        success: boolean;
        error?: string;
        needsVerification?: boolean;
    }>;
    verifyCode: (
        email: string,
        code: string
    ) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
    initializeFromStorage: () => Promise<boolean>;
}

// Create a proper base URL with full URL including http/https
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoggedIn: false,
            loading: false,
            error: null,
            initialized: false,

            initializeFromStorage: async () => {
                // Prevent multiple initializations
                if (get().initialized) return true;

                // Set initial loading state
                set({ loading: true });

                // Check for token in localStorage
                const token = localStorage.getItem("token");
                if (!token) {
                    set({ loading: false, initialized: true });
                    return false;
                }

                // Set axios auth header with the token
                axios.defaults.headers.common[
                    "Authorization"
                ] = `Bearer ${token}`;
                if (api.defaults) {
                    api.defaults.headers.common[
                        "Authorization"
                    ] = `Bearer ${token}`;
                }

                try {
                    console.log("Attempting to initialize from storage");
                    // Try to get the current user with the token
                    // Use the correct endpoint as defined in the backend routes
                    const response = await api.get(`/api/user/profile`);

                    // Check if the response has a data property and extract it
                    const userData = response.data.data || response.data;

                    set({
                        user: userData,
                        token,
                        isLoggedIn: true,
                        loading: false,
                        initialized: true,
                    });
                    console.log("Successfully initialized from storage");
                    return true;
                } catch (error) {
                    console.error("Failed to initialize from storage:", error);

                    // If unauthorized, clear invalid token and headers
                    if (error.response?.status === 401) {
                        localStorage.removeItem("token");
                        delete axios.defaults.headers.common["Authorization"];
                        if (api.defaults) {
                            delete api.defaults.headers.common["Authorization"];
                        }
                        // Optionally redirect to login
                        if (typeof window !== "undefined") {
                            window.location.href = "/auth/login";
                        }
                        return false;
                    }
                    // For other errors, just mark initialized without logging in
                    set({
                        loading: false,
                        initialized: true,
                    });

                    return false;
                }
            },

            login: async (email, password) => {
                set({ loading: true, error: null });
                try {
                    console.log("Attempting login");
                    const response = await api.post(`/api/login`, {
                        email,
                        password,
                    });

                    const data = response.data;
                    console.log("Login response:", data);

                    if (
                        data.status === "error" &&
                        data.message === "Email not verified"
                    ) {
                        set({ loading: false });
                        return { success: false, needsVerification: true };
                    }

                    // Store token in localStorage
                    localStorage.setItem("token", data.access_token);

                    // Extract user data properly
                    const userData =
                        data.user && data.user.data
                            ? data.user.data // Handle nested data structure
                            : data.user; // Use direct user object if no nesting

                    // Update the state
                    set({
                        user: userData,
                        token: data.access_token,
                        isLoggedIn: true,
                        loading: false,
                        error: null,
                    });

                    // Set default auth header for future requests
                    axios.defaults.headers.common[
                        "Authorization"
                    ] = `Bearer ${data.access_token}`;
                    if (api.defaults) {
                        api.defaults.headers.common[
                            "Authorization"
                        ] = `Bearer ${data.access_token}`;
                    }

                    return { success: true };
                } catch (err: any) {
                    // Log detailed error in development mode only
                    console.error("Login error details:", err);

                    // Extract user-friendly error message if available, or use generic message
                    let errorMessage = "حدث خطأ أثناء تسجيل الدخول";

                    if (err.response) {
                        // The request was made and the server responded with an error status
                        if (err.response.status === 401) {
                            errorMessage =
                                "البريد الإلكتروني أو كلمة المرور غير صحيحة";
                        } else if (
                            err.response.data &&
                            err.response.data.message
                        ) {
                            // Use server message only if it's not a detailed error
                            const serverMessage = err.response.data.message;
                            if (
                                !serverMessage.includes("SQLSTATE") &&
                                !serverMessage.includes("relation") &&
                                serverMessage.length < 100
                            ) {
                                errorMessage = serverMessage;
                            }
                        }
                    } else if (err.request) {
                        // The request was made but no response was received
                        errorMessage =
                            "لا يمكن الوصول إلى الخادم، يرجى التحقق من اتصالك بالإنترنت";
                    }

                    set({ loading: false, error: errorMessage });
                    return { success: false, error: errorMessage };
                }
            },

            verifyCode: async (email, code) => {
                set({ loading: true, error: null });
                try {
                    const response = await api.post(`/api/verify-email`, {
                        token: code,
                    });

                    if (response.data.status === "success") {
                        // After verification, try to login again
                        const loginResult = await get().login(email, "");
                        if (loginResult.success) {
                            // Determine redirect path based on user role
                            const user = get().user;
                            const redirectPath =
                                user?.role === "admin"
                                    ? "/admin/dashboard"
                                    : "/dashboard";
                            return { success: true, redirectTo: redirectPath };
                        } else {
                            return {
                                success: false,
                                error: "تم التحقق بنجاح، يرجى تسجيل الدخول",
                            };
                        }
                    }

                    return { success: false, error: "فشل التحقق من الرمز" };
                } catch (err: any) {
                    const errorMessage =
                        err.response?.data?.message || "فشل التحقق من الكود";
                    set({ loading: false, error: errorMessage });
                    return { success: false, error: errorMessage };
                }
            },

            logout: async () => {
                try {
                    // Don't wait for this to complete - it can cause issues if it fails
                    api.post(`/api/logout`).catch((error) => {
                        // Just log error, don't prevent logout
                        console.error("Logout API error:", error);
                    });
                } finally {
                    // Clear everything regardless of API call success
                    localStorage.removeItem("token");
                    delete axios.defaults.headers.common["Authorization"];
                    if (api.defaults) {
                        delete api.defaults.headers.common["Authorization"];
                    }
                    set({ user: null, token: null, isLoggedIn: false });

                    // Force a page redirect to login to ensure complete logout
                    if (typeof window !== "undefined") {
                        window.location.href = "/auth/login";
                    }
                }
            },

            refreshToken: async () => {
                try {
                    console.log("Attempting to refresh token");
                    const response = await api.post(`/api/refresh`);

                    const { access_token } = response.data;
                    console.log("Token refreshed successfully");

                    // Update localStorage and axios headers
                    localStorage.setItem("token", access_token);
                    axios.defaults.headers.common[
                        "Authorization"
                    ] = `Bearer ${access_token}`;
                    if (api.defaults) {
                        api.defaults.headers.common[
                            "Authorization"
                        ] = `Bearer ${access_token}`;
                    }

                    // Attempt to get user data
                    try {
                        const userResponse = await api.get(`/api/user/profile`);

                        // Check if the response has a data property and extract it
                        const userData =
                            userResponse.data.data || userResponse.data;

                        set({
                            token: access_token,
                            user: userData,
                            isLoggedIn: true,
                        });

                        return true;
                    } catch (userError) {
                        console.error(
                            "Failed to get user data after token refresh:",
                            userError
                        );
                        // Even if user data fetch fails, we still have a valid token
                        set({
                            token: access_token,
                            isLoggedIn: true,
                        });
                        return true;
                    }
                } catch (error) {
                    console.error("Token refresh failed:", error);
                    // If refresh fails, return false but don't automatically log out
                    // This prevents infinite redirection loops
                    return false;
                }
            },
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isLoggedIn: state.isLoggedIn,
            }),
        }
    )
);
