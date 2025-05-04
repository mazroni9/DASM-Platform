// ✅ نظام صلاحيات مستوحى من Active Directory (مبسط)
// هدفه: إدارة الوصول للوحة المشرف والمستخدم حسب الدور (Role)
// الموقع: middleware أو داخل ملفات layout / guard

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const url = req.nextUrl.clone();

  // ⛔️ إذا لم يكن مسجلًا
  if (!token) {
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // 🔐 توجيه حسب الدور:
  const role = token.role;

  // دخول لوحة المشرف فقط لـ Admin
  if (url.pathname.startsWith('/dashboard/admin') && role !== 'admin') {
    url.pathname = '/unauthorized';
    return NextResponse.redirect(url);
  }

  // دخول لوحة المستخدم فقط لـ user/buyer/seller
  if (url.pathname.startsWith('/dashboard/user') && role === 'admin') {
    url.pathname = '/dashboard/admin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// ✅ في ملف next.config.js
// export const config = {
//   matcher: ['/dashboard/:path*'],
// };

// ✅ في جلسة تسجيل الدخول (JWT أو session)
// token.role = 'admin' أو 'seller' أو 'user'
