// components/AppChrome.tsx
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";

function startsWithAny(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}

export default function AppChrome({
  children,
  authModal,
}: {
  children: React.ReactNode;
  authModal?: React.ReactNode;
}) {
  const pathname = usePathname() || "/";

  // auth pages
  const isAuth = startsWithAny(pathname, ["/auth", "/login", "/register"]);

  // dashboards (محميّة)
  const isDashboard = startsWithAny(pathname, [
    "/dashboard",
    "/dealer",
    "/exhibitor",
    "/investor",
  ]);

  // backoffice (لو عندك صفحات admin/moderator)
  const isBackoffice = startsWithAny(pathname, ["/admin", "/moderator"]);

  // ✅ حماية في الداشبورد/الباك اوفيس
  const protect = isDashboard || isBackoffice;

  // ✅ المودال ما يظهرش في backoffice
  const showAuthModal = !isBackoffice;

  return (
    <>
      <main className="flex-1">
        <AuthGuard enabled={protect}>{children}</AuthGuard>
      </main>

      {/* المودال اختياري */}
      {showAuthModal && !isAuth ? authModal : null}
    </>
  );
}
