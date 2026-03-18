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
          <h1 className="text-3xl font-bold text-foreground">تسجيل الدخول</h1>
          <p className="mt-2 text-foreground text-sm">
            سجل دخولك للوصول إلى حسابك وإدارة عملياتك في منصة Dasme للمزادات
          </p>
        </div>

        <div className="bg-card backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-border">
          <LoginForm />
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-foreground">
            © {new Date().getFullYear()} منصة Dasme. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </Suspense>
  );
}
