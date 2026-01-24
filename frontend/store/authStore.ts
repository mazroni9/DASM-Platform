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
  type: string;
  phone?: string;
  name?: string;
  kyc_status?: string;
  is_active?: boolean;
  status?: string;
  permissions?: string[];

  venue_name?: string;
  venue_address?: string;
  description?: string;
  rating?: number | string;

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

  hydrated: boolean;
  setHydrated: (v: boolean) => void;

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

  verifyCode: (
    email: string,
    code: string
  ) => Promise<{
    success: boolean;
    redirectTo?: string;
    error?: string;
  }>;

  logout: (opts?: { skipRequest?: boolean; redirectToLogin?: boolean }) => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const PROFILE_CACHE_DURATION = 5 * 60 * 1000;
const isBrowser = () => typeof window !== "undefined";

// ✅ Cookie sync for middleware (non-HttpOnly)
const setTokenCookie = (token: string | null) => {
  if (!isBrowser()) return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const sameSite = "; SameSite=Lax";
  const path = "; Path=/";

  if (!token) {
    document.cookie = `access_token=; Max-Age=0${path}${sameSite}${secure}`;
    return;
  }

  // خليه أسبوع (عدّل المدة براحتك)
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `access_token=${encodeURIComponent(token)}; Max-Age=${maxAge}${path}${sameSite}${secure}`;
};

// ✅ Helper to extract user data safely
const extractUser = (respOrObj: any): User | null => {
  const root = respOrObj?.data ?? respOrObj;
  if (!root) return null;

  if (root.user && typeof root.user === "object") return root.user as User;
  if (root.data && typeof root.data === "object") return root.data as User;
  if (root.success && root.data) return root.data as User;
  if (typeof root === "object" && root.id && root.email) return root as User;

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

      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      isAuthModalOpen: false,
      authModalInitialTab: "login",
      openAuthModal: (tab = "login") =>
        set({ isAuthModalOpen: true, authModalInitialTab: tab }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),

      initializeFromStorage: async () => {
        if (get().initialized) return true;

        set({ loading: true });

        const token =
          get().token || (isBrowser() ? localStorage.getItem("token") : null);

        if (!token) {
          if (isBrowser()) {
            localStorage.removeItem("token");
          }
          setTokenCookie(null);

          delete axios.defaults.headers.common["Authorization"];
          if (api.defaults) delete api.defaults.headers.common["Authorization"];

          set({
            user: null,
            token: null,
            isLoggedIn: false,
            lastProfileFetch: 0,
            loading: false,
            error: null,
            initialized: true,
          });
          return false;
        }

        setTokenCookie(token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        if (api.defaults) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        set({ token, isLoggedIn: true });

        try {
          await get().fetchProfile({ force: true, silent: true });
          return true;
        } finally {
          set({ loading: false, initialized: true });
        }
      },

      fetchProfile: async (opts) => {
        const force = opts?.force ?? false;
        const silent = opts?.silent ?? false;

        const token =
          get().token || (isBrowser() ? localStorage.getItem("token") : null);

        if (!token) return false;

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

          const resp = await api.get("/api/user/profile");

          const userData = extractUser(resp);
          if (!userData) {
            set({ loading: false, error: "لم يتم العثور على بيانات المستخدم" });
            return false;
          }

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
            // eslint-disable-next-line no-console
            console.error("fetchProfile error:", error?.response?.data || error);
          }

          if (error?.response?.status === 401) {
            if (isBrowser()) {
              localStorage.removeItem("token");
              localStorage.removeItem("auth-storage");
            }
            setTokenCookie(null);

            delete axios.defaults.headers.common["Authorization"];
            if (api.defaults) delete api.defaults.headers.common["Authorization"];

            set({
              user: null,
              token: null,
              isLoggedIn: false,
              loading: false,
              lastProfileFetch: 0,
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
            setTokenCookie(token);
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            if (api.defaults) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
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
            set({
              token,
              isLoggedIn: true,
              error: null,
              lastProfileFetch: 0,
            });
          }

          await get().fetchProfile({ force: true, silent: true });

          const currentUser = get().user;
          const userRole = currentUser?.type || loginUser?.type || "user";

          const roleRedirectMap: { [key: string]: string } = {
            admin: "/admin",
            super_admin: "/admin",
            moderator: "/admin",
            employee: "/admin",
            venue_owner: "/exhibitor",
            dealer: "/dealer",
            investor: "/investor/dashboard",
            user: "/dashboard",
          };

          const redirectTo = roleRedirectMap[userRole] || "/dashboard";

          set({ loading: false, initialized: true });
          return { success: true, redirectTo };
        } catch (err: any) {
          // eslint-disable-next-line no-console
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

            if (
              err.response.status === 401 &&
              responseData.message === "Email not verified"
            ) {
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

      verifyCode: async (email, code) => {
        set({ loading: true, error: null });

        try {
          const response = await api.post(`/api/verify-otp`, {
            email,
            otp: code,
          });

          const data = response.data;
          const token = data.access_token;

          if (isBrowser() && token) {
            localStorage.setItem("token", token);
          }
          if (token) {
            setTokenCookie(token);
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            if (api.defaults) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
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

          const currentUser = get().user;
          const userRole = currentUser?.type || loginUser?.type || "user";

          const roleRedirectMap: { [key: string]: string } = {
            admin: "/admin",
            super_admin: "/admin",
            moderator: "/admin",
            employee: "/admin",
            venue_owner: "/exhibitor",
            dealer: "/dealer",
            investor: "/investor/dashboard",
            user: "/dashboard",
          };

          const redirectTo = roleRedirectMap[userRole] || "/dashboard";

          set({ loading: false, initialized: true });
          return { success: true, redirectTo };
        } catch (err: any) {
          let errorMessage = "فشل التحقق من الرمز";
          if (err.response?.data?.message) errorMessage = err.response.data.message;

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
              // eslint-disable-next-line no-console
              console.error("Logout API error:", error);
            });
          }
        } finally {
          if (isBrowser()) {
            localStorage.removeItem("token");
            localStorage.removeItem("auth-storage");
          }
          setTokenCookie(null);

          delete axios.defaults.headers.common["Authorization"];
          if (api.defaults) delete api.defaults.headers.common["Authorization"];

          set({
            user: null,
            token: null,
            isLoggedIn: false,
            loading: false,
            error: null,
            lastProfileFetch: 0,
            initialized: true,
          });

          if (redirectToLogin && isBrowser()) {
            window.location.href = "/auth/login";
          }
        }
      },

      refreshToken: async () => {
        try {
          const existingToken =
            get().token || (isBrowser() ? localStorage.getItem("token") : null);

          // ✅ مهم: لو مفيش access token، متعملش refresh (منع silent relogin)
          if (!existingToken) return false;

          const response = await api.post(
            `/api/refresh`,
            {},
            {
              withCredentials: true,
              headers: { Authorization: "" },
            }
          );

          if (response.data && response.data.access_token) {
            const { access_token } = response.data;

            if (isBrowser()) {
              localStorage.setItem("token", access_token);
            }
            setTokenCookie(access_token);

            axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
            if (api.defaults) api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

            set({ token: access_token, isLoggedIn: true });
            return true;
          }

          // eslint-disable-next-line no-console
          console.error("Token refresh response missing access_token:", response.data);
          return false;
        } catch (error: any) {
          // eslint-disable-next-line no-console
          console.error("Token refresh failed:", error);

          if (isBrowser()) {
            localStorage.removeItem("token");
            localStorage.removeItem("auth-storage");
          }
          setTokenCookie(null);

          delete axios.defaults.headers.common["Authorization"];
          if (api.defaults) delete api.defaults.headers.common["Authorization"];

          set({
            user: null,
            token: null,
            isLoggedIn: false,
            lastProfileFetch: 0,
          });

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
      version: 2,
      migrate: (persisted: any) => {
        try {
          if (!persisted) return persisted;
          const u = persisted.user;
          if (!u) return persisted;
          const flattened = extractUser(u) || u;
          return { ...persisted, user: flattened };
        } catch {
          return persisted;
        }
      },

      // ✅ hydration + cookie sync بعد rehydrate فعلاً
      onRehydrateStorage: () => {
        return (state, error) => {
          try {
            setTokenCookie(state?.token ?? null);
            state?.setHydrated(true);
          } finally {
            if (error && process.env.NODE_ENV === "development") {
              // eslint-disable-next-line no-console
              console.error("auth-storage rehydrate error:", error);
            }
          }
        };
      },
    }
  )
);
