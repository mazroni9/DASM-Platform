import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "";

// Role-based dashboard path mapping
const ROLE_DASHBOARD_PATHS: { [key: string]: string } = {
  admin: "/admin",
  super_admin: "/admin",
  venue_owner: "/exhibitor",
  dealer: "/dealer",
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

export async function proxy(request: NextRequest) {
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
  console.log("not_RefreshToken_Cookie", refreshTokenCookie);
  console.log("cookie", request.headers.get("cookie"));
  console.warn("warn_not_RefreshToken_Cookie");
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
    console.log("refreshTokenCookie", refreshTokenCookie);
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: `refresh_token=${refreshTokenCookie}`,
      },
      credentials: "include", // Important for cross-domain cookies
    });

    console.log(response);

    if (response.ok) {
      const userData = await response.json();
      const userRole = userData.type;
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

    // For other error responses, log and allow through
    console.error("Middleware API returned status:", response.status);
  } catch (error) {
    console.error("Middleware auth check failed:", error);
    // CRITICAL FIX: In production, if the backend call fails (network, CORS, etc.),
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
