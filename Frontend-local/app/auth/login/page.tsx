'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
// import Cookies from 'js-cookie';
import { CookiesWorkaround } from './cookie-workaround';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'فشل تسجيل الدخول');
        return;
      }

      // ✅ تخزين التوكن والصلاحية في الكوكيز
      // Cookies.set('token', data.token, { expires: 7 }); // مدة 7 أيام
      // Cookies.set('role', data.user.role || 'user', { expires: 7 });
      
      // 🆕 استخدام الحل البديل
      CookiesWorkaround.set('token', data.token, { expires: 7 });
      CookiesWorkaround.set('role', data.user.role || 'user', { expires: 7 });

      // ✅ إعادة التوجيه إلى لوحة التحكم
      router.push('/dashboard');
    } catch (err) {
      setError('حدث خطأ غير متوقع.');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">تسجيل الدخول</h2>
        <form className="space-y-4" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
            required
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-black text-white py-2 rounded-md font-semibold">
            دخول
          </button>
          <div className="flex justify-between text-sm mt-4">
            <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">نسيت كلمة المرور؟</Link>
            <Link href="/auth/register" className="text-blue-600 hover:underline">إنشاء حساب</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
