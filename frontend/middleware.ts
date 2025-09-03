import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_EXHIBITOR_PATHS = [
  '/exhibitor/add-car',
  '/exhibitor/all-cars',
  '/exhibitor/analytics',
  '/exhibitor/auctions',
  '/exhibitor/cars-data',
  '/exhibitor/commission',
  '/exhibitor/extra-services',
  '/exhibitor/financial',
  '/exhibitor/profile',
  '/exhibitor/ratings',
  '/exhibitor/requests',
  '/exhibitor/reset-password',
  '/exhibitor/settings',
  '/exhibitor/shipping',
  '/exhibitor/wallet',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/exhibitor/')) {
    // 1. تحقق من وجود بيانات في localStorage (من تسجيل الدخول)
    const hasLocalStorageExhibitor = request.cookies.get('exhibitor_logged_in');

    // 2. تحقق من وجود جلسة Laravel
    const hasSession = request.cookies.has('laravel_session');

    const isProtected = PROTECTED_EXHIBITOR_PATHS.some(
      (path) => pathname === path || pathname.startsWith(path + '/')
    );

    if (isProtected) {
      // إذا ما كانش عنده جلسة Laravel ولا بيانات في localStorage → ارفض
      if (!hasSession && !hasLocalStorageExhibitor) {
        const loginUrl = new URL('/exhibitor/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // منع من فتح login/signup إذا كان عنده بيانات
    if (
      pathname === '/exhibitor/login' ||
      pathname === '/exhibitor/signup'
    ) {
      if (hasSession || hasLocalStorageExhibitor) {
        return NextResponse.redirect(new URL('/exhibitor', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/exhibitor/:path*',
};