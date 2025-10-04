"use client";

import { useEffect } from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import RegisterForm from "./Form";
import LoadingLink from "@/components/LoadingLink";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useLoadingRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-black">
        <div
          aria-label="جاري التحميل"
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
        />
      </div>
    );
  }

  return (
    <main
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black"
    >
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 py-10 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            إنشاء حساب جديد
          </h1>
          <p className="mt-2 text-gray-400 text-sm">
            انضم إلى مجتمعنا وابدأ رحلتك في عالم المزادات الرقمية
          </p>
        </div>

        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-5 sm:p-8 border border-gray-700/50 overflow-visible">
          <RegisterForm />
        </div>

        <div className="text-center text-sm text-gray-400 mt-6">
          <span>لديك حساب بالفعل؟</span>
          <LoadingLink
            href="/auth/login"
            className="text-blue-400 hover:text-blue-300 font-medium mr-1"
          >
            تسجيل الدخول
          </LoadingLink>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          بإنشاء حساب، أنت توافق على{" "}
          <a
            href="/terms"
            className="text-blue-400 hover:text-blue-300 hover:underline underline-offset-4"
          >
            شروط الخدمة
          </a>{" "}
          و{" "}
          <a
            href="/privacy"
            className="text-blue-400 hover:text-blue-300 hover:underline underline-offset-4"
          >
            سياسة الخصوصية
          </a>
        </p>
      </div>
    </main>
  );
}