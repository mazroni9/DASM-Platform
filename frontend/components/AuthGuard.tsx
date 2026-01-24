// components/AuthGuard.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function AuthGuard({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/";

  const hydrated = useAuthStore((s) => s.hydrated);
  const initialized = useAuthStore((s) => s.initialized);
  const loading = useAuthStore((s) => s.loading);
  const token = useAuthStore((s) => s.token);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const initializeFromStorage = useAuthStore((s) => s.initializeFromStorage);

  const started = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (!hydrated) return;
    if (initialized) return;
    if (started.current) return;

    started.current = true;
    initializeFromStorage().catch(() => {});
  }, [enabled, hydrated, initialized, initializeFromStorage]);

  useEffect(() => {
    if (!enabled) return;
    if (!hydrated || !initialized || loading) return;

    if (!token || !isLoggedIn) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [enabled, hydrated, initialized, loading, token, isLoggedIn, router, pathname]);

  // ✅ يمنع أي render قبل ما نعرف حالة auth => مفيش فلاش
  if (!enabled) return <>{children}</>;
  if (!hydrated || !initialized || loading) return null;
  if (!token || !isLoggedIn) return null;

  return <>{children}</>;
}
