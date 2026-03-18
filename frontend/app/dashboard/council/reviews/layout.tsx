"use client";

import { useEffect } from "react";
import { usePermission } from "@/hooks/usePermission";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";

export default function CouncilReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { can } = usePermission();
  const router = useLoadingRouter();
  const canReview = can("council.article.review") || can("council.article.edit_any");
  const canPublish = can("council.article.publish");

  useEffect(() => {
    if (!canReview && !canPublish) {
      router.replace("/dashboard/council");
    }
  }, [canReview, canPublish, router]);

  return <>{children}</>;
}
