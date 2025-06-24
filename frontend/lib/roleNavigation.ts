// Centralized role-based navigation utility
export const getRoleBasedRoute = (
    userRole: string | null | undefined
): string => {
    switch (userRole) {
        case "admin":
            return "/admin";
        case "dealer":
            return "/dealer/dashboard";
        case "moderator":
            return "/moderator/dashboard";
        case "user":
        default:
            return "/dashboard";
    }
};

export const isAuthorizedForRoute = (
    userRole: string | null | undefined,
    pathname: string
): boolean => {
    if (!userRole) return false;

    // Admin paths
    if (pathname.startsWith("/admin")) {
        return userRole === "admin";
    }

    // Moderator paths
    if (pathname.startsWith("/moderator")) {
        return userRole === "moderator";
    }

    // Dealer paths
    if (pathname.startsWith("/dealer")) {
        return userRole === "dealer";
    }

    // Regular dashboard paths (accessible by all authenticated users)
    if (pathname.startsWith("/dashboard")) {
        return true;
    }

    return true;
};

// Single redirection handler - ONLY used in ProtectedRoute
export const handleRoleBasedRedirection = (
    userRole: string | null | undefined,
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
