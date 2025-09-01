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
    // ✅ تحقق من وجود التوكن في localStorage (عبر API)
    const exhibitorToken = request.cookies.get('exhibitor_token')?.value || 
                          request.headers.get('authorization')?.replace('Bearer ', '') ||
                          null;

    const isProtected = PROTECTED_EXHIBITOR_PATHS.some(
      (path) => pathname === path || pathname.startsWith(path + '/')
    );

    if (isProtected) {
      // إذا لم يوجد توكن → إعادة توجيه إلى صفحة الدخول
      if (!exhibitorToken) {
        const loginUrl = new URL('/exhibitor/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // منع الدخول على login/signup إذا عنده توكن
    if (
      pathname === '/exhibitor/login' ||
      pathname === '/exhibitor/signup'
    ) {
      if (exhibitorToken) {
        return NextResponse.redirect(new URL('/exhibitor', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/exhibitor/:path*',
};