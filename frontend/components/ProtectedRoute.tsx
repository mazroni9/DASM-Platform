"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useAuthStore } from "@/store/authStore";

import { handleRoleBasedRedirection } from "@/lib/roleNavigation";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useLoadingRouter();
    
    const { isLoggedIn, user, initialized } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!initialized) {
            return;
        }

        if (isLoggedIn && user) {
            handleRoleBasedRedirection(user.role, pathname, router);
        }

        setIsLoading(false);
    }, [initialized, isLoggedIn, user, pathname, router]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <span>Loading...</span>
            </div>
        );
    }

    return <>{children}</>;
}
