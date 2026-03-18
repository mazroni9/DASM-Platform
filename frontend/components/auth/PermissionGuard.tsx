"use client";

import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: string;
  fallback?: React.ReactNode;
}

export default function PermissionGuard({
  children,
  requiredPermission,
  fallback,
}: PermissionGuardProps) {
  const { can } = usePermission();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Check permission
    const hasPermission = can(requiredPermission);
    setIsAuthorized(hasPermission);

    if (!hasPermission && !fallback) {
      // If no fallback provided, redirect to dashboard or 403
      // For now, let's redirect to dashboard
      // router.push("/admin/dashboard");
    }
  }, [requiredPermission, can, fallback, router]);

  if (isAuthorized === null) {
    return (
      <div className="flex justify-center items-center h-full min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
        <h2 className="text-2xl font-bold text-destructive mb-2">غير مصرح</h2>
        <p className="text-muted-foreground mb-4">
          ليس لديك الصلاحية للوصول إلى هذه الصفحة.
        </p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          العودة للخلف
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

// Higher-Order Component
export function withPermission(
  Component: React.ComponentType<any>,
  requiredPermission: string
) {
  return function WithPermissionWrapper(props: any) {
    return (
      <PermissionGuard requiredPermission={requiredPermission}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}
