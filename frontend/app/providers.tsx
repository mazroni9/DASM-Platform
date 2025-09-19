"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useLoading, setLoadingFunctions } from "@/contexts/LoadingContext";

function AuthInitializer({ children }: { children: React.ReactNode }) {
    const { initializeFromStorage } = useAuthStore();
    const [initialized, setInitialized] = useState(false);
    const router = useLoadingRouter();
    const { startLoading, stopLoading } = useLoading();

    useEffect(() => {
        // Set up loading functions for axios interceptors
        setLoadingFunctions({ startLoading, stopLoading });

        const initAuth = async () => {
            // Start loading immediately when auth initialization begins
            startLoading();
            try {
                await initializeFromStorage();
            } catch (error) {
                console.error("Auth initialization error:", error);
            } finally {
                setInitialized(true);
                // Stop loading when auth initialization completes
               stopLoading();
            }
        };

        initAuth();
    }, [initializeFromStorage, startLoading, stopLoading]);

    // Always render children - the GlobalLoader will be shown/hidden automatically
    // based on the loading state controlled by startLoading/stopLoading
    return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return <AuthInitializer>{children}</AuthInitializer>;
}

export default Providers;
