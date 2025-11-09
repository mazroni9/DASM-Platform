import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. نفس قائمة المسارات العامة من ملفك القديم
const publicPaths = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/verify-email',
  // أضف أي مسارات عامة أخرى (مثل /api/*)
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 2. التحقق مما إذا كان المسار عاماً
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // 3. احصل على "الكوكي" الخاص بتسجيل الدخول
  //    (يجب أن تستبدل 'auth-token' بالاسم الفعلي للكوكي الذي تستخدمه)
  const token = request.cookies.get('auth-token'); 

  // 4. إذا كان المسار محمياً والمستخدم غير مسجل دخوله (لا يوجد توكن)
  if (!isPublicPath && !token) {
    // 5. أعد توجيهه فوراً إلى صفحة تسجيل الدخول (هذا يحدث على الخادم)
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname); // لإعادته لنفس الصفحة بعد التسجيل
    return NextResponse.redirect(loginUrl);
  }

  // 6. إذا كان المسار عاماً ويحاول المستخدم زيارته وهو مسجل دخوله
  //    (مثل محاولة زيارة /auth/login وأنت مسجل)
  //    يمكنك إعادة توجيهه للداشبورد (هذه خطوة اختيارية)
  // if (isPublicPath && token) {
  //   return NextResponse.redirect(new URL('/dashboard', request.url));
  // }

  // 7. إذا كان كل شيء تماماً (مسجل دخوله ويزور صفحة محمية)
  return NextResponse.next();
}

// 8. حدد المسارات التي يجب أن يعمل عليها الـ Middleware
export const config = {
  matcher: [
    /*
     * قم بمطابقة جميع المسارات باستثناء:
     * - /_next/static (ملفات ثابتة)
     * - /_next/image (صور)
     * - /favicon.ico (أيقونة الموقع)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};