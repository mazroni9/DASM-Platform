import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "";

const ROLE_DASHBOARD_PATHS: Record<string, string> = {
  admin: "/admin",
  super_admin: "/admin",
  moderator: "/admin",
  employee: "/admin",
  venue_owner: "/exhibitor",
  dealer: "/dealer",
  investor: "/investor/dashboard",
  user: "/dashboard",
};

function isGuestPath(pathname: string): boolean {
  return pathname.startsWith("/auth/");
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

function buildApiUrl(request: NextRequest, path: string): string {
  const origin = API_BASE_URL
    ? API_BASE_URL.replace(/\/$/, "")
    : request.nextUrl.origin; // will use rewrites when hitting /api/*
  return `${origin}${path}`;
}

function safeReturnUrl(request: NextRequest): string {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  // لو احنا أصلاً على login.. متعملش nesting للـ returnUrl
  if (pathname.startsWith("/auth/login")) {
    return nextUrl.searchParams.get("returnUrl") || "/";
  }

  const raw = `${nextUrl.pathname}${nextUrl.search}`;
  // امنع ان returnUrl يبقى login نفسه
  if (raw.startsWith("/auth/login")) return "/";
  return raw;
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("returnUrl", safeReturnUrl(request));
  return NextResponse.redirect(loginUrl);
}

function normalizeRole(v: any): string {
  return String(v ?? "").toLowerCase().trim();
}

export async function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") return NextResponse.next();

  const { pathname } = request.nextUrl;

  if (isPublicAssetOrInternal(pathname)) return NextResponse.next();

  const hasFileExtension = /\.[^/]+$/.test(pathname);
  if (hasFileExtension) return NextResponse.next();

  // ✅ اعتمد على access_token cookie (اللي بيتعمل من setTokenCookie)
  const accessTokenCookie = request.cookies.get("access_token")?.value;
  const accessToken = accessTokenCookie ? decodeURIComponent(accessTokenCookie) : "";

  // مفيش token => guest
  if (!accessToken) {
    // اسمح بصفحات auth فقط
    if (!isGuestPath(pathname)) return redirectToLogin(request);
    return NextResponse.next();
  }

  try {
    // ✅ endpoint مؤكد إنه شغال بالـ Bearer عندك
    const apiUrl = buildApiUrl(request, "/api/user/profile");

    const resp = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!resp.ok) {
      // token invalid/expired => روح login
      if (!isGuestPath(pathname)) {
        const r = redirectToLogin(request);
        r.cookies.delete("access_token");
        return r;
      }
      return NextResponse.next();
    }

    const payload = await resp.json();
    const role = normalizeRole(payload?.data?.type || payload?.type);
    const correctDashboard = ROLE_DASHBOARD_PATHS[role] || "/";

    // لو داخل وهو على auth pages => ودّيه داشبورد مناسب
    if (isGuestPath(pathname)) {
      return NextResponse.redirect(new URL(correctDashboard, request.url));
    }

    // حماية المسارات حسب الجذر
    const currentRoot = pathname.split("/")[1];
    const dashboardRoots = Array.from(
      new Set(Object.values(ROLE_DASHBOARD_PATHS).map((p) => p.split("/")[1]).filter(Boolean))
    );

    if (dashboardRoots.includes(currentRoot)) {
      if (!pathname.startsWith(correctDashboard)) {
        return NextResponse.redirect(new URL(correctDashboard, request.url));
      }
    }

    return NextResponse.next();
  } catch (e) {
    // لو فشل الاتصال بالباك: خليك آمن → مسارات محمية تروح login
    if (!isGuestPath(pathname)) return redirectToLogin(request);
    return NextResponse.next();
  }
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
