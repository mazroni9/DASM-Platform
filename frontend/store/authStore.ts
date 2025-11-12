// src/store/authStore.ts
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

  // صاحب المعرض
  venue_name?: string;
  venue_address?: string;
  description?: string;
  rating?: number | string;

  // أخرى
  address?: string;
  company_name?: string;
  trade_license?: string;

  created_at?: string;
  updated_at?: string;

  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  lastProfileFetch: number;

  isAuthModalOpen: boolean;
  authModalInitialTab: "login" | "register";
  openAuthModal: (tab?: "login" | "register") => void;
  closeAuthModal: () => void;

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

  logout: (opts?: { skipRequest?: boolean; redirectToLogin?: boolean }) => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const PROFILE_CACHE_DURATION = 5 * 60 * 1000;
const TOKEN_EXPIRY_MINUTES = 15;
const AUTH_COOKIE_NAME = "auth-token";

const isBrowser = () => typeof window !== "undefined";

const setAuthCookie = (token: string, minutes = TOKEN_EXPIRY_MINUTES) => {
  if (!isBrowser()) return;

  const expires = new Date(Date.now() + minutes * 60 * 1000).toUTCString();
  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${AUTH_COOKIE_NAME}=${token}; Path=/; Expires=${expires}; SameSite=Lax${secureFlag}`;
};

const clearAuthCookie = () => {
  if (!isBrowser()) return;

  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;
};

// ✅ موحّد شكل المستخدم من أي رد (يدعم {success,data} و {data:{}} و {…user})
const extractUser = (respOrObj: any): User | null => {
  const root = respOrObj?.data ?? respOrObj;
  if (!root) return null;
  if (root.data && typeof root.data === "object") return root.data as User;
  if (root.success && root.data) return root.data as User;
  if (typeof root === "object") return root as User;
  return null;
};

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

      isAuthModalOpen: false,
      authModalInitialTab: "login",
      openAuthModal: (tab = "login") =>
        set({ isAuthModalOpen: true, authModalInitialTab: tab }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),

      initializeFromStorage: async () => {
        if (get().initialized) return true;

        set({ loading: true });

        const token = isBrowser() ? localStorage.getItem("token") : null;
        if (!token) {
          clearAuthCookie();
          set({ loading: false, initialized: true });
          return false;
        }

        // ضع التوكن في الرؤوس
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        if (api.defaults) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setAuthCookie(token);

        set({ token, isLoggedIn: true });

        get().fetchProfile({ force: true, silent: true }).finally(() => {
          set({ loading: false, initialized: true });
        });

        return true;
      },

      fetchProfile: async (opts) => {
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

          let resp: any;
          if (force) {
            resp = await api.get("/api/user/profile"); // تخطّي الكاش
          } else {
            const { cachedApiRequest } = await import("@/lib/request-cache");
            resp = await cachedApiRequest(
              "/api/user/profile",
              { headers: api.defaults?.headers?.common },
              PROFILE_CACHE_DURATION
            );
          }

          const userData = extractUser(resp);
          if (!userData) {
            set({ loading: false, error: "لم يتم العثور على بيانات المستخدم" });
            return false;
          }

          // ✅ دمج بدل الاستبدال
          set((s) => ({
            user: { ...(s.user ?? {}), ...userData },
            isLoggedIn: true,
            lastProfileFetch: now,
            loading: false,
            error: null,
          }));

          return true;
        } catch (error: any) {
          if (process.env.NODE_ENV === "development") {
            console.error("fetchProfile error:", error?.response?.data || error);
          }

          if (error?.response?.status === 401) {
            if (typeof window !== "undefined") localStorage.removeItem("token");
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

          const token = data.access_token;
          if (isBrowser() && token) {
            localStorage.setItem("token", token);
          }
          if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            if (api.defaults) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            setAuthCookie(token);
          }

          const loginUser = extractUser(data);
          if (loginUser) {
            set((s) => ({
              user: { ...(s.user ?? {}), ...loginUser },
              token,
              isLoggedIn: true,
              error: null,
              lastProfileFetch: 0,
            }));
          } else {
            set({ token, isLoggedIn: true, error: null, lastProfileFetch: 0 });
          }

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
              return { success: false, pendingApproval: true, error: responseData.message };
            }
            if (err.response.status === 401 && responseData.message === "Email not verified") {
              set({ loading: false });
              return { success: false, needsVerification: true };
            }
            if (err.response.status === 422) {
              if (responseData.error) errorMessage = responseData.error;
              else if (responseData.message) errorMessage = responseData.message;
              else if (responseData.first_error) errorMessage = responseData.first_error;
            } else if (responseData.message) errorMessage = responseData.message;
            else if (responseData.error) errorMessage = responseData.error;
          } else if (err.request) {
            errorMessage = "لا يمكن الوصول إلى الخادم، يرجى التحقق من اتصالك بالإنترنت";
          }

          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      logout: async (opts) => {
        const skipRequest = opts?.skipRequest ?? false;
        const redirectToLogin = opts?.redirectToLogin ?? true;

        try {
          if (!skipRequest) {
            await api.post(`/api/logout`).catch((error) => {
              console.error("Logout API error:", error);
            });
          }
        } finally {
          if (isBrowser()) localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
          if (api.defaults) delete api.defaults.headers.common["Authorization"];
          clearAuthCookie();

          set({ user: null, token: null, isLoggedIn: false, lastProfileFetch: 0 });

          if (redirectToLogin && isBrowser()) {
            window.location.href = "/auth/login";
          }
        }
      },

      refreshToken: async () => {
        try {
          const currentToken =
            get().token ||
            (typeof window !== "undefined" ? localStorage.getItem("token") : null);

          const response = await api.post(
            `/api/refresh`,
            {},
            {
              withCredentials: true,
              headers: { ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}) },
            }
          );

          if (response.data && response.data.access_token) {
            const { access_token } = response.data;

            if (isBrowser()) {
              localStorage.setItem("token", access_token);
            }
            axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
            if (api.defaults) api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
            setAuthCookie(access_token);

            const state = get();
            const now = Date.now();
            const needsUserData =
              !state.user || now - state.lastProfileFetch > PROFILE_CACHE_DURATION;

            if (needsUserData) {
              try {
                await get().fetchProfile({ force: true, silent: true });
              } catch (userError) {
                console.error("Failed to get user data after token refresh:", userError);
                set({ token: access_token, isLoggedIn: true });
              }
            } else {
              set({ token: access_token, isLoggedIn: true });
            }
            return true;
          } else {
            console.error("Token refresh response missing access_token:", response.data);
            return false;
          }
        } catch (error: any) {
          console.error("Token refresh failed:", error);

          if (error?.response?.status === 401) {
            if (isBrowser()) localStorage.removeItem("token");
            delete axios.defaults.headers.common["Authorization"];
            if (api.defaults) delete api.defaults.headers.common["Authorization"];
            clearAuthCookie();

            set({ user: null, token: null, isLoggedIn: false, lastProfileFetch: 0 });
          }

          clearAuthCookie();
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
      // 🔁 مهم جدًا: زودنا version + migrate لتنظيف الشكل القديم بالفلاتة
      version: 2,
      migrate: (persisted: any, _version) => {
        try {
          if (!persisted) return persisted;
          const u = persisted.user;
          if (!u) return persisted;

          // دعم أي لفّافات سابقة
          const flattened = extractUser(u) || u;
          return { ...persisted, user: flattened };
        } catch {
          return persisted;
        }
      },
    }
  )
);
