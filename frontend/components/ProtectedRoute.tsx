"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

// List of routes that are public and don't require authentication
const publicPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/verify-email",
];

// List of routes that require admin role
const adminPaths = [
    "/admin",
    "/admin/users",
    "/admin/youtube-channels",
    "/admin/obs-control",
    "/admin/live-stream",
];

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isLoggedIn, user, token, initialized } = useAuthStore();
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

            // Check if the current path is an admin path
            const isAdminPath = adminPaths.some(
                (path) => pathname === path || pathname.startsWith(`${path}/`)
            );

            // If it's an admin path but user isn't an admin, redirect to dashboard
            if (isAdminPath && user?.role !== "admin") {
                console.log(
                    "Unauthorized access to admin route. User role:",
                    user?.role
                );
                router.push("/dashboard");
                return;
            }

            // Handle initial login redirection only
            if (isLoggedIn && pathname === "/") {
                const hasInitialRedirect =
                    sessionStorage.getItem("initialRedirect");
                if (!hasInitialRedirect) {
                    sessionStorage.setItem("initialRedirect", "true");
                    // Redirect based on role only on initial login
                    if (user?.role === "admin") {
                        router.push("/admin");
                    } else if (user?.role === "dealer") {
                        router.push("/dealer/dashboard");
                    } else if (user.role === "moderator") {
                        router.push("/moderator");
                    } else {
                        router.push("/dashboard");
                    }
                    return;
                }
            }

            // Auth check is complete - no timeout needed
            setIsLoading(false);
        }

        checkAuth();
    }, [isLoggedIn, pathname, router, initialized, user]);

    // Show loading state only while authentication is being initialized
    if (isLoading || !initialized) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-6 h-6 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-600">
                        التحقق من الصلاحيات...
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
