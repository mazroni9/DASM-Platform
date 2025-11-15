"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { initialized } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!initialized) {
            return;
        }

        setIsLoading(false);
    }, [initialized]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <span>Loading...</span>
            </div>
        );
    }

    return <>{children}</>;
}
