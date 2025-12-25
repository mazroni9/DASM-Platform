"use client";

import { useEffect, Suspense } from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import VerifyEmailForm from "./Form";
import { useAuth } from "@/hooks/useAuth";
import SuspenseLoader from '@/components/SuspenseLoader';


export default function VerifyEmailPage() {
    const router = useLoadingRouter();
    
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
                            التحقق من البريد الإلكتروني
                        </h1>
                        <p className="text-sm text-gray-500">
                            يرجى التحقق من بريدك الإلكتروني لإكمال عملية التسجيل
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                        <Suspense fallback={<SuspenseLoader />}>
                            <VerifyEmailForm />
                        </Suspense>
                    </div>
                    <div className="text-center text-sm text-gray-500 mt-4">
                        <p>لم تتلق البريد الإلكتروني؟</p>
                        <p className="mt-1 text-gray-400">
                            يرجى التحقق من مجلد البريد المزعج أو استخدم النموذج
                            أعلاه لإعادة إرسال رابط التحقق
                        </p>
                    </div>
                    <div className="text-center">
                        <a
                            href="/auth/login"
                            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                        >
                            العودة إلى صفحة تسجيل الدخول
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
