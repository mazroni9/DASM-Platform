"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";

interface AdminGuardProps {
    children: ReactNode;
}

/**
 * مكون لحماية صفحات لوحة الإدارة
 * يتحقق من أن المستخدم مسجل دخول وأنه مدير
 * إذا لم يكن المستخدم مديراً، يتم توجيهه إلى الصفحة الرئيسية
 */
export default function AdminGuard({ children }: AdminGuardProps) {
    const router = useRouter();
    const { user, isLoggedIn } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);

    const isAdmin = user?.isAdmin || false;

    useEffect(() => {
        // تأخير قصير لتجنب وميض شاشة التحميل
        const timer = setTimeout(() => {
            if (!isLoggedIn) {
                toast.error("يجب تسجيل الدخول للوصول إلى لوحة الإدارة");
                router.push("/auth/login");
            } else if (!isAdmin) {
                toast.error("ليس لديك صلاحية الوصول إلى لوحة الإدارة");
                router.push("/dashboard");
            }
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [isLoggedIn, isAdmin, router]);

    // عرض شاشة تحميل أثناء التحقق
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">جاري التحقق من الصلاحيات...</p>
                </div>
            </div>
        );
    }

    // إذا كان المستخدم مديراً، نعرض المحتوى
    if (isLoggedIn && isAdmin) {
        return <>{children}</>;
    }

    // افتراضياً، لا نعرض أي شيء
    return null;
} 