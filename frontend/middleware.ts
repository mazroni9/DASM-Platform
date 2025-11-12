import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "";

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
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("returnUrl", getReturnUrl(request));
        return NextResponse.redirect(loginUrl);
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
            return NextResponse.next();
        }

        if (response.status === 401) {
            const loginUrl = new URL("/auth/login", request.url);
            loginUrl.searchParams.set("returnUrl", getReturnUrl(request));
            return NextResponse.redirect(loginUrl);
        }
    } catch (error) {
        if (process.env.NODE_ENV !== "production") {
            console.error("Middleware auth check failed:", error);
        }
    }

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
    ],
};

