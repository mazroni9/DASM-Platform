import { create } from "zustand";
import axios from "axios";

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
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    isLoggedIn: false,
    loading: false,
    error: null,

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/login`,
                { email, password },
                { withCredentials: true }
            );

            console.log("Login response: ", response);

            const data = response.data;

            if (
                data.status === "error" &&
                data.message === "Email not verified"
            ) {
                set({ loading: false });
                return { success: false, needsVerification: true };
            }

            // Store token and user data
            localStorage.setItem("token", data.access_token);

            set({
                user: data.user,
                token: data.access_token,
                isLoggedIn: true,
                loading: false,
                error: null,
            });

            // Set default auth header for future requests
            axios.defaults.headers.common[
                "Authorization"
            ] = `Bearer ${data.access_token}`;

            return { success: true };
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message || "حدث خطأ غير متوقع";
            set({ loading: false, error: errorMessage });
            return { success: false, error: errorMessage };
        }
    },

    verifyCode: async (email, code) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/verify-email`,
                { token: code },
                { withCredentials: true }
            );

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
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/logout`,
                {},
                { withCredentials: true }
            );
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            // Clear everything regardless of API call success
            localStorage.removeItem("token");
            delete axios.defaults.headers.common["Authorization"];
            set({ user: null, token: null, isLoggedIn: false });
        }
    },

    refreshToken: async () => {
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/refresh`,
                {},
                { withCredentials: true }
            );

            const { access_token } = response.data;

            localStorage.setItem("token", access_token);
            axios.defaults.headers.common[
                "Authorization"
            ] = `Bearer ${access_token}`;

            set({
                token: access_token,
                isLoggedIn: true,
            });

            return true;
        } catch (error) {
            console.error("Token refresh failed:", error);
            // If refresh fails, logout
            await get().logout();
            return false;
        }
    },
}));
