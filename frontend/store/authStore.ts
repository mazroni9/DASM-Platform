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
    lastProfileFetch: number; // Add timestamp for caching

    login: (
        email: string,
        password: string
    ) => Promise<{
        success: boolean;
        redirectTo?: string;
        error?: string;
        needsVerification?: boolean;
        pendingApproval?: boolean;
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

// Cache duration for profile data (5 minutes)
const PROFILE_CACHE_DURATION = 5 * 60 * 1000;

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoggedIn: false,
            loading: false,
            error: null,
            initialized: false,
            lastProfileFetch: 0,

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
                    // Check if we have cached user data that's still valid
                    const state = get();
                    const now = Date.now();
                    const cacheValid =
                        state.user &&
                        state.lastProfileFetch &&
                        now - state.lastProfileFetch < PROFILE_CACHE_DURATION;

                    if (cacheValid) {
                        // Use cached data
                        set({
                            token,
                            isLoggedIn: true,
                            loading: false,
                            initialized: true,
                        });
                        console.log("Using cached user data");
                        return true;
                    }

                    console.log("Fetching fresh user data");
                    // Try to get the current user with the token
                    const response = await api.get(`/api/user/profile`);

                    // Check if the response has a data property and extract it
                    const userData = response.data.data || response.data;

                    set({
                        user: userData,
                        token,
                        isLoggedIn: true,
                        loading: false,
                        initialized: true,
                        lastProfileFetch: now,
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
                        // Don't redirect here to prevent redirect loops
                        set({
                            user: null,
                            token: null,
                            isLoggedIn: false,
                            loading: false,
                            initialized: true,
                        });
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
                        lastProfileFetch: Date.now(),
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

                    // redirect based on user role
                    const redirectPath =
                        userData.role === "admin"
                            ? "/admin"
                            : userData.role === "dealer"
                            ? "/dealer"
                            : "/dashboard";

                    return { success: true, redirectTo: redirectPath };
                } catch (err: any) {
                    // Log detailed error in development mode only
                    console.error("Login error details:", err);

                    // Extract user-friendly error message if available, or use generic message
                    let errorMessage =
                        "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.";

                    if (err.response) {
                        // The request was made and the server responded with an error status
                        if (err.response.status === 401) {
                            errorMessage = "بيانات الاعتماد غير صحيحة";
                        } else if (err.response.status === 422) {
                            // Special handling for account pending approval
                            if (
                                err.response.data &&
                                err.response.data.message &&
                                err.response.data.message.includes(
                                    "pending approval"
                                )
                            ) {
                                set({ loading: false });
                                return {
                                    success: false,
                                    pendingApproval: true,
                                    error: "حسابك في انتظار موافقة المدير. سيتم إشعارك عندما يتم تفعيل حسابك.",
                                };
                            }
                            errorMessage =
                                "بيانات غير صحيحة. يرجى التحقق من المعلومات المدخلة.";
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
                    set({
                        user: null,
                        token: null,
                        isLoggedIn: false,
                        lastProfileFetch: 0,
                    });

                    // Force a page redirect to login to ensure complete logout
                    if (typeof window !== "undefined") {
                        window.location.href = "/auth/login";
                    }
                }
            },

            refreshToken: async () => {
                try {
                    console.log("Attempting to refresh token");

                    // Get the current token in case we need it
                    const currentToken =
                        get().token || localStorage.getItem("token");

                    // Ensure we're sending cookies with the request
                    const response = await api.post(
                        `/api/refresh`,
                        {},
                        {
                            withCredentials: true,
                            headers: {
                                // Include current token in the Authorization header
                                ...(currentToken
                                    ? {
                                          Authorization: `Bearer ${currentToken}`,
                                      }
                                    : {}),
                            },
                        }
                    );

                    // Handle successful response
                    if (response.data && response.data.access_token) {
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

                        // Only fetch user data if we don't have it or cache is old
                        const state = get();
                        const now = Date.now();
                        const needsUserData =
                            !state.user ||
                            now - state.lastProfileFetch >
                                PROFILE_CACHE_DURATION;

                        if (needsUserData) {
                            try {
                                const userResponse = await api.get(
                                    `/api/user/profile`
                                );
                                const userData =
                                    userResponse.data.data || userResponse.data;

                                set({
                                    token: access_token,
                                    user: userData,
                                    isLoggedIn: true,
                                    lastProfileFetch: now,
                                });
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
                            }
                        } else {
                            // Just update the token
                            set({
                                token: access_token,
                                isLoggedIn: true,
                            });
                        }
                        return true;
                    } else {
                        // If response doesn't contain access_token
                        console.error(
                            "Token refresh response missing access_token:",
                            response.data
                        );
                        return false;
                    }
                } catch (error) {
                    console.error("Token refresh failed:", error);

                    // Check if error is due to an expired refresh token
                    if (error.response?.status === 401) {
                        // Clear auth state since refresh token is invalid
                        localStorage.removeItem("token");
                        delete axios.defaults.headers.common["Authorization"];
                        if (api.defaults) {
                            delete api.defaults.headers.common["Authorization"];
                        }

                        set({
                            user: null,
                            token: null,
                            isLoggedIn: false,
                            lastProfileFetch: 0,
                        });

                        // Don't redirect here to prevent redirect loops
                        // The calling code will handle redirection if needed
                    }

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
                lastProfileFetch: state.lastProfileFetch,
            }),
        }
    )
);
