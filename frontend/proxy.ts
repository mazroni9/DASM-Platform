import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "";

// Role-based dashboard path mapping
const ROLE_DASHBOARD_PATHS: Record<string, string> = {
  admin: "/admin",
  super_admin: "/admin",
  venue_owner: "/exhibitor",
  dealer: "/dealer",
  user: "/dashboard",
  moderator: "/admin",
  investor: "/investor/dashboard",
};

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

function isPublicAssetOrInternal(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/api")
  );
}

export async function proxy(request: NextRequest) {
  // Allow preflight
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Ignore Next internals, API routes, and common public assets
  if (isPublicAssetOrInternal(pathname)) {
    return NextResponse.next();
  }

  // Ignore requests to files (e.g. .png, .css, .js, etc.)
  const hasFileExtension = /\.[^/]+$/.test(pathname);
  if (hasFileExtension) {
    return NextResponse.next();
  }

  // Check for the HttpOnly refresh token cookie
  const refreshTokenCookie = request.cookies.get("refresh_token")?.value;

  // If user is not logged in: allow guest pages, otherwise redirect to login
  if (!refreshTokenCookie) {
    if (!isGuestPath(pathname)) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnUrl", getReturnUrl(request));
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  try {
    // Call the middleware-specific endpoint to get user role using the refresh token
    const apiUrl = buildMiddlewareApiUrl(request);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: `refresh_token=${refreshTokenCookie}`,
      },
      credentials: "include",
      cache: "no-store",
    });

    if (response.ok) {
      const userData = await response.json();
      const userRole: string = userData?.type;
      const correctDashboardPath = ROLE_DASHBOARD_PATHS[userRole] || "/";

      // If logged-in user visits auth pages, redirect them to their dashboard
      if (isGuestPath(pathname)) {
        return redirectTo(request, correctDashboardPath);
      }

      // Role-based route protection:
      // If user is inside any dashboard area but not their correct one => redirect
      const currentPathRoot = pathname.split("/")[1];

      const dashboardRoots = Array.from(
        new Set(
          Object.values(ROLE_DASHBOARD_PATHS)
            .map((p) => p.split("/")[1])
            .filter(Boolean)
        )
      );

      if (dashboardRoots.includes(currentPathRoot)) {
        if (!pathname.startsWith(correctDashboardPath)) {
          if (correctDashboardPath !== "/" || pathname !== "/") {
            return redirectTo(request, correctDashboardPath);
          }
        }
      }

      return NextResponse.next();
    }

    if (response.status === 401) {
      // Refresh token is invalid or expired
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnUrl", getReturnUrl(request));

      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.delete("refresh_token");
      return redirectResponse;
    }

    // Other errors: log and fall through
    console.error("Middleware API returned status:", response.status);
  } catch (error) {
    console.error("Middleware auth check failed:", error);

    // Fallback behavior if backend call fails:
    // - Allow guest paths
    // - For protected areas, redirect to login (safer)
    if (!isGuestPath(pathname)) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnUrl", getReturnUrl(request));
      return NextResponse.redirect(loginUrl);
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
