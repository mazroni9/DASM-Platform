import { useAuthStore as useStoreAuth } from "@/store/authStore";

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
        isAdmin: user?.role === "admin",
        isLoading: loading,
        login,
        logout,
        refreshToken,
        token,
        isLoggedIn,
        error,
    };
}

// Re-export the store for direct access if needed
export { useStoreAuth as useAuthStore };
