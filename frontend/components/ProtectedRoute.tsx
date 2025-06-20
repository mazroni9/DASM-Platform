"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { handleRoleBasedRedirection } from "@/lib/roleNavigation";

// List of routes that are public and don't require authentication
const publicPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/verify-email",
];

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { isLoggedIn, user, initialized } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            // Check if the current path is a public path that doesn't require auth
            const isPublicPath = publicPaths.some(
                (path) => pathname === path || pathname.startsWith(`${path}/`)
            );

            // Wait for auth to be initialized
            if (!initialized) {
                return;
            }

            // If it's not a public path and user isn't logged in, redirect to login
            if (!isPublicPath && !isLoggedIn) {
                router.push(
                    `/auth/login?returnUrl=${encodeURIComponent(pathname)}`
                );
                return;
            }

            // ONLY role-based redirection logic - centralized here
            if (isLoggedIn && user) {
                handleRoleBasedRedirection(user.role, pathname, router);
            }

            // Auth check is complete
            setIsLoading(false);
        }

        checkAuth();
    }, [isLoggedIn, pathname, router, initialized, user]);

    // Show loading while checking authentication
    if (!initialized || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return <>{children}</>;
}
