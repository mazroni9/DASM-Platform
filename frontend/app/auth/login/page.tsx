// app/auth/login/page.tsx
"use client";

import { Suspense } from "react";
import LoginForm from "./Form";
import SuspenseLoader from "@/components/SuspenseLoader";

export default function LoginPage() {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            تسجيل الدخول
          </h1>
          <p className="mt-2 text-gray-400 text-sm">
            واجهة خاصة بالمحرّجين وفريق الكنترول
          </p>
        </div>

        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-700/50">
          <LoginForm />
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} منصة قلب. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </Suspense>
  );
}