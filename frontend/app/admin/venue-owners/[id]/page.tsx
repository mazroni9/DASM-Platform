"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Building,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Hash,
  Loader2,
  Mail,
  MoreVertical,
  RefreshCw,
  Shield,
  User,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import LoadingLink from "@/components/LoadingLink";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";

type VenueStatus = "pending" | "active" | "rejected" | string;

interface VenueOwner {
  id: number;
  user_id: number | null;
  venue_name?: string | null;
  commercial_registry?: string | null;
  description?: string | null;
  status?: VenueStatus;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  user_name?: string | null;
  user_email?: string | null;
}

/** ---------- Utils ---------- */
function statusChipClasses(status?: VenueStatus) {
  switch (status) {
    case "active":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "pending":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "rejected":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  }
}

function formatDateAr(dateString?: string | null) {
  if (!dateString) return "غير متوفر";
  const d = new Date((dateString as string).replace(" ", "T"));
  if (isNaN(d.getTime())) return dateString as string;
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}

/** ---------- Simple Dropdown (no Radix) ---------- */
function useOnClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      const el = ref?.current;
      if (!el || el.contains(event.target as Node)) return;
      handler();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("keyup", onKey);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("keyup", onKey);
    };
  }, [ref, handler]);
}

interface ActionMenuProps {
  disabled: boolean;
  status?: VenueStatus;
  isActive?: boolean;
  processing: null | "approve" | "reject" | "toggle" | "refresh";
  onApprove: () => void;
  onReject: () => void;
  onToggle: () => void;
  onPrint: () => void;
}

function ActionMenu({
  disabled,
  status,
  isActive,
  processing,
  onApprove,
  onReject,
  onToggle,
  onPrint,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(boxRef, () => setOpen(false));

  return (
    <div className="relative" ref={boxRef}>
      <Button
        variant="outline"
        className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
      >
        <MoreVertical className="w-4 h-4 ml-2" />
        إجراءات
      </Button>

      {open && (
        <div
          className="absolute left-0 mt-2 w-56 rounded-xl border border-gray-700 bg-gray-900 text-gray-100 shadow-xl z-50"
          style={{ minWidth: 220 }}
        >
          <div className="px-3 py-2 text-xs text-gray-400">إدارة الحالة</div>
          <div className="h-px bg-gray-700" />
          <button
            onClick={() => {
              onApprove();
              setOpen(false);
            }}
            disabled={disabled || status === "active"}
            className="w-full text-right px-3 py-2.5 text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {processing === "approve" ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 ml-2 text-green-400" />
            )}
            تفعيل (Approve)
          </button>
          <button
            onClick={() => {
              onReject();
              setOpen(false);
            }}
            disabled={disabled || status === "rejected"}
            className="w-full text-right px-3 py-2.5 text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {processing === "reject" ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <X className="w-4 h-4 ml-2 text-red-400" />
            )}
            رفض (Reject)
          </button>
          <div className="h-px bg-gray-700" />
          <button
            onClick={() => {
              onToggle();
              setOpen(false);
            }}
            disabled={disabled}
            className="w-full text-right px-3 py-2.5 text-sm hover:bg-gray-800 flex items-center"
          >
            {processing === "toggle" ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : isActive ? (
              <X className="w-4 h-4 ml-2 text-red-400" />
            ) : (
              <Check className="w-4 h-4 ml-2 text-green-400" />
            )}
            {isActive ? "تعطيل" : "تفعيل"}
          </button>
          <div className="h-px bg-gray-700" />
          <button
            onClick={() => {
              onPrint();
              setOpen(false);
            }}
            className="w-full text-right px-3 py-2.5 text-sm hover:bg-gray-800 flex items-center"
          >
            <Download className="w-4 h-4 ml-2" />
            طباعة / تصدير PDF
          </button>
        </div>
      )}
    </div>
  );
}

/** ---------- Page ---------- */
export default function VenueOwnerShowPage({ params }: { params: { id: string } }) {
  const ownerId = Number(params.id);
  const [owner, setOwner] = useState<VenueOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<null | "approve" | "reject" | "toggle" | "refresh">(null);

  const headerStatus = useMemo(() => {
    if (!owner) return null;
    switch (owner.status) {
      case "active":
        return { label: "مفعل", Icon: CheckCircle, cls: "text-green-400" };
      case "pending":
        return { label: "في الانتظار", Icon: Clock, cls: "text-amber-400" };
      case "rejected":
        return { label: "مرفوض", Icon: XCircle, cls: "text-red-400" };
      default:
        return { label: owner.status ?? "غير محدد", Icon: Shield, cls: "text-gray-300" };
    }
  }, [owner]);

  async function fetchOwner(silent = false) {
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/api/admin/venue-owners/${ownerId}`);
      const payload = res?.data?.data ?? res?.data;
      const obj: VenueOwner = Array.isArray(payload) ? payload?.[0] : payload;
      if (!obj || !obj.id) {
        toast.error("لم يتم العثور على المالك");
      }
      setOwner(obj ?? null);
    } catch (e) {
      console.error(e);
      toast.error("فشل تحميل بيانات المالك");
      setOwner(null);
    } finally {
      setLoading(false);
      setProcessing(null);
    }
  }

  useEffect(() => {
    fetchOwner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  const doApprove = async () => {
    if (!owner) return;
    try {
      setProcessing("approve");
      const res = await api.post(`/api/admin/venue-owners/${owner.id}/approve`);
      if (res?.data?.ok || res?.data?.status === "success") {
        toast.success("تم تفعيل مالك المعرض");
        setOwner((o) => (o ? { ...o, status: "active", is_active: true } : o));
      } else {
        toast("تم إرسال الطلب. تحقق من النتيجة.");
      }
    } catch (e) {
      console.error(e);
      toast.error("تعذر تنفيذ التفعيل (approve)");
    } finally {
      setProcessing(null);
    }
  };

  const doReject = async () => {
    if (!owner) return;
    const yes = window.confirm("هل أنت متأكد من رفض هذا المالك؟");
    if (!yes) return;
    try {
      setProcessing("reject");
      const res = await api.post(`/api/admin/venue-owners/${owner.id}/reject`);
      if (res?.data?.ok || res?.data?.status === "success") {
        toast.success("تم رفض مالك المعرض");
        setOwner((o) => (o ? { ...o, status: "rejected", is_active: false } : o));
      } else {
        toast("تم إرسال الطلب. تحقق من النتيجة.");
      }
    } catch (e) {
      console.error(e);
      toast.error("تعذر تنفيذ الرفض (reject)");
    } finally {
      setProcessing(null);
    }
  };

  const doToggleActive = async () => {
    if (!owner) return;
    try {
      setProcessing("toggle");
      const res = await api.post(`/api/admin/venue-owners/${owner.id}/toggle-status`, {
        is_active: !owner.is_active,
      });
      if (res?.data?.ok || res?.data?.status === "success") {
        const next = !owner.is_active;
        toast.success(next ? "تم التفعيل" : "تم التعطيل");
        setOwner((o) => (o ? { ...o, is_active: next } : o));
      } else {
        toast("تم إرسال الطلب. تحقق من النتيجة.");
      }
    } catch (e) {
      console.error(e);
      toast.error("تعذر تبديل حالة التفعيل");
    } finally {
      setProcessing(null);
    }
  };

  const copy = async (text?: string | null, label = "تم النسخ") => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success(label);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-6" dir="rtl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="h-5 w-40 bg-gray-700/50 rounded animate-pulse" />
            <div className="h-3 w-64 bg-gray-800/60 rounded mt-2 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 bg-gray-800/60 rounded-xl border border-gray-700/50 animate-pulse" />
            <div className="h-56 bg-gray-800/60 rounded-xl border border-gray-700/50 animate-pulse" />
          </div>
          <div className="h-80 bg-gray-800/60 rounded-xl border border-gray-700/50 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-6" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
              <LoadingLink href="/admin/venue-owners">
                <ArrowRight className="w-4 h-4 ml-2" />
                رجوع للقائمة
              </LoadingLink>
            </Button>
            <h1 className="text-2xl font-bold">لم يتم العثور على المالك</h1>
          </div>
          <Button onClick={() => fetchOwner()} variant="outline" className="bg-gray-800 border-gray-700 text-gray-300">
            <RefreshCw className="w-4 h-4 ml-2" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
            <LoadingLink href="/admin/venue-owners">
              <ArrowRight className="w-4 h-4 ml-2" />
              رجوع
            </LoadingLink>
          </Button>

          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {owner.venue_name || "—"}
            </h1>
            <p className="text-gray-400">
              المالك رقم <span className="font-mono">{owner.id}</span>
            </p>
          </div>

          {headerStatus && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${statusChipClasses(
                owner.status
              )} ml-2`}
            >
              <headerStatus.Icon className={`w-3.5 h-3.5 ${headerStatus.cls}`} />
              {headerStatus.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => fetchOwner(true)}
            variant="outline"
            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            disabled={processing !== null}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${processing === "refresh" ? "animate-spin" : ""}`} />
            تحديث
          </Button>

          {/* Actions menu without Radix */}
          <ActionMenu
            disabled={processing !== null}
            status={owner.status}
            isActive={owner.is_active}
            processing={processing}
            onApprove={doApprove}
            onReject={doReject}
            onToggle={doToggleActive}
            onPrint={() => window.print()}
          />
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <section className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 shadow-lg">
            <div className="p-6 border-b border-gray-700/50">
              <h2 className="text-lg font-semibold">بيانات المعرض</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-400">اسم المعرض</p>
                <p className="text-base font-medium">{owner.venue_name || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400">السجل التجاري</p>
                <div className="flex items-center gap-2">
                  <p className="text-base font-medium">{owner.commercial_registry || "—"}</p>
                  {owner.commercial_registry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-cyan-400 hover:bg-cyan-500/10"
                      onClick={() => copy(owner.commercial_registry, "تم نسخ السجل التجاري")}
                    >
                      <Hash className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 space-y-1">
                <p className="text-sm text-gray-400">الوصف</p>
                <p className="text-base">{owner.description || "—"}</p>
              </div>
            </div>
          </section>

          {/* User Info */}
          <section className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 shadow-lg">
            <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold">بيانات المستخدم المرتبط</h2>
              {owner.user_id ? (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  <LoadingLink href={`/admin/users/${owner.user_id}`}>
                    <User className="w-4 h-4 ml-2" />
                    عرض ملف المستخدم
                  </LoadingLink>
                </Button>
              ) : null}
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-400">المعرف</p>
                <p className="text-base font-medium">{owner.user_id ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400">البريد الإلكتروني</p>
                <div className="flex items-center gap-2">
                  <a
                    className="text-base font-medium text-cyan-400 hover:underline"
                    href={owner.user_email ? `mailto:${owner.user_email}` : "#"}
                  >
                    {owner.user_email || "—"}
                  </a>
                  {owner.user_email && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-cyan-400 hover:bg-cyan-500/10"
                      onClick={() => copy(owner.user_email, "تم نسخ البريد")}
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Meta / Status */}
        <aside className="space-y-6">
          <section className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 shadow-lg">
            <div className="p-6 border-b border-gray-700/50">
              <h3 className="text-lg font-semibold">الحالة والتواريخ</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-400">الحالة</p>
                <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border ${statusChipClasses(owner.status)}`}>
                  {owner.status === "active" ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  ) : owner.status === "pending" ? (
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  ) : owner.status === "rejected" ? (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-gray-300" />
                  )}
                  <span className="text-sm">
                    {owner.status === "active"
                      ? "مفعل"
                      : owner.status === "pending"
                      ? "في الانتظار"
                      : owner.status === "rejected"
                      ? "مرفوض"
                      : owner.status ?? "—"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-400">التفعيل</p>
                <p className="text-base font-medium">{owner.is_active ? "مفعّل" : "غير مفعّل"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-400">تاريخ الإنشاء</p>
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4" />
                  {formatDateAr(owner.created_at)}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-400">آخر تحديث</p>
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4" />
                  {formatDateAr(owner.updated_at)}
                </div>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <Button
                  onClick={doApprove}
                  disabled={processing !== null || owner.status === "active"}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  {processing === "approve" ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Check className="w-4 h-4 ml-2" />}
                  تفعيل
                </Button>
                <Button
                  onClick={doReject}
                  disabled={processing !== null || owner.status === "rejected"}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  {processing === "reject" ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <X className="w-4 h-4 ml-2" />}
                  رفض
                </Button>
                <Button
                  onClick={doToggleActive}
                  disabled={processing !== null}
                  variant="outline"
                  className="col-span-2 bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                  size="sm"
                >
                  {processing === "toggle" ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : owner.is_active ? (
                    <X className="w-4 h-4 ml-2 text-red-400" />
                  ) : (
                    <Check className="w-4 h-4 ml-2 text-green-400" />
                  )}
                  {owner.is_active ? "تعطيل" : "تفعيل"}
                </Button>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 shadow-lg">
            <div className="p-6 border-b border-gray-700/50">
              <h3 className="text-lg font-semibold">اختصارات</h3>
            </div>
            <div className="p-6 flex flex-col gap-2">
              <Button
                asChild
                variant="outline"
                className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                size="sm"
              >
                <LoadingLink href="/admin/venue-owners">
                  <ArrowRight className="w-4 h-4 ml-2" />
                  العودة للقائمة
                </LoadingLink>
              </Button>
              {owner.user_id && (
                <Button
                  asChild
                  variant="outline"
                  className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                  size="sm"
                >
                  <LoadingLink href={`/admin/users/${owner.user_id}`}>
                    <User className="w-4 h-4 ml-2" />
                    فتح المستخدم المرتبط
                  </LoadingLink>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                size="sm"
              >
                <Download className="w-4 h-4 ml-2" />
                طباعة / حفظ PDF
              </Button>
              <Button
                variant="outline"
                className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                size="sm"
                onClick={() => toast("لم يتم تنفيذ التحرير بعد")}
              >
                <Edit className="w-4 h-4 ml-2" />
                تعديل (قريبًا)
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
