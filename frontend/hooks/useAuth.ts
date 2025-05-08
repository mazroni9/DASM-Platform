import { create } from 'zustand';

interface AuthState {
  user: any;
  isAdmin: boolean;
  isLoading: boolean;
  login: (userData: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  isLoading: false,
  login: (userData) => set({ user: userData, isAdmin: userData?.isAdmin || false }),
  logout: () => set({ user: null, isAdmin: false }),
}));

export function useAuth() {
  const {
    user,
    isAdmin,
    isLoading,
    login,
  } = useAuthStore();

  return {
    user,
    isAdmin,
    isLoading,
    login,
  };
}
