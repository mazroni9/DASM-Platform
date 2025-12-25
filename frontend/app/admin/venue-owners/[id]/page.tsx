"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  Activity,
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  Building,
  Calendar,
  Car,
  Check,
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
  User,
  Wallet,
  X,
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

const ACTIVITY_PLACEHOLDER = [
  {
    id: 1,
    title: "تم إنشاء الحساب",
    detail: "بواسطة المشرف أحمد الشهري",
    time: "10 نوفمبر 2024 - 10:32 ص",
  },
  {
    id: 2,
    title: "تحديث بيانات السجل التجاري",
    detail: "تم رفع مستند جديد",
    time: "8 نوفمبر 2024 - 4:18 م",
  },
  {
    id: 3,
    title: "إرسال طلب تفعيل",
    detail: "بانتظار اعتماد الإدارة",
    time: "6 نوفمبر 2024 - 11:05 ص",
  },
] as const;

const LEGAL_PLACEHOLDER = [
  {
    id: "DOC-01",
    name: "السجل التجاري",
    status: "مقبول",
    updated: "9 نوفمبر 2024",
  },
  {
    id: "DOC-02",
    name: "رخصة مزاولة النشاط",
    status: "قيد المراجعة",
    updated: "6 نوفمبر 2024",
  },
  {
    id: "DOC-03",
    name: "شهادة الزكاة والدخل",
    status: "مرفوض",
    updated: "2 نوفمبر 2024",
  },
] as const;

interface WalletSummary {
  balance: number;
  balance_sar: number;
  currency: string;
}

interface WalletTransaction {
  id: number;
  amount: number;
  direction?: string | null;
  type?: string | null;
  status?: string | null;
  description?: string | null;
  reference?: string | null;
  created_at?: string | null;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

type TxPagination = PaginationMeta;
type VehiclesPagination = PaginationMeta;

interface VehicleItem {
  id: number;
  make?: string | null;
  model?: string | null;
  year?: number | string | null;
  vin?: string | null;
  auction_status?: string | null;
  total_bids?: number | null;
  updated_at?: string | null;
}

/* -------------------- Helpers -------------------- */

function formatDateAr(dateString?: string | null) {
  if (!dateString) return "غير متوفر";
  const d = new Date((dateString as string).replace(" ", "T"));
  if (isNaN(d.getTime())) return dateString as string;
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTimeAr(dateString?: string | null) {
  if (!dateString) return "غير متوفر";
  const d = new Date((dateString as string).replace(" ", "T"));
  if (isNaN(d.getTime())) return dateString as string;
  return d.toLocaleString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSar(value?: number | null) {
  if (value == null) return "0.00";
  return value.toLocaleString("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getBadgeTone(status: string) {
  const normalized = status.toLowerCase();

  const success = ["جاهز", "مكتمل", "مقبول", "completed", "success", "paid"];
  const pending = [
    "محجوز",
    "قيد الانتظار",
    "قيد المراجعة",
    "pending",
    "processing",
  ];
  const danger = ["مباع", "مرفوض", "failed", "cancelled", "canceled"];

  if (success.some((s) => s.toLowerCase() === normalized))
    return "bg-[#00A95C]/15 text-[#00A95C]";
  if (pending.some((s) => s.toLowerCase() === normalized))
    return "bg-amber-500/15 text-amber-400";
  if (danger.some((s) => s.toLowerCase() === normalized))
    return "bg-red-500/15 text-red-400";
  return "bg-muted text-muted-foreground";
}

function useOnClickOutside(ref: RefObject<HTMLElement>, handler: () => void) {
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

function getOwnerStatusMeta(status?: VenueStatus, isActive?: boolean) {
  const effectiveStatus: VenueStatus | undefined =
    status ??
    (typeof isActive === "boolean"
      ? (isActive ? "active" : "pending")
      : undefined);

  switch (effectiveStatus) {
    case "active":
      return {
        label: "مفعل",
        classes:
          "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-600",
      };
    case "pending":
      return {
        label: "في الانتظار",
        classes:
          "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-600",
      };
    case "rejected":
      return {
        label: "مرفوض",
        classes:
          "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-600",
      };
    default:
      return {
        label: status ?? (isActive ? "مفعل" : "غير محدد"),
        classes:
          "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500",
      };
  }
}

/* -------------------- ToggleSwitch داخلي -------------------- */

interface ToggleSwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
  className,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border border-border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
        checked ? "bg-[#00A95C]" : "bg-muted"
      } ${className ?? ""}`}
    >
      <span
        className={
          "inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform " +
          (checked ? "translate-x-5" : "translate-x-1")
        }
      />
    </button>
  );
}

/* -------------------- قائمة الإجراءات -------------------- */

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
          <div className="px-4 py-2 text-xs text-muted-foreground">
            التحكم في حالة المالك
          </div>
          <div className="h-px bg-border/70" />

          <button
            onClick={() => {
              onApprove();
              setOpen(false);
            }}
            disabled={disabled || !!isActive}
            className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>تفعيل (اعتماد)</span>
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
            <span>رفض نهائي</span>
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
            <span>{isActive ? "تعطيل مؤقت" : "إعادة التفعيل"}</span>
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

/* -------------------- الصفحة الرئيسية -------------------- */

export default function VenueOwnerShowPage({
  params,
}: {
  params: { id: string };
}) {
  const ownerId = Number(params.id);
  const [owner, setOwner] = useState<VenueOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<
    null | "approve" | "reject" | "toggle" | "refresh"
  >(null);
  const [activeTab, setActiveTab] = useState<TabId>("vehicles");

  // Wallet state
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(
    null,
  );
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txPagination, setTxPagination] = useState<TxPagination | null>(null);

  // Vehicles state
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesPagination, setVehiclesPagination] =
    useState<VehiclesPagination | null>(null);

  const ownerInitials = useMemo(() => {
    if (!owner?.venue_name) return "VO";
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

  const fetchVehicles = async (page = 1) => {
    if (!owner) return;
    try {
      setVehiclesLoading(true);
      const res = await api.get(`/api/admin/venue-owners/${owner.id}/cars`, {
        params: { page },
      });

      const payload = res?.data;
      const items: VehicleItem[] = Array.isArray(payload?.data)
        ? (payload.data as VehicleItem[])
        : [];

      setVehicles(items);

      if (payload?.meta) {
        setVehiclesPagination({
          current_page: payload.meta.current_page ?? page,
          last_page: payload.meta.last_page ?? 1,
          per_page: payload.meta.per_page ?? items.length ?? 0,
          total: payload.meta.total ?? items.length ?? 0,
        });
      } else if (items.length) {
        setVehiclesPagination({
          current_page: page,
          last_page: 1,
          per_page: items.length,
          total: items.length,
        });
      } else {
        setVehiclesPagination(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل المركبات");
      setVehicles([]);
      setVehiclesPagination(null);
    } finally {
      setVehiclesLoading(false);
    }
  };

  const fetchWalletSummary = async () => {
    if (!owner) return;
    try {
      setWalletLoading(true);
      setWalletError(null);
      const res = await api.get(
        `/api/admin/venue-owners/${owner.id}/wallet`,
      );
      const payload = res?.data?.data ?? res?.data;

      if (!payload) {
        setWalletSummary(null);
        return;
      }

      setWalletSummary({
        balance: payload.balance ?? 0,
        balance_sar: payload.balance_sar ?? payload.balance ?? 0,
        currency: payload.currency ?? "SAR",
      });
    } catch (error) {
      console.error(error);
      setWalletSummary(null);
      setWalletError("تعذر تحميل بيانات المحفظة");
      toast.error("تعذر تحميل بيانات المحفظة");
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchTransactions = async (page = 1) => {
    if (!owner) return;
    try {
      setTxLoading(true);
      const res = await api.get(
        `/api/admin/venue-owners/${owner.id}/wallet/transactions`,
        {
          params: { page },
        },
      );

      const payload = res?.data?.data ?? res?.data;

      if (Array.isArray(payload)) {
        setTransactions(payload as WalletTransaction[]);
        setTxPagination({
          current_page: 1,
          last_page: 1,
          per_page: payload.length,
          total: payload.length,
        });
      } else if (payload && Array.isArray(payload.data)) {
        setTransactions(payload.data as WalletTransaction[]);
        setTxPagination({
          current_page: payload.current_page ?? page,
          last_page: payload.last_page ?? 1,
          per_page: payload.per_page ?? payload.data.length ?? 0,
          total: payload.total ?? payload.data.length ?? 0,
        });
      } else {
        setTransactions([]);
        setTxPagination(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل الحركات المالية");
      setTransactions([]);
      setTxPagination(null);
    } finally {
      setTxLoading(false);
    }
  };

  // تحميل بيانات المحفظة والمعاملات عند فتح تاب الحركات المالية
  useEffect(() => {
    if (activeTab !== "financial" || !owner) return;
    fetchWalletSummary();
    fetchTransactions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, owner?.id]);

  // تحميل المركبات عند فتح تاب المركبات
  useEffect(() => {
    if (activeTab !== "vehicles" || !owner) return;
    fetchVehicles(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, owner?.id]);

  const doApprove = async () => {
    if (!owner) return;
    try {
      setProcessing("approve");
      const res = await api.post(
        `/api/admin/venue-owners/${owner.id}/approve`,
      );
      if (res?.data?.ok || res?.data?.status === "success") {
        toast.success("تم اعتماد وتفعيل مالك المعرض");
        setOwner((o) =>
          o ? { ...o, is_active: true, status: "active" } : o,
        );
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
    const confirmReject = window.confirm(
      "هل أنت متأكد من رفض هذا المالك نهائياً؟",
    );
    if (!confirmReject) return;
    try {
      setProcessing("reject");
      const res = await api.post(
        `/api/admin/venue-owners/${owner.id}/reject`,
      );
      if (res?.data?.ok || res?.data?.status === "success") {
        toast.success("تم رفض مالك المعرض");
        setOwner((o) =>
          o ? { ...o, status: "rejected", is_active: false } : o,
        );
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
      const res = await api.post(
        `/api/admin/venue-owners/${owner.id}/toggle-status`,
        {
          is_active: !owner.is_active,
        },
      );
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
          <div className="space-y-4">
            {vehiclesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-2xl bg-muted/60 animate-pulse"
                  />
                ))}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
                <Car className="mb-3 h-8 w-8 text-muted-foreground/70" />
                لا توجد مركبات مرتبطة بهذا المالك حتى الآن.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20 text-xs text-muted-foreground">
                        <th className="px-4 py-3 text-right font-medium">
                          رقم المركبة
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          الموديل
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          العروض
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          الحالة
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          آخر تحديث
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {vehicles.map((vehicle) => {
                        const labelId =
                          vehicle.vin || `CAR-${vehicle.id}`;
                        const modelLabel =
                          [vehicle.make, vehicle.model, vehicle.year]
                            .filter(Boolean)
                            .join(" ") || `مركبة رقم ${vehicle.id}`;
                        const bids = vehicle.total_bids ?? 0;
                        const statusLabel =
                          vehicle.auction_status || "غير محدد";

                        return (
                          <tr
                            key={vehicle.id}
                            className="hover:bg-muted/30"
                          >
                            <td className="px-4 py-4 font-mono text-sm text-[#002D5B] dark:text-[#3B82F6]">
                              {labelId}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {modelLabel}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {bids}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getBadgeTone(
                                  statusLabel,
                                )}`}
                              >
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-muted-foreground">
                              {formatDateAr(vehicle.updated_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {vehiclesPagination &&
                  vehiclesPagination.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <div>
                        صفحة {vehiclesPagination.current_page} من{" "}
                          {vehiclesPagination.last_page} — إجمالي{" "}
                        {vehiclesPagination.total} مركبة
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            vehiclesPagination.current_page <= 1 ||
                            vehiclesLoading
                          }
                          onClick={() =>
                            fetchVehicles(
                              vehiclesPagination.current_page - 1,
                            )
                          }
                        >
                          السابق
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            vehiclesPagination.current_page >=
                              vehiclesPagination.last_page ||
                            vehiclesLoading
                          }
                          onClick={() =>
                            fetchVehicles(
                              vehiclesPagination.current_page + 1,
                            )
                          }
                        >
                          التالي
                        </Button>
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        );
      case "financial":
        return (
          <div className="space-y-6">
            {/* ملخص المحفظة */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 rounded-2xl border border-border/60 bg-background/40 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      الرصيد الحالي
                    </p>
                    {walletLoading ? (
                      <div className="mt-3 h-8 w-40 rounded-xl bg-muted animate-pulse" />
                    ) : walletSummary ? (
                      <p className="mt-2 text-2xl font-bold text-foreground">
                        {formatSar(walletSummary.balance_sar)}{" "}
                        <span className="text-sm font-semibold text-muted-foreground">
                          {walletSummary.currency}
                        </span>
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        لا توجد بيانات محفظة حالياً
                      </p>
                    )}
                    {walletError && (
                      <p className="mt-2 text-xs text-red-400">
                        {walletError}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                      <Wallet className="h-4 w-4" />
                      <span>محفظة العارض</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        fetchWalletSummary();
                        fetchTransactions(
                          txPagination?.current_page ?? 1,
                        );
                      }}
                      disabled={walletLoading || txLoading}
                      className="text-[#002D5B] dark:text-[#3B82F6]"
                    >
                      <RefreshCw
                        className={`ml-2 h-4 w-4 ${
                          walletLoading || txLoading
                            ? "animate-spin"
                            : ""
                        }`}
                      />
                      تحديث البيانات
                    </Button>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/40 p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    ملخص سريع
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>عدد العمليات</span>
                      <span className="font-semibold">
                        {txPagination?.total ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>آخر عملية</span>
                      <span className="text-xs text-muted-foreground">
                        {transactions[0]?.created_at
                          ? formatDateTimeAr(
                              transactions[0].created_at,
                            )
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* جدول الحركات */}
            <div className="rounded-2xl border border-border/60 bg-background/40 p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  سجل الحركات المالية
                </h3>
              </div>

              {txLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-14 rounded-2xl bg-muted/60 animate-pulse"
                    />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
                  <Wallet className="mb-3 h-8 w-8 text-muted-foreground/70" />
                  لا توجد حركات مالية لهذا المالك حتى الآن.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/20 text-xs text-muted-foreground">
                          <th className="px-3 py-2 text-right font-medium">
                            رقم العملية
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            النوع
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            الوصف
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            المبلغ
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            الحالة
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            التاريخ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {transactions.map((tx) => {
                          const isOut =
                            tx.direction === "out" ||
                            tx.direction === "OUT" ||
                            (typeof tx.amount === "number" &&
                              tx.amount < 0);
                          const amountValue =
                            Math.abs(tx.amount ?? 0) / 100;
                          const amountClass = isOut
                            ? "text-red-500"
                            : "text-[#00A95C]";
                          const directionLabel = isOut
                            ? "خروج"
                            : "دخول";

                          return (
                            <tr
                              key={tx.id}
                              className="hover:bg-muted/30"
                            >
                              <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                                {tx.reference || `TX-${tx.id}`}
                              </td>
                              <td className="px-3 py-3 text-sm">
                                {tx.type || "—"}
                                <span className="mx-1 text-xs text-muted-foreground">
                                  ({directionLabel})
                                </span>
                              </td>
                              <td className="px-3 py-3 text-xs text-muted-foreground">
                                {tx.description || "—"}
                              </td>
                              <td className="px-3 py-3">
                                <div
                                  className={`flex items-center justify-start gap-2 font-semibold ${amountClass}`}
                                >
                                  {isOut ? (
                                    <ArrowDownRight className="h-4 w-4" />
                                  ) : (
                                    <ArrowUpRight className="h-4 w-4" />
                                  )}
                                  <span>
                                    {formatSar(amountValue)}{" "}
                                    <span className="text-[11px] text-muted-foreground/80">
                                      ر.س
                                    </span>
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                    tx.status
                                      ? getBadgeTone(tx.status)
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {tx.status || "—"}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-xs text-muted-foreground">
                                {formatDateTimeAr(tx.created_at)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {txPagination && txPagination.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <div>
                        صفحة {txPagination.current_page} من{" "}
                        {txPagination.last_page} — إجمالي{" "}
                        {txPagination.total} عملية
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            txPagination.current_page <= 1 || txLoading
                          }
                          onClick={() =>
                            fetchTransactions(
                              txPagination.current_page - 1,
                            )
                          }
                        >
                          السابق
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            txPagination.current_page >=
                              txPagination.last_page || txLoading
                          }
                          onClick={() =>
                            fetchTransactions(
                              txPagination.current_page + 1,
                            )
                          }
                        >
                          التالي
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      case "activity":
        return (
          <div className="space-y-6">
            {ACTIVITY_PLACEHOLDER.map((item, index) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="h-4 w-4 rounded-full border-2 border-[#00A95C] bg-background" />
                  {index !== ACTIVITY_PLACEHOLDER.length - 1 && (
                    <span className="mt-2 h-full w-px flex-1 bg-border/70" />
                  )}
                </div>
                <div className="flex-1 rounded-2xl border border-border/60 bg-background/40 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.detail}
                  </p>
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
              <div
                key={doc.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/40 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#002D5B]/10 p-3 text-[#002D5B] dark:bg-[#3B82F6]/15 dark:text-[#3B82F6]">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      آخر تحديث: {doc.updated}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getBadgeTone(
                      doc.status,
                    )}`}
                  >
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
      <div
        className="min-h-screen bg-background text-foreground p-4 md:p-8"
        dir="rtl"
      >
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
      <div
        className="min-h-screen bg-background text-foreground p-4 md:p-8"
        dir="rtl"
      >
        <div className="mx-auto max-w-4xl space-y-6">
          <section className="rounded-3xl border border-border/60 bg-card p-10 text-center shadow-2xl">
            <Building className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-bold">
              لا توجد بيانات لهذا المالك
            </h1>
            <p className="text-muted-foreground">
              تحقق من الرابط أو حاول التحديث لإعادة تحميل الصفحة.
            </p>
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

  const exhibitorName = owner.venue_name?.trim() || "معرض بدون اسم";
  const ownerCode = owner.id ? `المالك رقم ${owner.id}` : "المالك";
  const statusMeta = getOwnerStatusMeta(owner.status, owner.is_active);

  return (
    <div
      className="min-h-screen bg-background text-foreground p-4 md:p-8"
      dir="rtl"
    >
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
                <span className="text-xl font-semibold">
                  {ownerInitials}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                  Exhibitor
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {exhibitorName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {ownerCode}
                </p>
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
                  if (activeTab === "financial") {
                    fetchWalletSummary();
                    fetchTransactions(
                      txPagination?.current_page ?? 1,
                    );
                  }
                  if (activeTab === "vehicles") {
                    fetchVehicles(
                      vehiclesPagination?.current_page ?? 1,
                    );
                  }
                }}
              >
                <RefreshCw
                  className={`ml-2 h-4 w-4 ${
                    processing === "refresh" ? "animate-spin" : ""
                  }`}
                />
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
                <p className="text-sm text-muted-foreground">
                  اسم المعرض
                </p>
                <p className="text-lg font-semibold">
                  {exhibitorName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  السجل التجاري
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm">
                    {owner.commercial_registry ?? "—"}
                  </span>
                  {owner.commercial_registry && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        copy(
                          owner.commercial_registry,
                          "تم نسخ السجل التجاري",
                        )
                      }
                    >
                      <Hash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  الوصف
                </p>
                <p className="text-sm leading-6 text-foreground/80">
                  {owner.description ||
                    "لا يوجد وصف مُسجّل حالياً."}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  المعرف
                </p>
                <p className="text-lg font-semibold">
                  {owner.user_id ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  البريد الإلكتروني
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    className="text-sm font-semibold text-[#002D5B] hover:underline dark:text-[#3B82F6]"
                    href={
                      owner.user_email
                        ? `mailto:${owner.user_email}`
                        : undefined
                    }
                  >
                    {owner.user_email ?? "—"}
                  </a>
                  {owner.user_email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        copy(owner.user_email, "تم نسخ البريد")
                      }
                    >
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
                <p className="text-sm text-muted-foreground">
                  الحالة الحالية
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold ${statusMeta.classes}`}
                >
                  {statusMeta.label}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  تاريخ الإنشاء
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDateAr(owner.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  آخر تحديث
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDateAr(owner.updated_at)}
                </p>
              </div>

              {/* كتلة التحكم في التفعيل – فقط Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/40 px-3 py-2">
                  <div className="mr-3 text-right space-y-0.5">
                    <p className="text-sm font-medium">
                      حالة التفعيل
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {owner.is_active
                        ? "الحساب مفعل ويمكنه استخدام النظام"
                        : "الحساب معطل ولا يمكنه الدخول حالياً"}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={!!owner.is_active}
                    disabled={processing !== null}
                    onChange={() => doToggleActive()}
                    className="rtl:ml-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border/50 bg-card shadow-2xl">
          <div className="flex flex-wrap gap-3 border-b border-border/60 px-4 py-4">
            {TAB_ITEMS.map((tab) => {
              const isActiveTab = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActiveTab
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
