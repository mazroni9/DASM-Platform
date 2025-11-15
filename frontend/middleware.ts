import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "";

// Role-based dashboard path mapping
const ROLE_DASHBOARD_PATHS: { [key: string]: string } = {
    'admin': '/admin',
    'venue_owner': '/exhibitor', // For venue owners
    'dealer': '/dashboard',      // For dealers
    'user': '/dashboard',        // For regular users/buyers
    'moderator': '/moderator/dashboard', // For moderators
    'investor': '/investor/dashboard',    // For investors
};

function buildBackendUrl(request: NextRequest): string {
    const origin = API_BASE_URL
        ? API_BASE_URL.replace(/\/$/, "")
        : request.nextUrl.origin;

    return `${origin}/api/user`;
}

function getReturnUrl(request: NextRequest): string {
    const path = request.nextUrl.pathname;
    const search = request.nextUrl.search;

    return `${path}${search}`;
}

// Helper function to check if path is a guest/auth path
function isGuestPath(pathname: string): boolean {
    return pathname.startsWith('/auth/');
}

// Helper function to create redirect response
function redirectTo(request: NextRequest, path: string): NextResponse {
    const url = new URL(path, request.url);
    return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
    if (request.method === "OPTIONS") {
        return NextResponse.next();
    }

    const { pathname } = request.nextUrl;
    const hasFileExtension = /\.[^/]+$/.test(pathname);

    if (hasFileExtension) {
        return NextResponse.next();
    }

    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
        // If no token and trying to access protected route, redirect to login
        if (!isGuestPath(pathname)) {
            const loginUrl = new URL("/auth/login", request.url);
            loginUrl.searchParams.set("returnUrl", getReturnUrl(request));
            return NextResponse.redirect(loginUrl);
        }
        // Allow access to guest paths without token
        return NextResponse.next();
    }

    try {
        const response = await fetch(buildBackendUrl(request), {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            cache: "no-store",
        });

        if (response.ok) {
            // Parse user data from API response
            const userData = await response.json();
            const userRole = userData?.user?.role || userData?.data?.role;
            const correctDashboardPath = ROLE_DASHBOARD_PATHS[userRole] || '/';

            // Rule 1: Redirect Logged-In Guests to their correct dashboard
            if (isGuestPath(pathname)) {
                return redirectTo(request, correctDashboardPath);
            }

            // Rule 2: Prevent Wrong Dashboard Access & ensure correct dashboard is used
            // Check if the current path starts with any of the protected dashboard roots
            const currentPathRoot = pathname.split('/')[1]; // e.g., 'admin', 'exhibitor', 'dashboard'
            
            // Define dashboard root paths for easy comparison
            const dashboardRoots = Object.values(ROLE_DASHBOARD_PATHS)
                .map(path => path.split('/')[1])
                .filter(Boolean); // ['admin', 'exhibitor', 'dashboard', 'moderator', 'investor']

            if (dashboardRoots.includes(currentPathRoot)) {
                // If the current path is NOT their correct dashboard path
                if (!pathname.startsWith(correctDashboardPath)) {
                    return redirectTo(request, correctDashboardPath);
                }
            }

            return NextResponse.next(); // Allow access if role matches path or it's not a dashboard root
        }

        if (response.status === 401) {
            // Token is invalid, redirect to login
            const loginUrl = new URL("/auth/login", request.url);
            loginUrl.searchParams.set("returnUrl", getReturnUrl(request));
            return NextResponse.redirect(loginUrl);
        }
    } catch (error) {
        if (process.env.NODE_ENV !== "production") {
            console.error("Middleware auth check failed:", error);
        }
    }

    // Fallback: redirect to login if something went wrong
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("returnUrl", getReturnUrl(request));
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/admin/:path*",
        "/moderator/:path*",
        "/exhibitor/:path*",
        "/investor/:path*",
        "/dealer/:path*",
        "/auth/:path*", // Include auth paths to handle logged-in users accessing login/register
    ],
};

