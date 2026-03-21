"use client";

import LoadingLink from "@/components/LoadingLink";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { LayoutGrid, ClipboardList, UserCog, Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ControlRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSuperAdmin, isAdmin, isModerator, isProgrammer, logout } = useAuth();
  const router = useLoadingRouter();
  const isStaff = isAdmin || isModerator || isProgrammer;

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <div className="space-y-6 rtl">
      <header className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-6 h-6 text-primary shrink-0" />
          <div>
            <p className="font-bold text-lg">غرفة المعالجة التشغيلية</p>
            <p className="text-xs text-foreground/60">
              السيارات الجديدة وطابور الموافقات التشغيلية
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <LoadingLink
            href="/admin/control-room"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-border hover:bg-muted/60 transition"
          >
            <LayoutGrid className="w-4 h-4" />
            الرئيسية
          </LoadingLink>
          <LoadingLink
            href="/admin/control-room/approval-requests"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-border hover:bg-muted/60 transition"
          >
            <ClipboardList className="w-4 h-4" />
            طابور الموافقات
          </LoadingLink>
          {isSuperAdmin ? (
            <LoadingLink
              href="/admin/control-room/approval-group"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-primary/30 bg-primary/5 hover:bg-primary/10 transition"
            >
              <UserCog className="w-4 h-4" />
              مجموعة الموافقات
            </LoadingLink>
          ) : null}
          {isStaff ? (
            <LoadingLink
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-border hover:bg-muted/60 transition"
            >
              لوحة الإدارة
            </LoadingLink>
          ) : null}
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl text-sm text-red-600 border border-red-500/30 hover:bg-red-500/10"
          >
            خروج
          </button>
        </nav>
      </header>
      {children}
    </div>
  );
}
