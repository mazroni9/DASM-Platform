import { UserRole } from "@/types/types";

// Centralized role-based navigation utility
export const getRoleBasedRoute = (
    userRole: UserRole | string | null | undefined
): string => {
    switch (userRole) {
        case UserRole.ADMIN:
        case "admin":
            return "/admin";
        case UserRole.DEALER:
        case "dealer":
            return "/dealer/dashboard";
        case UserRole.MODERATOR:
        case "moderator":
            return "/moderator/dashboard";
        case UserRole.VENUE_OWNER:
        case "venue_owner":
            return "/exhibitor";
        case UserRole.INVESTOR:
        case "investor":
            return "/investor/dashboard";
        case UserRole.USER:
        case "user":
        default:
            return "/dashboard";
    }
};

export const isAuthorizedForRoute = (
    userRole: UserRole | string | null | undefined,
    pathname: string
): boolean => {
    if (!userRole) return false;

    // Admin paths
    if (pathname.startsWith("/admin")) {
        return userRole === UserRole.ADMIN || userRole === "admin";
    }

    // Moderator paths
    if (pathname.startsWith("/moderator")) {
        return userRole === UserRole.MODERATOR || userRole === "moderator";
    }

    // Dealer paths
    if (pathname.startsWith("/dealer")) {
        return userRole === UserRole.DEALER || userRole === "dealer";
    }

    // Exhibitor paths (accessible by admins, moderators, and venue owners)
    if (pathname.startsWith("/exhibitor")) {
        return  userRole === UserRole.VENUE_OWNER || userRole === "venue_owner";
    }

    // Investor paths
    if (pathname.startsWith("/investor")) {
        return userRole === UserRole.INVESTOR || userRole === "investor";
    }

    // Regular dashboard paths (accessible by all authenticated users)
    if (pathname.startsWith("/dashboard")) {
        return userRole === UserRole.USER || userRole === "user"
        || userRole === UserRole.DEALER || userRole === "dealer";
    }

    return true;
};

// Single redirection handler - ONLY used in ProtectedRoute
export const handleRoleBasedRedirection = (
    userRole: UserRole | string | null | undefined,
    currentPath: string,
    router: any
): boolean => {
    if (!userRole) return false;

    // Check if current path is authorized for user role
    if (!isAuthorizedForRoute(userRole, currentPath)) {
        const targetRoute = getRoleBasedRoute(userRole);
        router.replace(targetRoute);
        return true;
    }

    return false;
};
