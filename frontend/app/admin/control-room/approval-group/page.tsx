"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import Switch from "@mui/material/Switch";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { isApprovalGroupEligibleType } from "@/types/types";

type MemberRow = {
  id: number;
  user_id: number;
  is_active: boolean;
  can_review_requests: boolean;
  can_approve_business_accounts: boolean;
  can_approve_council_requests: boolean;
  user?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    type?: string;
  };
};

type UserHit = {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  type?: string;
};

export default function ControlRoomApprovalGroupPage() {
  const { isSuperAdmin, hydrated } = useAuth();
  const router = useLoadingRouter();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<UserHit[]>([]);
  const [pickId, setPickId] = useState<number | "">("");

  const load = useCallback(async () => {
    const res = await api.get("/api/admin/approval-group");
    setMembers(res.data?.data ?? []);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isSuperAdmin) {
      router.replace("/admin/control-room");
      return;
    }
    load().catch(() => toast.error("تعذر تحميل المجموعة"));
  }, [hydrated, isSuperAdmin, load, router]);

  const searchUsers = async () => {
    if (!q.trim()) {
      setHits([]);
      return;
    }
    try {
      const res = await api.get("/api/admin-panel/users", {
        params: { q: q.trim(), per_page: 15 },
      });
      const paginated = res.data?.data;
      const raw: UserHit[] = paginated?.data ?? [];
      const eligible = raw.filter((u) => isApprovalGroupEligibleType(u.type));
      if (raw.length > 0 && eligible.length === 0) {
        toast.error("لا يوجد ضمن النتائج مستخدم إداري يمكن إضافته للمجموعة");
      }
      setHits(eligible);
    } catch {
      toast.error("تعذر البحث عن المستخدمين");
    }
  };

  const addMember = async () => {
    if (!pickId) {
      toast.error("اختر مستخدماً");
      return;
    }
    const picked = hits.find((u) => u.id === pickId);
    if (!picked || !isApprovalGroupEligibleType(picked.type)) {
      toast.error("يُسمح فقط بإضافة موظفي الإدارة (المدير الأعلى، مدير النظام، المشرف، المبرمج)");
      return;
    }
    try {
      await api.post("/api/admin/approval-group", { user_id: pickId });
      toast.success("تمت الإضافة");
      setPickId("");
      setHits([]);
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "فشلت الإضافة";
      toast.error(msg);
    }
  };

  const patchMember = async (id: number, body: Partial<MemberRow>) => {
    try {
      await api.put(`/api/admin/approval-group/${id}`, body);
      toast.success("تم التحديث");
      await load();
    } catch {
      toast.error("تعذر التحديث");
    }
  };

  const removeMember = async (id: number) => {
    if (!confirm("إزالة هذا العضو من مجموعة الموافقات؟")) return;
    try {
      await api.delete(`/api/admin/approval-group/${id}`);
      toast.success("تمت الإزالة");
      await load();
    } catch {
      toast.error("تعذر الإزالة");
    }
  };

  if (!hydrated || !isSuperAdmin) {
    return (
      <div className="p-6 text-sm text-foreground/60">جاري التحقق من الصلاحيات...</div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-8 rtl max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">مجموعة الموافقات التشغيلية</h1>
        <p className="text-sm text-foreground/60 mt-1">
          إدارة أعضاء مجموعة الموافقات (منفصلة عن أدوار Spatie). متاح لمدير النظام
          الرئيسي فقط — من غرفة المعالجة. يُضاف هنا فقط مستخدمون من نوع إداري
          (المدير الأعلى، مدير النظام، المشرف، المبرمج).
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 space-y-4">
        <h2 className="font-semibold">إضافة عضو</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-foreground/60 block mb-1">بحث</label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="اسم أو بريد أو جوال"
            />
          </div>
          <Button type="button" variant="secondary" onClick={searchUsers}>
            بحث
          </Button>
        </div>
        {hits.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs text-foreground/60">اختر مستخدماً</label>
            <select
              aria-label="اختيار مستخدم لإضافته لمجموعة الموافقات"
              title="اختيار مستخدم"
              className="w-full border border-border rounded-lg p-2 bg-background"
              value={pickId === "" ? "" : String(pickId)}
              onChange={(e) =>
                setPickId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">—</option>
              {hits.map((u) => (
                <option key={u.id} value={u.id}>
                  {[u.first_name, u.last_name].filter(Boolean).join(" ")} ({u.email}) —{" "}
                  {u.type}
                </option>
              ))}
            </select>
            <Button type="button" onClick={addMember}>
              إضافة للمجموعة
            </Button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="p-3 text-right">المستخدم</th>
              <th className="p-3 text-right">نشط</th>
              <th className="p-3 text-right">مراجعة الطابور</th>
              <th className="p-3 text-right">حسابات تجارية</th>
              <th className="p-3 text-right">مجلس السوق</th>
              <th className="p-3 text-right">حذف</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-border/80 align-middle">
                <td className="p-3">
                  <div className="font-medium">
                    {[m.user?.first_name, m.user?.last_name]
                      .filter(Boolean)
                      .join(" ")}
                  </div>
                  <div className="text-xs text-foreground/60">{m.user?.email}</div>
                  <div className="text-xs text-foreground/50">{m.user?.type}</div>
                </td>
                <td className="p-3">
                  <Switch
                    checked={m.is_active}
                    onChange={(_, c) => patchMember(m.id, { is_active: c })}
                    size="small"
                  />
                </td>
                <td className="p-3">
                  <Switch
                    checked={m.can_review_requests}
                    onChange={(_, c) =>
                      patchMember(m.id, { can_review_requests: c })
                    }
                    size="small"
                  />
                </td>
                <td className="p-3">
                  <Switch
                    checked={m.can_approve_business_accounts}
                    onChange={(_, c) =>
                      patchMember(m.id, { can_approve_business_accounts: c })
                    }
                    size="small"
                  />
                </td>
                <td className="p-3">
                  <Switch
                    checked={m.can_approve_council_requests}
                    onChange={(_, c) =>
                      patchMember(m.id, { can_approve_council_requests: c })
                    }
                    size="small"
                  />
                </td>
                <td className="p-3">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeMember(m.id)}
                  >
                    إزالة
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && (
          <p className="p-6 text-center text-foreground/60 text-sm">
            لا يوجد أعضاء بعد.
          </p>
        )}
      </section>
    </div>
  );
}
