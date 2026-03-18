"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    if (!token) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, token, router, pathname]);

  // ✅ منع الوميض: لا نرسم أي UI قبل التأكد من حالة الـ auth
  if (!hydrated) return null;
  if (!token) return null;

  return <>{children}</>;
}
