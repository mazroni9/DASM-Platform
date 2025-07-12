"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import UnifiedBroadcastManagement from "@/components/UnifiedBroadcastManagement";
import { Loader } from "lucide-react";

export default function LiveStreamManagementPage() {
    const { isAdmin, isLoading, isLoggedIn } = useAuth();
    const router = useRouter();

    // Simplified auth check - let ProtectedRoute handle the main logic
    useEffect(() => {
        if (!isLoading && (!isLoggedIn || !isAdmin)) {
            // This will be handled by ProtectedRoute, but we can show loading
            return;
        }
    }, [isLoading, isLoggedIn, isAdmin]);

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
            <UnifiedBroadcastManagement role="admin" />
        </div>
    );
}
