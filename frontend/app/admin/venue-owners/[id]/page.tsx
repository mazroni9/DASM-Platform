"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Building,
  Calendar,
  Car,
  Check,
  CheckCircle,
  Clock,
  Download,
  FileCheck,
  FileText,
  Hash,
  Loader2,
  LucideIcon,
  Mail,
  MoreVertical,
  RefreshCw,
  Shield,
  User,
  Wallet,
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

type TabId = "vehicles" | "financial" | "activity" | "legal";

const TAB_ITEMS: { id: TabId; label: string; Icon: LucideIcon }[] = [
  { id: "vehicles", label: "المركبات / السيارات", Icon: Car },
  { id: "financial", label: "الحركات المالية", Icon: Wallet },
  { id: "activity", label: "سجل النشاط", Icon: Activity },
  { id: "legal", label: "المستندات القانونية", Icon: FileText },
];

const VEHICLES_PLACEHOLDER = [
  { id: "CAR-9211", model: "تويوتا كامري 2022", status: "جاهز", bids: 12, date: "12 نوفمبر 2024" },
  { id: "CAR-8834", model: "لكزس LX 600", status: "محجوز", bids: 7, date: "8 نوفمبر 2024" },
  { id: "CAR-7712", model: "بي إم دبليو X5 2023", status: "مباع", bids: 15, date: "4 نوفمبر 2024" },
] as const;

const FINANCIAL_PLACEHOLDER = [
  { id: "#TX-5001", title: "إيداع رسوم الاشتراك", amount: "+ ‎5,000‎ ر.س", status: "مكتمل", date: "13 نوفمبر 2024" },
  { id: "#TX-4981", title: "حجز مركبة - لاندكروزر", amount: "+ ‎180,000‎ ر.س", status: "قيد الانتظار", date: "11 نوفمبر 2024" },
  { id: "#TX-4970", title: "استرداد تأمين", amount: "- ‎2,500‎ ر.س", status: "مكتمل", date: "9 نوفمبر 2024" },
] as const;

const ACTIVITY_PLACEHOLDER = [
  { id: 1, title: "تم إنشاء الحساب", detail: "بواسطة المشرف أحمد الشهري", time: "10 نوفمبر 2024 - 10:32 ص" },
  { id: 2, title: "تحديث بيانات السجل التجاري", detail: "تم رفع مستند جديد", time: "8 نوفمبر 2024 - 4:18 م" },
  { id: 3, title: "إرسال طلب تفعيل", detail: "بانتظار اعتماد الإدارة", time: "6 نوفمبر 2024 - 11:05 ص" },
] as const;

const LEGAL_PLACEHOLDER = [
  { id: "DOC-01", name: "السجل التجاري", status: "مقبول", updated: "9 نوفمبر 2024" },
  { id: "DOC-02", name: "رخصة مزاولة النشاط", status: "قيد المراجعة", updated: "6 نوفمبر 2024" },
  { id: "DOC-03", name: "شهادة الزكاة والدخل", status: "مرفوض", updated: "2 نوفمبر 2024" },
] as const;

function formatDateAr(dateString?: string | null) {
  if (!dateString) return "غير متوفر";
  const d = new Date((dateString as string).replace(" ", "T"));
  if (isNaN(d.getTime())) return dateString as string;
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}

// ملف: (مثلاً) lib/utils.ts أو ملف المساعدات الخاص بك

type VenueStatus = "active" | "pending" | "rejected"; // افترضت تعريف هذا النوع

function getOwnerStatusMeta(status?: VenueStatus) {
  switch (status) {
    case "active":
      return { 
        label: "مفعل", 
        classes: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-600" 
      };
    case "pending":
      return { 
        label: "في الانتظار", 
        classes: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-600" 
      };
    case "rejected":
      return { 
        label: "مرفوض", 
        classes: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-600" 
      };
    default:
      return { 
        label: status ?? "غير محدد", 
        classes: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500" 
      };
  }
}
function getBadgeTone(status: string) {
  const success = ["جاهز", "مكتمل", "مقبول"];
  const pending = ["محجوز", "قيد الانتظار", "قيد المراجعة"];
  const danger = ["مباع", "مرفوض"];

  if (success.includes(status)) return "bg-[#00A95C]/15 text-[#00A95C]";
  if (pending.includes(status)) return "bg-amber-500/15 text-amber-400";
  if (danger.includes(status)) return "bg-red-500/15 text-red-400";
  return "bg-muted text-muted-foreground";
}

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
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setOpen(false));

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        className="border-[#002D5B]/30 text-[#002D5B] dark:border-[#3B82F6]/40 dark:text-[#3B82F6]"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
      >
        <MoreVertical className="w-4 h-4 ml-2" />
        إجراءات
      </Button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 min-w-[220px] rounded-2xl border border-border/70 bg-card shadow-2xl">
          <div className="px-4 py-2 text-xs text-muted-foreground">التحكم في حالة المالك</div>
          <div className="h-px bg-border/70" />

          <button
            onClick={() => {
              onApprove();
              setOpen(false);
            }}
            disabled={disabled || status === "active"}
            className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>تفعيل</span>
            {processing === "approve" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4 text-[#00A95C]" />
            )}
          </button>

          <button
            onClick={() => {
              onReject();
              setOpen(false);
            }}
            disabled={disabled || status === "rejected"}
            className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>رفض</span>
            {processing === "reject" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
          </button>

          <div className="h-px bg-border/70" />

          <button
            onClick={() => {
              onToggle();
              setOpen(false);
            }}
            disabled={disabled}
            className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{isActive ? "تعطيل" : "تفعيل"}</span>
            {processing === "toggle" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isActive ? (
              <X className="h-4 w-4 text-red-400" />
            ) : (
              <Check className="h-4 w-4 text-[#00A95C]" />
            )}
          </button>

          <div className="h-px bg-border/70" />

          <button
            onClick={() => {
              onPrint();
              setOpen(false);
            }}
            className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-muted"
          >
            <span>تصدير PDF</span>
            <Download className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function VenueOwnerShowPage({ params }: { params: { id: string } }) {
  const ownerId = Number(params.id);
  const [owner, setOwner] = useState<VenueOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<null | "approve" | "reject" | "toggle" | "refresh">(null);
  const [activeTab, setActiveTab] = useState<TabId>("vehicles");

  const ownerInitials = useMemo(() => {
    if (!owner?.venue_name) return "HJ";
    return owner.venue_name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [owner?.venue_name]);

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
      if (!silent) setLoading(false);
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
    } catch (error) {
      console.error(error);
      toast.error("تعذر تنفيذ التفعيل");
    } finally {
      setProcessing(null);
    }
  };

  const doReject = async () => {
    if (!owner) return;
    const confirmReject = window.confirm("هل أنت متأكد من رفض هذا المالك؟");
    if (!confirmReject) return;
    try {
      setProcessing("reject");
      const res = await api.post(`/api/admin/venue-owners/${owner.id}/reject`);
      if (res?.data?.ok || res?.data?.status === "success") {
        toast.success("تم رفض مالك المعرض");
        setOwner((o) => (o ? { ...o, status: "rejected", is_active: false } : o));
      } else {
        toast("تم إرسال الطلب. تحقق من النتيجة.");
      }
    } catch (error) {
      console.error(error);
      toast.error("تعذر تنفيذ الرفض");
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
    } catch (error) {
      console.error(error);
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "vehicles":
        return (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-right font-medium">رقم المركبة</th>
                  <th className="px-4 py-3 text-right font-medium">الموديل</th>
                  <th className="px-4 py-3 text-right font-medium">العروض</th>
                  <th className="px-4 py-3 text-right font-medium">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium">آخر تحديث</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {VEHICLES_PLACEHOLDER.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-muted/30">
                    <td className="px-4 py-4 font-mono text-sm text-[#002D5B] dark:text-[#3B82F6]">{vehicle.id}</td>
                    <td className="px-4 py-4 text-sm">{vehicle.model}</td>
                    <td className="px-4 py-4 text-sm">{vehicle.bids}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getBadgeTone(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{vehicle.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "financial":
        return (
          <div className="space-y-4">
            {FINANCIAL_PLACEHOLDER.map((tx) => (
              <div key={tx.id} className="rounded-2xl border border-border/60 bg-background/40 p-4 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{tx.id}</p>
                    <p className="text-base font-semibold text-foreground">{tx.title}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${tx.amount.startsWith("-") ? "text-red-500" : "text-[#00A95C]"}`}>
                      {tx.amount}
                    </p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getBadgeTone(tx.status)}`}>
                    {tx.status}
                  </span>
                  <Button variant="ghost" size="sm" className="text-[#002D5B] dark:text-[#3B82F6]">
                    <Download className="ml-2 h-4 w-4" />
                    تحميل السجل
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );
      case "activity":
        return (
          <div className="space-y-6">
            {ACTIVITY_PLACEHOLDER.map((item, index) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="h-4 w-4 rounded-full border-2 border-[#00A95C] bg-background" />
                  {index !== ACTIVITY_PLACEHOLDER.length - 1 && <span className="mt-2 h-full w-px flex-1 bg-border/70" />}
                </div>
                <div className="flex-1 rounded-2xl border border-border/60 bg-background/40 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      case "legal":
      default:
        return (
          <div className="space-y-4">
            {LEGAL_PLACEHOLDER.map((doc) => (
              <div key={doc.id} className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/40 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#002D5B]/10 p-3 text-[#002D5B] dark:bg-[#3B82F6]/15 dark:text-[#3B82F6]">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">آخر تحديث: {doc.updated}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getBadgeTone(doc.status)}`}>
                    {doc.status}
                  </span>
                  <Button variant="outline" size="sm">
                    معاينة
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8" dir="rtl">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div className="h-10 w-32 rounded-full bg-muted animate-pulse" />
          <div className="h-48 rounded-3xl border border-border/60 bg-card animate-pulse" />
          <div className="h-64 rounded-3xl border border-border/60 bg-card animate-pulse" />
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8" dir="rtl">
        <div className="mx-auto max-w-4xl space-y-6">
          <section className="rounded-3xl border border-border/60 bg-card p-10 text-center shadow-2xl">
            <Building className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-bold">لا توجد بيانات لهذا المالك</h1>
            <p className="text-muted-foreground">تحقق من الرابط أو حاول التحديث لإعادة تحميل الصفحة.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setProcessing("refresh");
                  fetchOwner();
                }}
              >
                <RefreshCw className="ml-2 h-4 w-4" />
                تحديث
              </Button>
              <Button asChild variant="ghost">
                <LoadingLink href="/admin/venue-owners">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  العودة للقائمة
                </LoadingLink>
              </Button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const exhibitorName = owner.venue_name?.trim() || "Huber and Jacobson Plc";
  const ownerCode = owner.id ? `المالك رقم ${owner.id}` : "المالك رقم 1";
  const statusMeta = getOwnerStatusMeta(owner.status);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex justify-end">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-[#002D5B] hover:bg-[#002D5B]/10 dark:text-[#3B82F6] dark:hover:bg-[#3B82F6]/10"
          >
            <LoadingLink href="/admin/venue-owners">
              <ArrowRight className="ml-2 h-4 w-4" />
              رجوع للقائمة
            </LoadingLink>
          </Button>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-border/50 bg-card p-6 shadow-2xl">
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-[#002D5B]/10 via-transparent to-[#00A95C]/10" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#002D5B] text-white shadow-xl dark:bg-[#3B82F6]">
                <span className="text-xl font-semibold">{ownerInitials}</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Exhibitor</p>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{exhibitorName}</h1>
                <p className="text-sm text-muted-foreground">{ownerCode}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-start">
              <Button
                variant="outline"
                disabled={processing !== null}
                className="border-[#002D5B]/30 text-[#002D5B] dark:border-[#3B82F6]/40 dark:text-[#3B82F6]"
                onClick={() => {
                  setProcessing("refresh");
                  fetchOwner(true);
                }}
              >
                <RefreshCw className={`ml-2 h-4 w-4 ${processing === "refresh" ? "animate-spin" : ""}`} />
                تحديث
              </Button>
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
        </section>

        <section className="rounded-3xl border border-border/50 bg-card p-6 shadow-2xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">اسم المعرض</p>
                <p className="text-lg font-semibold">{exhibitorName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">السجل التجاري</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm">{owner.commercial_registry ?? "—"}</span>
                  {owner.commercial_registry && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copy(owner.commercial_registry, "تم نسخ السجل التجاري")}
                    >
                      <Hash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الوصف</p>
                <p className="text-sm leading-6 text-foreground/80">
                  {owner.description || "لا يوجد وصف مُسجّل حالياً."}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">المعرف</p>
                <p className="text-lg font-semibold">{owner.user_id ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    className="text-sm font-semibold text-[#002D5B] hover:underline dark:text-[#3B82F6]"
                    href={owner.user_email ? `mailto:${owner.user_email}` : undefined}
                  >
                    {owner.user_email ?? "—"}
                  </a>
                  {owner.user_email && (
                    <Button variant="ghost" size="icon" onClick={() => copy(owner.user_email, "تم نسخ البريد")}>
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {owner.user_id ? (
                <Button
                  asChild
                  variant="secondary"
                  className="w-full bg-[#002D5B] text-white hover:bg-[#002D5B]/90 dark:bg-[#3B82F6]"
                >
                  <LoadingLink href={`/admin/users/${owner.user_id}`}>
                    <User className="ml-2 h-4 w-4" />
                    عرض ملف المستخدم
                  </LoadingLink>
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  disabled
                  className="w-full bg-muted text-muted-foreground"
                >
                  <User className="ml-2 h-4 w-4" />
                  عرض ملف المستخدم
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">الحالة الحالية</p>
                <span className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold ${statusMeta.classes}`}>
                  {statusMeta.label}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDateAr(owner.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">آخر تحديث</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDateAr(owner.updated_at)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={doApprove}
                  disabled={processing !== null || owner.status === "active"}
                  className="bg-[#00A95C] text-white hover:bg-[#009050]"
                >
                  {processing === "approve" ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Check className="ml-2 h-4 w-4" />}
                  تفعيل
                </Button>
                <Button
                  onClick={doReject}
                  disabled={processing !== null || owner.status === "rejected"}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {processing === "reject" ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <X className="ml-2 h-4 w-4" />}
                  رفض
                </Button>
                <Button
                  variant="outline"
                  className="col-span-2 border-dashed border-[#002D5B]/40 text-[#002D5B] dark:border-[#3B82F6]/40 dark:text-[#3B82F6]"
                  onClick={doToggleActive}
                  disabled={processing !== null}
                >
                  {processing === "toggle" ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : owner.is_active ? (
                    <X className="ml-2 h-4 w-4 text-red-500" />
                  ) : (
                    <Check className="ml-2 h-4 w-4 text-[#00A95C]" />
                  )}
                  {owner.is_active ? "تعطيل" : "تفعيل"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border/50 bg-card shadow-2xl">
          <div className="flex flex-wrap gap-3 border-b border-border/60 px-4 py-4">
            {TAB_ITEMS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#002D5B] text-white shadow-lg dark:bg-[#3B82F6]"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="p-4 md:p-6">{renderTabContent()}</div>
        </section>
      </div>
    </div>
  );
}

