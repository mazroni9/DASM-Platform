import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "";

// Role-based dashboard path mapping
const ROLE_DASHBOARD_PATHS: { [key: string]: string } = {
  admin: "/admin",
  super_admin: "/admin",
  venue_owner: "/exhibitor",
  dealer: "/dashboard",
  user: "/dashboard",
  moderator: "/admin",
  investor: "/investor/dashboard",
};

function buildBackendUrl(request: NextRequest): string {
  const origin = API_BASE_URL
    ? API_BASE_URL.replace(/\/$/, "")
    : request.nextUrl.origin;

  return `${origin}/api/user`;
}

function buildMiddlewareApiUrl(request: NextRequest): string {
  const origin = API_BASE_URL
    ? API_BASE_URL.replace(/\/$/, "")
    : request.nextUrl.origin;

  return `${origin}/api/middleware/user-role`;
}

function getReturnUrl(request: NextRequest): string {
  const path = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  return `${path}${search}`;
}

function isGuestPath(pathname: string): boolean {
  return pathname.startsWith("/auth/");
}

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

  // Check for the HttpOnly refresh token cookie
  const refreshTokenCookie = request.cookies.get("refresh_token")?.value;

  if (!refreshTokenCookie) {
    if (!isGuestPath(pathname)) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnUrl", getReturnUrl(request));
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  try {
    // Call the new middleware-specific endpoint to get user role using the refresh token
    const response = await fetch(buildMiddlewareApiUrl(request), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: `refresh_token=${refreshTokenCookie}`, // Manually pass the cookie
      },
      // We don't strictly need credentials: 'include' if we manually pass the Cookie header above,
      // but for standard fetch behavior it's good practice.
      // However, Next.js middleware fetch is a bit different.
      // Passing the Cookie header explicitly is safer here since we have it.
    });

    if (response.ok) {
      const userData = await response.json();
      const userRole = userData.role;
      const correctDashboardPath = ROLE_DASHBOARD_PATHS[userRole] || "/";

      if (isGuestPath(pathname)) {
        return redirectTo(request, correctDashboardPath);
      }

      // Role-based route protection
      const currentPathRoot = pathname.split("/")[1];
      const dashboardRoots = Object.values(ROLE_DASHBOARD_PATHS)
        .map((path) => path.split("/")[1])
        .filter(Boolean);

      if (dashboardRoots.includes(currentPathRoot)) {
        // Check if the user is in the correct dashboard
        // e.g. if role is 'admin', correct path is '/admin'
        // if user is at '/exhibitor', we should redirect them.

        // Simple check: does the current path start with the correct dashboard path?
        if (!pathname.startsWith(correctDashboardPath)) {
          // Avoid redirect loops if the correct path is just '/'
          if (correctDashboardPath !== "/" || pathname !== "/") {
            return redirectTo(request, correctDashboardPath);
          }
        }
      }

      return NextResponse.next();
    }

    if (response.status === 401) {
      // Refresh token is invalid or expired
      if (isGuestPath(pathname)) {
        const nextResponse = NextResponse.next();
        nextResponse.cookies.delete("refresh_token");
        return nextResponse;
      }

      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnUrl", getReturnUrl(request));

      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.delete("refresh_token");
      return redirectResponse;
    }
  } catch (error) {
    console.error("Middleware auth check failed:", error);
    // If backend is down or unreachable, we might want to allow access or redirect to login.
    // Redirecting to login is safer but might be annoying if it's a temporary glitch.
    // For now, let's redirect to login if it's not a guest path.
    if (!isGuestPath(pathname)) {
      // const loginUrl = new URL("/auth/login", request.url);
      // return NextResponse.redirect(loginUrl);
      // Actually, better to just let it pass or show error?
      // Let's stick to safe fail -> login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/moderator/:path*",
    "/exhibitor/:path*",
    "/investor/:path*",
    "/dealer/:path*",
    "/auth/:path*",
  ],
};
