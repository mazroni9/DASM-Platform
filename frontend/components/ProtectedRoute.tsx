"use client";

import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    // ✅ Ensure auth state is initialized at app start
    useAuthStore.getState().initializeFromStorage();
  }, []);

  if (!initialized) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span>Loading...</span>
      </div>
    );
  }

  return <>{children}</>;
}
