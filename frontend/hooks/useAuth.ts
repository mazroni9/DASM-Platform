import { useAuthStore as useStoreAuth } from "@/store/authStore";
import { UserRole } from "@/types/types";

// This is a wrapper around the authStore to maintain compatibility with existing code
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
  } = useStoreAuth();

  return {
    user,
    isAdmin:
      user?.type === UserRole.ADMIN || user?.type === UserRole.SUPER_ADMIN,
    isModerator: user?.type === UserRole.MODERATOR,
    isDealer: user?.type === UserRole.DEALER,
    isVenueOwner: user?.type === UserRole.VENUE_OWNER,
    isInvestor: user?.type === UserRole.INVESTOR,
    isUser: user?.type === UserRole.USER,
    isLoading: loading,
    login,
    logout,
    refreshToken,
    token,
    isLoggedIn,
    error,
  };
}

// Also export as default for compatibility
export default useAuth;

// Re-export the store for direct access if needed
export { useStoreAuth as useAuthStore };
