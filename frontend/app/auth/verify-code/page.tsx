// app/auth/verify-code/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import LoadingLink from "@/components/LoadingLink";
import { AlertCircle } from "lucide-react";

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

  // معالجة إدخال الرمز (أرقام فقط، 6 أحرف كحد أقصى)
  const handleCodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').substring(0, 6);
    setCode(numericValue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            التحقق من الحساب
          </h1>
          <p className="mt-2 text-gray-400 text-sm">
            أدخل رمز التحقق المرسل إلى بريدك الإلكتروني
          </p>
        </div>

        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-700/50">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-200 flex items-start">
              <AlertCircle className="h-5 w-5 mt-0.5 ml-2 flex-shrink-0 text-red-300" />
              <span>{error}</span>
            </div>
          )}

          {email && (
            <p className="text-gray-300 mb-6 text-center text-sm">
              <span className="font-medium text-white">{email}</span>
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-200 mb-2">
                رمز التحقق
              </label>
              <input
                id="verificationCode"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                maxLength={6}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
                  جاري التحقق...
                </span>
              ) : (
                "تحقق من الرمز"
              )}
            </button>

            <div className="text-center space-y-4">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend || loading}
                className={`text-sm font-medium transition-colors ${
                  canResend 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                {canResend
                  ? 'إعادة إرسال الرمز'
                  : `إعادة الإرسال بعد (${countdown} ثانية)`
                }
              </button>

              <LoadingLink
                href="/auth/login"
                className="block text-gray-400 hover:text-gray-300 font-medium transition-colors"
              >
                العودة إلى تسجيل الدخول
              </LoadingLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}