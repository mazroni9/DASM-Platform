// app/auth/reset-password/page.tsx
'use client';

import { useEffect, Suspense } from 'react';
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import ResetPasswordForm from './Form';
import { useAuth } from '@/hooks/useAuth';
import SuspenseLoader from '@/components/SuspenseLoader';

export default function ResetPasswordPage() {
  const router = useLoadingRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            إعادة تعيين كلمة المرور
          </h1>
          <p className="mt-2 text-gray-400 text-sm">
            أدخل كلمة المرور الجديدة لحسابك
          </p>
        </div>

        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-700/50">
          <Suspense fallback={<SuspenseLoader />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}