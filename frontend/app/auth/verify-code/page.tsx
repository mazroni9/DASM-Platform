'use client';

import { useState, useEffect } from 'react';
import { useLoadingRouter } from "@/hooks/useLoadingRouter";

import LoadingLink from "@/components/LoadingLink";

export default function VerifyCodePage() {
  const router = useLoadingRouter();
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem('login_email');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      router.push('/auth/login');
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code) {
      setError('يرجى إدخال رمز التحقق');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        localStorage.removeItem('login_email');
        router.push('/dashboard');
      } else {
        setError(data.error || "فشل التحقق من الرمز");
      }
    } catch (err) {
      setError('حدث خطأ أثناء التحقق من الرمز');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setCountdown(30);
        setCanResend(false);

        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.error || "فشل إعادة إرسال الرمز");
      }
    } catch (err) {
      setError('حدث خطأ أثناء إعادة إرسال الرمز');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">التحقق من الحساب</h2>

          {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

          <p className="text-gray-600 mb-6 text-center">
            أدخل رمز التحقق المرسل إلى بريدك الإلكتروني:
            <br />
            {email && <span className="font-medium text-black">{email}</span>}
          </p>

          <label className="block mb-2 text-sm">رمز التحقق</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded mb-6 text-center text-xl tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
            maxLength={6}
            required
          />

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
            disabled={loading}
          >
            {loading ? '...جاري التحقق' : 'تحقق من الرمز'}
          </button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleResendCode}
              className={`text-sm ${canResend ? 'text-blue-600 hover:underline' : 'text-gray-400'} font-medium`}
              disabled={!canResend || loading}
            >
              {canResend
                ? 'إعادة إرسال الرمز'
                : `إعادة الإرسال بعد (${countdown} ثانية)`
              }
            </button>

            <LoadingLink
              href="/auth/login"
              className="block mt-4 text-black font-medium hover:underline"
            >
              العودة إلى تسجيل الدخول
            </LoadingLink>
          </div>
        </form>
      </div>
    </div>
  );
}
