"use client";

import LoadingLink from "@/components/LoadingLink";
import { useAuth } from "@/hooks/useAuth";
import { ClipboardList, UserCog } from "lucide-react";

export default function ControlRoomPage() {
  const { isSuperAdmin } = useAuth();

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 rtl">
      <section>
        <h2 className="text-lg font-bold mb-3">العمليات التشغيلية — الموافقات</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LoadingLink
            href="/admin/control-room/approval-requests"
            className="flex items-start gap-3 p-5 rounded-2xl border border-border bg-card hover:bg-muted/30 transition"
          >
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold">طابور الموافقات</p>
              <p className="text-sm text-foreground/60 mt-1">
                حسابات تجارية (تاجر / مالك معرض / مستثمر) وطلبات صلاحيات مجلس السوق، مع سجل
                التدقيق.
              </p>
            </div>
          </LoadingLink>
          {isSuperAdmin ? (
            <LoadingLink
              href="/admin/control-room/approval-group"
              className="flex items-start gap-3 p-5 rounded-2xl border border-primary/25 bg-primary/5 hover:bg-primary/10 transition"
            >
              <div className="p-2 rounded-xl bg-primary/15 text-primary">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">مجموعة الموافقات التشغيلية</p>
                <p className="text-sm text-foreground/60 mt-1">
                  إدارة الأعضاء والقدرات (مدير النظام الرئيسي فقط).
                </p>
              </div>
            </LoadingLink>
          ) : (
            <div className="flex items-start gap-3 p-5 rounded-2xl border border-dashed border-border bg-muted/20 text-foreground/50">
              <UserCog className="w-6 h-6 shrink-0 mt-0.5" />
              <p className="text-sm">
                إدارة مجموعة الموافقات متاحة لمدير النظام الرئيسي فقط.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
