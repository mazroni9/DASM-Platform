"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useLoading, setLoadingFunctions } from "@/contexts/LoadingContext";
import { preloadCriticalComponents, preloadCriticalData } from "@/lib/dynamic-imports";

function AuthInitializer({ children }: { children: React.ReactNode }) {
    const { initializeFromStorage } = useAuthStore();
    const [initialized, setInitialized] = useState(false);
    const router = useLoadingRouter();
    const { startLoading, stopLoading } = useLoading();

    useEffect(() => {
        // Set up loading functions for axios interceptors
        setLoadingFunctions({ startLoading, stopLoading });

        const initAuth = async () => {
            try {
                await initializeFromStorage();
                // Preload critical data after auth
                preloadCriticalData();
            } catch (error) {
                console.error("Auth initialization error:", error);
            } finally {
                setInitialized(true);
            }
        };

        // Defer auth initialization to avoid blocking first paint
        const id = typeof requestIdleCallback !== 'undefined'
            ? requestIdleCallback(initAuth)
            : setTimeout(initAuth, 0) as unknown as number;

        // Preload critical components on user interaction
        preloadCriticalComponents();

        return () => {
            if (typeof cancelIdleCallback !== 'undefined') {
                try { cancelIdleCallback(id as unknown as number); } catch {}
            }
        };
    }, [initializeFromStorage, startLoading, stopLoading]);

    // Always render children - the GlobalLoader will be shown/hidden automatically
    // based on the loading state controlled by startLoading/stopLoading
    return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return <AuthInitializer>{children}</AuthInitializer>;
}

export default Providers;
