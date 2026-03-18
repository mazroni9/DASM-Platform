"use client";

import { useEffect } from "react";
import { usePermission } from "@/hooks/usePermission";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";

export default function CouncilCategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { can } = usePermission();
  const router = useLoadingRouter();

  useEffect(() => {
    if (!can("council.category.manage")) {
      router.replace("/dashboard/council");
    }
  }, [can, router]);

  return <>{children}</>;
}
