"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useLoading, setLoadingFunctions } from "@/contexts/LoadingContext";

function AuthInitializer({ children }: { children: React.ReactNode }) {
    const { initializeFromStorage } = useAuthStore();
    const [initialized, setInitialized] = useState(false);
    const router = useRouter();
    const { startLoading, stopLoading } = useLoading();

    useEffect(() => {
        // Set up loading functions for axios interceptors
        setLoadingFunctions({ startLoading, stopLoading });

        const initAuth = async () => {
            try {
                await initializeFromStorage();
            } catch (error) {
                console.error("Auth initialization error:", error);
            } finally {
                setInitialized(true);
            }
        };

        initAuth();
    }, [initializeFromStorage, startLoading, stopLoading]);

    if (!initialized) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                    <p className="text-gray-600">جاري تحميل المنصة...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return <AuthInitializer>{children}</AuthInitializer>;
}

export default Providers;
