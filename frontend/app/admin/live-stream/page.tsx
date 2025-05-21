"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ManageYouTubeBroadcast from "@/components/ManageYouTubeBroadcast";
import { Loader } from "lucide-react";

export default function LiveStreamManagementPage() {
    const { isAdmin, isLoading, isLoggedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            // If not logged in, redirect to login
            if (!isLoggedIn) {
                router.push(
                    `/auth/login?returnUrl=${encodeURIComponent(
                        "/admin/live-stream"
                    )}`
                );
                return;
            }

            // If logged in but not admin, redirect to dashboard
            if (isLoggedIn && !isAdmin) {
                router.push("/dashboard");
                return;
            }
        }
    }, [isLoading, isLoggedIn, isAdmin, router]);

    // Show loading state while checking authentication
    if (isLoading || !isLoggedIn || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <Loader className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 rtl">
            <ManageYouTubeBroadcast />
        </div>
    );
}
