import { useAuthStore as useStoreAuth } from "@/store/authStore";
import { UserRole } from "@/types/types";

export function useAuth() {
  const {
    user,
    token,
    isLoggedIn,
    loading,
    error,
    login,
    logout,
    refreshToken,
    hydrated,
    initialized,
    fetchProfile,
    initializeFromStorage,
  } = useStoreAuth();

  return {
    user,
    isAdmin: user?.type === UserRole.ADMIN || user?.type === UserRole.SUPER_ADMIN,
    isModerator: user?.type === UserRole.MODERATOR,
    isDealer: user?.type === UserRole.DEALER,
    isVenueOwner: user?.type === UserRole.VENUE_OWNER,
    isInvestor: user?.type === UserRole.INVESTOR,
    isUser: user?.type === UserRole.USER,

    // ✅ NEW (important)
    hydrated,
    initialized,
    isReady: hydrated, // كفاية للـ layouts

    isLoading: loading,
    login,
    logout,
    refreshToken,
    fetchProfile,
    initializeFromStorage,
    token,
    isLoggedIn,
    error,
  };
}
