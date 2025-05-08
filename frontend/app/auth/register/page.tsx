"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import RegisterForm from "./Form";
import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (user) {
            router.push("/dashboard");
        }
    }, [user, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4 md:p-6">
            <div className="bg-white lg:p-8 p-6 relative z-10">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            إنشاء حساب جديد
                        </h1>
                        <p className="text-sm text-gray-500">
                            انضم إلى مجتمعنا وابدأ رحلتك في عالم المزادات
                            الرقمية
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                        <RegisterForm />
                    </div>
                    <div className="text-center text-sm text-gray-500 mt-2">
                        <span>لديك حساب بالفعل؟</span>
                        <Link
                            href="/auth/login"
                            className="text-indigo-600 hover:text-indigo-500 font-medium mr-2"
                        >
                            تسجيل الدخول
                        </Link>
                    </div>
                    <p className="text-center text-xs text-gray-500 border-t border-gray-100 pt-4">
                        بإنشاء حساب، أنت توافق على{" "}
                        <a
                            href="/terms"
                            className="text-indigo-600 hover:underline underline-offset-4"
                        >
                            شروط الخدمة
                        </a>{" "}
                        و{" "}
                        <a
                            href="/privacy"
                            className="text-indigo-600 hover:underline underline-offset-4"
                        >
                            سياسة الخصوصية
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
