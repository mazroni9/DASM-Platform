import { NextRequest, NextResponse } from "next/server";

const LOGIN_PATH = "/auth/login";

// كل المسارات اللي لازم تكون محمية (عدّلها حسب مشروعك)
const PROTECTED_PREFIXES = [
  "/admin",
  "/dealer",
  "/exhibitor",
  "/dashboard",
  "/investor",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // تجاهل ملفات Next/Static وأي ملفات بامتداد
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    pathname.startsWith("/api") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // ✅ هنا بنعتمد على cookie اسمها access_token (هنعملها من الستور)
  const tokenCookie = req.cookies.get("access_token")?.value;

  if (!tokenCookie) {
    const next = pathname + (search || "");
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// نخلي الميدلوير يشتغل على المسارات المحمية فقط (أسرع)
export const config = {
  matcher: [
    "/admin/:path*",
    "/dealer/:path*",
    "/exhibitor/:path*",
    "/dashboard/:path*",
    "/investor/:path*",
    "/admin",
    "/dealer",
    "/exhibitor",
    "/dashboard",
    "/investor",
  ],
};
