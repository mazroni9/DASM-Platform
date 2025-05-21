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
                    } else {
                        router.push("/dashboard");
                    }
                    return;
                }
            }

            // Auth check is complete
            setIsLoading(false);
        }

        checkAuth();

        // Add a timeout to ensure we're not stuck in a loading state
        const timer = setTimeout(() => {
            if (isLoading) {
                console.log("Forcing loading state to complete after timeout");
                setIsLoading(false);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [isLoggedIn, pathname, router, initialized, isLoading, user]);

    // Show loading state while checking authentication (with timeout)
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                    <p className="text-gray-600">جاري التحقق من الدخول...</p>
                </div>
            </div>
        );
    }

    // If we're still here, it means either:
    // 1. The user is authenticated and can access protected routes
    // 2. The route is public and doesn't need authentication
    return <>{children}</>;
}
