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
  phone?: string;
  name?: string;
  kyc_status?: string;
  is_active?: boolean;
  status?: string;

  // حقول صاحب المعرض
  venue_name?: string;
  venue_address?: string; // ✅ اسم الحقل كما يرجعه الـ API
  description?: string;
  rating?: number | string;

  // حقول أخرى محتملة
  address?: string;
  company_name?: string;
  trade_license?: string;

  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  lastProfileFetch: number;

  initializeFromStorage: () => Promise<boolean>;
  fetchProfile: (opts?: { force?: boolean; silent?: boolean }) => Promise<boolean>;

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

  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

// قلل الكاش أو استعمل force لجلب فوري
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
        if (get().initialized) return true;

        set({ loading: true });

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          set({ loading: false, initialized: true });
          return false;
        }

        // ضع التوكن في الرؤوس
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        if (api.defaults) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        // Don't block first interaction: mark as logged-in optimistically
        set({ token, isLoggedIn: true });
        // Kick off profile fetch in background
        get().fetchProfile({ force: true, silent: true }).finally(() => {
          set({ loading: false, initialized: true });
        });
        return true;
      },

      // جلب بروفايل المستخدم مع خيار force لتجاهل الكاش
      fetchProfile: async (opts?: { force?: boolean; silent?: boolean }) => {
        const force = opts?.force ?? false;
        const silent = opts?.silent ?? false;

        try {
          const state = get();
          const now = Date.now();
          const cacheValid =
            !force &&
            state.user &&
            state.lastProfileFetch &&
            now - state.lastProfileFetch < PROFILE_CACHE_DURATION;

          if (cacheValid) return true;

          if (!silent) set({ loading: true });

          // Use cached API request for better performance
          const { cachedApiRequest } = await import('@/lib/request-cache');
          const res = await cachedApiRequest('/api/user/profile', undefined, PROFILE_CACHE_DURATION);
          const userData: User = res?.data || res || null;

          set({
            user: userData,
            isLoggedIn: true,
            lastProfileFetch: now,
            loading: false,
            error: null,
          });

          return true;
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error("fetchProfile error:", error?.response?.data || error);
          }

          if (error?.response?.status === 401) {
            // توكن غير صالح
            if (typeof window !== "undefined") {
              localStorage.removeItem("token");
            }
            delete axios.defaults.headers.common["Authorization"];
            if (api.defaults) delete api.defaults.headers.common["Authorization"];

            set({
              user: null,
              token: null,
              isLoggedIn: false,
              loading: false,
              error: "غير مصرح",
            });
            return false;
          }

          set({
            loading: false,
            error:
              error?.response?.data?.message ||
              error?.message ||
              "فشل في جلب البيانات",
          });
          return false;
        }
      },

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post(`/api/login`, { email, password });
          const data = response.data;

          if (data.status === "error" && data.message === "Email not verified") {
            set({ loading: false });
            return { success: false, needsVerification: true };
          }

          // خزّن التوكن
          if (typeof window !== "undefined") {
            localStorage.setItem("token", data.access_token);
          }

          // ضع التوكن في الرؤوس
          axios.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;
          if (api.defaults) {
            api.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;
          }

          // عيّن بيانات المستخدم من رد تسجيل الدخول (إن وُجدت)
          const loginUser: User =
            (data.user && data.user.data ? data.user.data : data.user) || null;

          if (loginUser) {
            set({
              user: loginUser,
              token: data.access_token,
              isLoggedIn: true,
              error: null,
              // هنفترض أنها لسه قديمة لنجبر fetchProfile يجلب المحدث فورًا
              lastProfileFetch: 0,
            });
          } else {
            set({
              token: data.access_token,
              isLoggedIn: true,
              error: null,
              lastProfileFetch: 0,
            });
          }

          // ✅ جلب فوري للبروفايل الكامل (مع venue_owner) بعد اللوجين
          await get().fetchProfile({ force: true, silent: true });

          set({ loading: false });
          return { success: true };
        } catch (err: any) {
          console.error("Login error details:", err);
          let errorMessage = "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.";

          if (err.response?.data) {
            const responseData = err.response.data;

            if (err.response.status === 403 && responseData.message) {
              set({ loading: false });
              return {
                success: false,
                pendingApproval: true,
                error: responseData.message,
              };
            }

            if (err.response.status === 401 && responseData.message === "Email not verified") {
              set({ loading: false });
              return { success: false, needsVerification: true };
            }

            if (err.response.status === 422) {
              if (responseData.error) errorMessage = responseData.error;
              else if (responseData.message) errorMessage = responseData.message;
              else if (responseData.first_error) errorMessage = responseData.first_error;
            } else if (responseData.message) {
              errorMessage = responseData.message;
            } else if (responseData.error) {
              errorMessage = responseData.error;
            }
          } else if (err.request) {
            errorMessage = "لا يمكن الوصول إلى الخادم، يرجى التحقق من اتصالك بالإنترنت";
          }

          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        try {
          api.post(`/api/logout`).catch((error) => {
            console.error("Logout API error:", error);
          });
        } finally {
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
          }
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

          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }
        }
      },

      refreshToken: async () => {
        try {
          const currentToken = get().token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);

          const response = await api.post(
            `/api/refresh`,
            {},
            {
              withCredentials: true,
              headers: {
                ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
              },
            }
          );

          if (response.data && response.data.access_token) {
            const { access_token } = response.data;

            if (typeof window !== "undefined") {
              localStorage.setItem("token", access_token);
            }
            axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
            if (api.defaults) {
              api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
            }

            const state = get();
            const now = Date.now();
            const needsUserData = !state.user || now - state.lastProfileFetch > PROFILE_CACHE_DURATION;

            if (needsUserData) {
              try {
                await get().fetchProfile({ force: true, silent: true });
              } catch (userError) {
                console.error("Failed to get user data after token refresh:", userError);
                set({
                  token: access_token,
                  isLoggedIn: true,
                });
              }
            } else {
              set({
                token: access_token,
                isLoggedIn: true,
              });
            }
            return true;
          } else {
            console.error("Token refresh response missing access_token:", response.data);
            return false;
          }
        } catch (error: any) {
          console.error("Token refresh failed:", error);

          if (error?.response?.status === 401) {
            if (typeof window !== "undefined") localStorage.removeItem("token");
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
