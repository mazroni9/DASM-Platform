"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

type Caps = {
  can_access_queue: boolean;
  can_approve_business: boolean;
  can_approve_council: boolean;
};

type TargetUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  type?: string;
};

type ApprovalRow = {
  id: number;
  request_type: string;
  status: string;
  payload?: Record<string, unknown> | null;
  notes?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  target_user?: TargetUser | null;
  reviewed_by?: { first_name?: string; last_name?: string; email?: string } | null;
};

function summaryForRow(row: ApprovalRow): string {
  if (row.request_type === "business_account") {
    const p = row.payload || {};
    const name =
      (p.company_or_venue_name as string) ||
      [row.target_user?.first_name, row.target_user?.last_name]
        .filter(Boolean)
        .join(" ");
    const reg = p.commercial_registry as string | undefined;
    const at = p.account_type as string | undefined;
    return [at, name, reg ? `سجل: ${reg}` : null].filter(Boolean).join(" — ");
  }
  if (row.request_type === "council_permission") {
    const b = (row.payload?.bundle as string) || "";
    return `حزمة صلاحيات: ${b}`;
  }
  return row.request_type;
}

export default function ApprovalRequestsQueue() {
  const [caps, setCaps] = useState<Caps | null>(null);
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({});

  const loadCaps = useCallback(async () => {
    const res = await api.get("/api/admin/approval-requests/capabilities");
    setCaps(res.data?.data ?? null);
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/approval-requests", {
        params: { per_page: 50 },
      });
      const paginated = res.data?.data;
      setRows(paginated?.data ?? []);
    } catch {
      toast.error("تعذر تحميل الطلبات");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCaps();
    loadRows();
  }, [loadCaps, loadRows]);

  const act = async (id: number, action: "approve" | "reject") => {
    try {
      const notes = rejectNotes[id]?.trim() || undefined;
      if (action === "reject") {
        await api.post(`/api/admin/approval-requests/${id}/reject`, { notes });
      } else {
        await api.post(`/api/admin/approval-requests/${id}/approve`);
      }
      toast.success(action === "approve" ? "تمت الموافقة" : "تم الرفض");
      await loadRows();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "تعذر تنفيذ الإجراء";
      toast.error(msg);
    }
  };

  const canAct = (row: ApprovalRow) => {
    if (!caps) return false;
    if (row.status !== "pending") return false;
    if (row.request_type === "business_account") return caps.can_approve_business;
    if (row.request_type === "council_permission") return caps.can_approve_council;
    return false;
  };

  return (
    <div className="space-y-6 rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">طابور الموافقات التشغيلية</h1>
        <Button type="button" variant="outline" onClick={() => loadRows()}>
          تحديث
        </Button>
      </div>

      {loading ? (
        <p className="text-foreground/60 text-sm">جاري التحميل...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm text-right min-w-[720px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-3 font-semibold">#</th>
                <th className="p-3 font-semibold">النوع</th>
                <th className="p-3 font-semibold">المستخدم</th>
                <th className="p-3 font-semibold">ملخص</th>
                <th className="p-3 font-semibold">الحالة</th>
                <th className="p-3 font-semibold">التاريخ</th>
                <th className="p-3 font-semibold">المراجع</th>
                <th className="p-3 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/80 align-top hover:bg-muted/20"
                >
                  <td className="p-3">{row.id}</td>
                  <td className="p-3 whitespace-nowrap">{row.request_type}</td>
                  <td className="p-3">
                    <div className="font-medium">
                      {[row.target_user?.first_name, row.target_user?.last_name]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </div>
                    <div className="text-foreground/60 text-xs">
                      {row.target_user?.email}
                    </div>
                    <div className="text-foreground/50 text-xs">
                      {row.target_user?.type}
                    </div>
                  </td>
                  <td className="p-3 max-w-[240px]">
                    <span className="break-words">{summaryForRow(row)}</span>
                    {row.notes ? (
                      <div className="text-xs text-foreground/60 mt-1">
                        ملاحظات: {row.notes}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3">{row.status}</td>
                  <td className="p-3 whitespace-nowrap text-xs text-foreground/70">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString("ar-SA")
                      : "—"}
                  </td>
                  <td className="p-3 text-xs">
                    {row.reviewed_by
                      ? [
                          row.reviewed_by.first_name,
                          row.reviewed_by.last_name,
                        ]
                          .filter(Boolean)
                          .join(" ")
                      : "—"}
                  </td>
                  <td className="p-3 space-y-2 min-w-[200px]">
                    {row.status === "pending" && canAct(row) ? (
                      <>
                        <Input
                          placeholder="ملاحظات الرفض (اختياري)"
                          value={rejectNotes[row.id] || ""}
                          onChange={(e) =>
                            setRejectNotes((m) => ({
                              ...m,
                              [row.id]: e.target.value,
                            }))
                          }
                          className="h-8 text-xs"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => act(row.id, "approve")}
                          >
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8"
                            onClick={() => act(row.id, "reject")}
                          >
                            رفض
                          </Button>
                        </div>
                      </>
                    ) : (
                      <span className="text-foreground/50 text-xs">
                        {row.status !== "pending"
                          ? "—"
                          : "لا صلاحية قرار على هذا النوع"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="p-6 text-center text-foreground/60 text-sm">
              لا توجد طلبات.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
