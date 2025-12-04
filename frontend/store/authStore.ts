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
  permissions?: string[];

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
  fetchProfile: (opts?: {
    force?: boolean;
    silent?: boolean;
  }) => Promise<boolean>;

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
    error?: string;
  }>;

  logout: (opts?: {
    skipRequest?: boolean;
    redirectToLogin?: boolean;
  }) => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const PROFILE_CACHE_DURATION = 5 * 60 * 1000;
// const TOKEN_EXPIRY_MINUTES = 15; // Not used for cookie anymore
// const AUTH_COOKIE_NAME = "auth-token"; // Not used for access token anymore

const isBrowser = () => typeof window !== "undefined";

// Helper to extract user data
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
          // No token in storage, assume logged out
          set({ loading: false, initialized: true });
          return false;
        }

        // Set token in headers
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        if (api.defaults)
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        set({ token, isLoggedIn: true });

        get()
          .fetchProfile({ force: true, silent: true })
          .finally(() => {
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
            resp = await api.get("/api/user/profile"); // Skip cache
          } else {
            const { cachedApiRequest } = await import("@/lib/request-cache");
            resp = await cachedApiRequest(
              "/api/user/profile",
              {
                headers: {
                  Authorization: api.defaults?.headers?.common?.[
                    "Authorization"
                  ] as string,
                },
              },
              PROFILE_CACHE_DURATION
            );
          }

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
            console.error(
              "fetchProfile error:",
              error?.response?.data || error
            );
          }

          if (error?.response?.status === 401) {
            // Let the interceptor handle 401s usually, but if this is called directly and fails:
            // The interceptor might have already tried to refresh.
            // If we are here, it means refresh failed or wasn't possible.
            // We should probably logout locally.

            // However, fetchProfile is often called after login or init.
            // If it fails with 401, it means the token is invalid.

            if (typeof window !== "undefined") localStorage.removeItem("token");
            delete axios.defaults.headers.common["Authorization"];
            if (api.defaults)
              delete api.defaults.headers.common["Authorization"];

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
          // Login request - backend sets HttpOnly cookie for refresh token
          const response = await api.post(`/api/login`, { email, password });
          const data = response.data;

          if (
            data.status === "error" &&
            data.message === "Email not verified"
          ) {
            set({ loading: false });
            return { success: false, needsVerification: true };
          }

          const token = data.access_token;

          // Store access token in localStorage (and state)
          if (isBrowser() && token) {
            localStorage.setItem("token", token);
          }
          if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            if (api.defaults)
              api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
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
              else if (responseData.message)
                errorMessage = responseData.message;
              else if (responseData.first_error)
                errorMessage = responseData.first_error;
            } else if (responseData.message)
              errorMessage = responseData.message;
            else if (responseData.error) errorMessage = responseData.error;
          } else if (err.request) {
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
          const response = await api.post(`/api/verify-otp`, {
            email,
            otp: code,
          });
          const data = response.data;

          const token = data.access_token;

          // Store access token in localStorage (and state)
          if (isBrowser() && token) {
            localStorage.setItem("token", token);
          }
          if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            if (api.defaults)
              api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
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
          let errorMessage = "فشل التحقق من الرمز";
          if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
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
            // Call backend to revoke tokens and clear cookie
            await api.post(`/api/logout`).catch((error) => {
              console.error("Logout API error:", error);
            });
          }
        } finally {
          if (isBrowser()) localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
          if (api.defaults) delete api.defaults.headers.common["Authorization"];

          // We don't manually clear the cookie here because it's HttpOnly.
          // The backend logout endpoint should have cleared it.
          // If the backend call failed, the cookie might still be there,
          // but the access token is gone from client, so they are effectively logged out
          // until they try to refresh (which will fail if we implement it right) or login again.

          set({
            user: null,
            token: null,
            isLoggedIn: false,
            lastProfileFetch: 0,
          });

          if (redirectToLogin && isBrowser()) {
            window.location.href = "/auth/login";
          }
        }
      },

      refreshToken: async () => {
        try {
          // We do NOT send the old access token in the header for the refresh request
          // The backend relies solely on the HttpOnly cookie.
          // However, we might want to ensure we don't send an invalid Bearer token if it's set in defaults.
          // But usually, it doesn't hurt if the backend ignores it.
          // To be safe and clean, we can explicitly unset it for this request or create a new instance.
          // But since api.post uses the instance with interceptors, we need to be careful not to trigger a loop.
          // The interceptor handles the loop check.

          // Note: We need { withCredentials: true } to send the cookie.
          const response = await api.post(
            `/api/refresh`,
            {},
            {
              withCredentials: true,
              // Explicitly remove Authorization header for this request to avoid confusion,
              // though the backend logic I wrote ignores it for the refresh token itself.
              headers: { Authorization: "" },
            }
          );

          if (response.data && response.data.access_token) {
            const { access_token } = response.data;

            if (isBrowser()) {
              localStorage.setItem("token", access_token);
            }
            axios.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${access_token}`;
            if (api.defaults)
              api.defaults.headers.common[
                "Authorization"
              ] = `Bearer ${access_token}`;

            const state = get();
            const now = Date.now();
            // Optionally update user data if returned or needed

            set({ token: access_token, isLoggedIn: true });
            return true;
          } else {
            console.error(
              "Token refresh response missing access_token:",
              response.data
            );
            return false;
          }
        } catch (error: any) {
          console.error("Token refresh failed:", error);
          // If refresh fails, we should logout locally

          if (isBrowser()) localStorage.removeItem("token");
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
      migrate: (persisted: any, _version) => {
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
    }
  )
);
