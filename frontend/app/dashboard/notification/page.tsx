"use client";

import { useEffect } from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";

export default function NotificationLegacyPage() {
  const router = useLoadingRouter();

  useEffect(() => {
    router.replace("/dashboard/notifications");
  }, [router]);

  return null;
}

