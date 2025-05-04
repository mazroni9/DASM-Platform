import { create } from 'zustand';

interface User {
  name: string;
  email: string;
  isAdmin: boolean;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  verifyCode: (email: string, code: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'فشل تسجيل الدخول');
      }

      const data = await res.json();

      // If user is verified, login directly
      if (data.user.isVerified) {
        set({
          user: data.user,
          token: data.token,
          isLoggedIn: true,
          loading: false,
          error: null,
        });
        
        return { success: true };
      } else {
        // If user is not verified, indicate verification is needed
        set({ loading: false });
        return { success: false, needsVerification: true };
      }
    } catch (err: any) {
      set({ loading: false, error: err.message || 'حدث خطأ غير متوقع' });
      return { success: false, error: err.message || 'حدث خطأ غير متوقع' };
    }
  },

  verifyCode: async (email, code) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/login/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'رمز التحقق غير صحيح');
      }

      const data = await res.json();

      set({
        user: data.user,
        token: data.token,
        isLoggedIn: true,
        loading: false,
        error: null,
      });

      // Determine redirect path based on user role
      const redirectPath = data.user.isAdmin ? '/admin' : '/dashboard';
      return { success: true, redirectTo: redirectPath };
    } catch (err: any) {
      set({ loading: false, error: err.message || 'فشل التحقق من الكود' });
      return { success: false, error: err.message || 'فشل التحقق من الكود' };
    }
  },

  logout: () => {
    set({ user: null, token: null, isLoggedIn: false });
  },
})); 