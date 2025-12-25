"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Car as CarIcon,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  Play,
  RefreshCw,
  X,
  ShieldCheck,
  User,
  MapPin,
  Hash,
  Gauge,
  Settings2,
  CalendarDays,
  BadgeCheck,
  AlertTriangle,
  ClipboardCopy,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { PriceWithIcon } from "@/components/ui/priceWithIcon";
import { MoveToLiveDialog } from "@/components/admin/MoveToLiveDialog";

type AuctionRow = {
  id: number | string;
  status?: string;
  status_label?: string;
  auction_type?: string;
  minimum_bid?: number | string | null;
  maximum_bid?: number | string | null;
  reserve_price?: number | string | null;
  starting_bid?: number | string | null;
  current_bid?: number | string | null;
  control_room_approved?: boolean;
  approved_for_live?: boolean;
  start_time?: string | null;
  end_time?: string | null;
};

type UserData = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  type?: string | null;
  status?: string | null;
  kyc_status?: string | null;
  is_active?: boolean;
};

type ReviewDetails = {
  car_id?: number;
  real_probability?: number;
  fake_probability?: number;
  reason?: string;
  features?: {
    vin_input?: string;
    vin_found_in_doc?: boolean;
    doc_has_any_vin?: boolean;
    car_detections?: number;
    best_car_conf?: number;
    images_count?: number;
    has_registration_doc?: boolean;
  };
  ocr?: { vins?: string[] };
  vision?: { car_detections?: number; best_conf?: number };
  [k: string]: any;
};

interface CarData {
  id: number;

  dealer_id?: number | null;
  user_id?: number | null;

  make: string;
  model: string;
  year: number;

  vin?: string | null;
  plate?: string | null;

  condition?: string | null;
  transmission?: string | null;
  market_category?: string | null;

  odometer?: number | null;
  evaluation_price?: number | string | null;

  province?: string | null;
  city?: string | null;

  min_price?: number | string | null;
  max_price?: number | string | null;

  auction_status: string;

  description?: string | null;

  images?: string[] | null;
  registration_card_image?: string | null;

  // AI Review
  review_status?: string | null;
  review_score?: number | string | null;
  review_reason?: string | null;
  reviewed_at?: string | null;
  review_details?: ReviewDetails | string | null;

  user?: UserData | null;
  dealer?: { user: UserData } | null;

  created_at: string;

  auctions?: AuctionRow[];

  report_images?: any[];
  car_attributes?: any[];
}

type CarShowApiResponse = {
  status: "success" | "error";
  data?: {
    car: CarData;
    owner?: UserData;
  };
  message?: string;
};

const toNum = (v: any) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
};

const getCarStatusText = (s: string) => {
  switch (s) {
    case "pending":
      return "قيد المراجعة";
    case "available":
      return "متاح";
    case "in_auction":
      return "في المزاد";
    case "sold":
      return "تم البيع";
    case "cancelled":
    case "canceled":
      return "ملغي";
    default:
      return s || "—";
  }
};

const getCarStatusBadge = (s: string) => {
  switch (s) {
    case "available":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-300";
    case "in_auction":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-300";
    case "sold":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-300";
    case "pending":
      return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300";
    default:
      return "bg-gray-500/10 text-gray-700 border-gray-500/20 dark:text-gray-300";
  }
};

const getReviewBadge = (s?: string | null) => {
  switch ((s || "pending").toLowerCase()) {
    case "approved":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-300";
    case "rejected":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-300";
    case "failed":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-300";
    default:
      return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300";
  }
};

const getReviewText = (s?: string | null) => {
  switch ((s || "pending").toLowerCase()) {
    case "approved":
      return "مقبول";
    case "rejected":
      return "مرفوض";
    case "failed":
      return "فشل";
    default:
      return "قيد المراجعة";
  }
};

function useOutsideClose(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  return ref;
}

function CleanModal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-3xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const ref = useOutsideClose(open, onClose);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div
        ref={ref}
        className={cn("w-full rounded-2xl border border-border bg-card shadow-2xl", maxWidth)}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="text-base font-bold text-foreground">{title}</div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-border text-foreground/70 hover:text-foreground transition"
            aria-label="close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="max-h-[75vh] overflow-y-auto pr-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="flex items-center gap-2 text-xs text-foreground/60 mb-1">
        {icon ? <span className="opacity-80">{icon}</span> : null}
        <span>{label}</span>
      </div>
      <div className="text-sm font-semibold text-foreground break-words">{value ?? "—"}</div>
    </div>
  );
}

function isPdfUrl(url?: string | null) {
  if (!url) return false;
  return /\.pdf($|\?)/i.test(url) || url.includes("/raw/") || url.includes("application/pdf");
}

function safeJsonParse(v: any): any | null {
  if (!v) return null;
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  }
  return null;
}

function parseReasonKVs(reason?: string | null): Record<string, any> {
  if (!reason) return {};
  // مثال: "vin_in_doc=False, car_detections=5, best_conf=0.9565"
  const out: Record<string, any> = {};
  const parts = reason.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const [kRaw, vRaw] = part.split("=").map((x) => (x ?? "").trim());
    if (!kRaw) continue;
    if (vRaw.toLowerCase() === "true") out[kRaw] = true;
    else if (vRaw.toLowerCase() === "false") out[kRaw] = false;
    else if (vRaw !== "" && !Number.isNaN(Number(vRaw))) out[kRaw] = Number(vRaw);
    else out[kRaw] = vRaw;
  }
  return out;
}

function buildHumanReviewSummary(details: ReviewDetails | null, fallbackReason?: string | null) {
  const parsed = parseReasonKVs(details?.reason || fallbackReason || "");
  const features = details?.features || {};
  const vision = details?.vision || {};

  const vinInput = features.vin_input ?? undefined;
  const vinFound = features.vin_found_in_doc ?? parsed.vin_in_doc ?? undefined;
  const docHasVin = features.doc_has_any_vin ?? undefined;

  const carDetections =
    features.car_detections ??
    vision.car_detections ??
    parsed.car_detections ??
    undefined;

  const bestConf =
    features.best_car_conf ??
    vision.best_conf ??
    parsed.best_conf ??
    parsed.best_car_conf ??
    undefined;

  const imagesCount = features.images_count ?? undefined;
  const hasDoc = features.has_registration_doc ?? undefined;

  const lines: { label: string; value: React.ReactNode }[] = [];

  if (vinInput) lines.push({ label: "VIN المُدخل", value: <span className="break-words">{vinInput}</span> });
  if (vinFound !== undefined)
    lines.push({ label: "هل VIN موجود داخل المستند؟", value: vinFound ? "نعم" : "لا" });
  if (docHasVin !== undefined)
    lines.push({ label: "هل المستند يحتوي على أي VIN؟", value: docHasVin ? "نعم" : "لا" });
  if (carDetections !== undefined)
    lines.push({ label: "عدد السيارات المكتشفة في الصور", value: String(carDetections) });
  if (bestConf !== undefined)
    lines.push({ label: "أعلى نسبة ثقة للاكتشاف", value: `${Number(bestConf).toFixed(4)}` });
  if (imagesCount !== undefined)
    lines.push({ label: "عدد الصور", value: String(imagesCount) });
  if (hasDoc !== undefined)
    lines.push({ label: "هل تم رفع مستند التسجيل؟", value: hasDoc ? "نعم" : "لا" });

  const ocrVins = details?.ocr?.vins;
  if (Array.isArray(ocrVins))
    lines.push({ label: "VINs المستخرجة بالـ OCR", value: ocrVins.length ? ocrVins.join(" , ") : "لا يوجد" });

  return lines;
}

function ActionsMenu({
  disabled,
  onSetStatus,
  onMoveToLive,
}: {
  disabled?: boolean;
  onSetStatus: (status: "available" | "in_auction" | "sold") => void;
  onMoveToLive: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "p-2 rounded-lg hover:bg-border text-foreground/70 hover:text-foreground transition",
          disabled && "opacity-50 pointer-events-none"
        )}
        aria-label="actions"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-border bg-card shadow-2xl z-20 overflow-hidden">
          <div className="p-2 space-y-1">
            <div className="px-3 py-2 text-xs text-foreground/60">تغيير حالة السيارة</div>

            <button
              onClick={() => {
                setOpen(false);
                onSetStatus("available");
              }}
              className="w-full text-right px-3 py-2 rounded-lg hover:bg-border flex items-center gap-2 transition"
            >
              <CheckCircle size={16} />
              تحويل إلى متاح
            </button>

            <button
              onClick={() => {
                setOpen(false);
                onSetStatus("in_auction");
              }}
              className="w-full text-right px-3 py-2 rounded-lg hover:bg-border flex items-center gap-2 transition"
            >
              <Play size={16} />
              تحويل إلى في المزاد
            </button>

            <button
              onClick={() => {
                setOpen(false);
                onSetStatus("sold");
              }}
              className="w-full text-right px-3 py-2 rounded-lg hover:bg-border flex items-center gap-2 transition"
            >
              <ShieldCheck size={16} />
              تحويل إلى تم البيع
            </button>

            <div className="h-px bg-border my-2" />

            <button
              onClick={() => {
                setOpen(false);
                onMoveToLive();
              }}
              className="w-full text-right px-3 py-2 rounded-lg hover:bg-border flex items-center gap-2 transition"
            >
              <Play size={16} />
              نقل إلى الحراج المباشر
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCarDetailsPage() {
  const router = useLoadingRouter();
  const params = useParams<{ id: string }>();
  const carId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);

  const [car, setCar] = useState<CarData | null>(null);
  const [owner, setOwner] = useState<UserData | null>(null);

  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [fileModalUrl, setFileModalUrl] = useState<string | null>(null);
  const [fileModalIsPdf, setFileModalIsPdf] = useState(false);
  const [fileModalTitle, setFileModalTitle] = useState("عرض الملف");

  const [showMoveToLiveDialog, setShowMoveToLiveDialog] = useState(false);

  const [statusPicker, setStatusPicker] = useState<"available" | "in_auction" | "sold">("available");

  const [showRawReview, setShowRawReview] = useState(false);

  const ownerName = useMemo(() => {
    const o = owner || car?.dealer?.user || car?.user;
    if (!o) return "غير محدد";
    return `${o.first_name} ${o.last_name}`;
  }, [owner, car]);

  const ownerMeta = useMemo(() => owner || car?.dealer?.user || car?.user || null, [owner, car]);

  const carImages = useMemo(() => (Array.isArray(car?.images) ? car!.images!.filter(Boolean) : []), [car]);
  const auctions = useMemo(() => (Array.isArray(car?.auctions) ? car!.auctions! : []), [car]);

  const normalizedReviewDetails = useMemo<ReviewDetails | null>(() => {
    const parsed = safeJsonParse(car?.review_details);
    if (parsed && typeof parsed === "object") return parsed as ReviewDetails;
    return null;
  }, [car?.review_details]);

  const humanReviewLines = useMemo(() => {
    return buildHumanReviewSummary(normalizedReviewDetails, car?.review_reason || null);
  }, [normalizedReviewDetails, car?.review_reason]);

  const openFile = (url: string, title: string) => {
    setFileModalUrl(url);
    setFileModalIsPdf(isPdfUrl(url));
    setFileModalTitle(title);
    setFileModalOpen(true);
  };

  const fetchCar = async () => {
    if (!carId || Number.isNaN(carId)) {
      toast.error("معرّف السيارة غير صالح");
      router.push("/admin/cars");
      return;
    }

    try {
      setLoading(true);
      const res = await api.get<CarShowApiResponse>(`/api/admin/cars/${carId}`);

      if (res.data?.status === "success" && res.data.data?.car) {
        setCar(res.data.data.car);
        setOwner(res.data.data.owner || null);

        // sync status picker
        const s = res.data.data.car.auction_status;
        if (s === "available" || s === "in_auction" || s === "sold") setStatusPicker(s);
        else setStatusPicker("available");
      } else {
        toast.error(res.data?.message || "تعذر تحميل بيانات السيارة");
        setCar(null);
        setOwner(null);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل بيانات السيارة");
      setCar(null);
      setOwner(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId]);

  const updateCarStatus = async (status: "available" | "in_auction" | "sold") => {
    if (!car) return;
    try {
      setActionBusy(true);
      await api.put(`/api/admin/cars/${car.id}/status`, { status });
      toast.success("تم تحديث حالة السيارة");
      await fetchCar();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل في تحديث حالة السيارة");
    } finally {
      setActionBusy(false);
    }
  };

  const copyText = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      toast.success("تم النسخ");
    } catch {
      toast.error("تعذر النسخ");
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground p-4 md:p-6 overflow-x-hidden">
        <div className="bg-card border border-border rounded-2xl p-6 text-center text-foreground/60">
          جاري تحميل التفاصيل...
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground p-4 md:p-6 overflow-x-hidden">
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <div className="text-foreground/70 font-semibold mb-2">لا يمكن عرض السيارة</div>
          <div className="text-foreground/50 text-sm mb-4">قد تكون السيارة غير موجودة أو ليس لديك صلاحية.</div>
          <button
            onClick={() => router.push("/admin/cars")}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl transition inline-flex items-center gap-2"
          >
            <ArrowRight size={16} />
            الرجوع لقائمة السيارات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground p-4 md:p-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <button
            onClick={() => router.push("/admin/cars")}
            className="text-sm text-foreground/70 hover:text-foreground inline-flex items-center gap-2 mb-2"
          >
            <ArrowRight size={16} />
            الرجوع لقائمة السيارات
          </button>

          <h1 className="text-2xl md:text-3xl font-bold text-primary">تفاصيل السيارة #{car.id}</h1>
          <p className="text-foreground/70 mt-2">
            {car.make} {car.model} • {car.year}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCar}
            className={cn(
              "bg-card border border-border text-foreground/80 hover:bg-border hover:text-foreground transition px-4 py-2.5 rounded-xl inline-flex items-center",
              actionBusy && "opacity-60 pointer-events-none"
            )}
          >
            <RefreshCw className={cn("w-4 h-4 ml-2", actionBusy && "animate-spin")} />
            تحديث
          </button>

          <ActionsMenu
            disabled={actionBusy}
            onSetStatus={updateCarStatus}
            onMoveToLive={() => setShowMoveToLiveDialog(true)}
          />
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Files */}
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-base font-bold text-foreground inline-flex items-center gap-2">
                <ImageIcon size={18} className="opacity-80" />
                الصور والملفات
              </div>
              <span className="text-xs text-foreground/60">{carImages.length} صورة</span>
            </div>

            <div className="rounded-xl border border-border bg-background/40 p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold inline-flex items-center gap-2">
                    <FileText size={16} className="opacity-80" />
                    صورة الاستمارة
                  </div>
                  <div className="text-xs text-foreground/60 mt-1 break-words">
                    {car.registration_card_image ? "متوفرة" : "غير متوفرة"}
                  </div>
                </div>

                {car.registration_card_image ? (
                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <button
                      onClick={() => openFile(car.registration_card_image!, "صورة الاستمارة")}
                      className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition text-sm"
                    >
                      عرض
                    </button>
                    <a
                      href={car.registration_card_image!}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-border hover:bg-border/80 transition text-sm text-foreground text-center"
                    >
                      فتح في تبويب
                    </a>
                  </div>
                ) : null}
              </div>
            </div>

            {carImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {carImages.slice(0, 12).map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    onClick={() => openFile(src, `صورة السيارة ${i + 1}`)}
                    className="block rounded-xl overflow-hidden border border-border bg-background hover:opacity-90 transition"
                    aria-label="open image"
                  >
                    <img src={src} alt={`car-${i}`} className="w-full h-28 object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-foreground/60">لا توجد صور للسيارة</div>
            )}
          </div>

          {/* Car Info */}
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="text-base font-bold text-foreground mb-4 inline-flex items-center gap-2">
              <CarIcon size={18} className="opacity-80" />
              بيانات السيارة
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InfoItem label="الماركة / الموديل" value={`${car.make} ${car.model}`} icon={<CarIcon size={14} />} />
              <InfoItem label="سنة الصنع" value={car.year} icon={<CalendarDays size={14} />} />
              <InfoItem label="VIN" value={car.vin || "—"} icon={<Hash size={14} />} />
              <InfoItem label="اللوحة" value={car.plate || "—"} icon={<Hash size={14} />} />
              <InfoItem label="الممشى" value={`${(car.odometer ?? 0).toLocaleString()} كم`} icon={<Gauge size={14} />} />
              <InfoItem label="القير" value={car.transmission || "—"} icon={<Settings2 size={14} />} />
              <InfoItem label="الحالة الفنية" value={car.condition || "—"} icon={<CheckCircle size={14} />} />
              <InfoItem label="فئة السوق" value={car.market_category || "—"} icon={<BadgeCheck size={14} />} />
              <InfoItem
                label="الموقع"
                value={`${car.province || "—"} / ${car.city || "—"}`}
                icon={<MapPin size={14} />}
              />
            </div>

            {car.description ? (
              <div className="mt-4 rounded-xl border border-border bg-background/40 p-4">
                <div className="text-xs text-foreground/60 mb-2">الوصف</div>
                <div className="text-sm text-foreground whitespace-pre-wrap break-words">{car.description}</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Side */}
        <div className="space-y-5">
          {/* Status + Admin control */}
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-base font-bold text-foreground">الحالة</div>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                  getCarStatusBadge(car.auction_status)
                )}
              >
                {getCarStatusText(car.auction_status)}
              </span>
            </div>

            <div className="text-xs text-foreground/60 mb-3">تعديل الحالة (مسموح فقط: متاح / في المزاد / تم البيع)</div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-xl border border-border bg-background/40 p-3">
                <div className="text-xs text-foreground/60 mb-2">اختيار الحالة</div>
                <div className="flex items-center gap-2">
                  <select
                    value={statusPicker}
                    onChange={(e) => setStatusPicker(e.target.value as any)}
                    className="flex-1 bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    disabled={actionBusy}
                  >
                    <option value="available">متاح</option>
                    <option value="in_auction">في المزاد</option>
                    <option value="sold">تم البيع</option>
                  </select>

                  <button
                    onClick={() => updateCarStatus(statusPicker)}
                    disabled={actionBusy}
                    className={cn(
                      "px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition text-sm",
                      actionBusy && "opacity-60 pointer-events-none"
                    )}
                  >
                    تطبيق
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  disabled={actionBusy}
                  onClick={() => updateCarStatus("available")}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-border transition text-sm inline-flex items-center justify-center gap-2",
                    actionBusy && "opacity-60 pointer-events-none"
                  )}
                >
                  <CheckCircle size={16} />
                  متاح
                </button>

                <button
                  disabled={actionBusy}
                  onClick={() => updateCarStatus("in_auction")}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-border transition text-sm inline-flex items-center justify-center gap-2",
                    actionBusy && "opacity-60 pointer-events-none"
                  )}
                >
                  <Play size={16} />
                  في المزاد
                </button>

                <button
                  disabled={actionBusy}
                  onClick={() => updateCarStatus("sold")}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-border transition text-sm inline-flex items-center justify-center gap-2",
                    actionBusy && "opacity-60 pointer-events-none"
                  )}
                >
                  <ShieldCheck size={16} />
                  تم البيع
                </button>
              </div>
            </div>
          </div>

          {/* AI Review */}
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-base font-bold text-foreground inline-flex items-center gap-2">
                <AlertTriangle size={18} className="opacity-80" />
                مراجعة AI
              </div>

              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                  getReviewBadge(car.review_status)
                )}
              >
                {getReviewText(car.review_status)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <InfoItem
                label="تاريخ المراجعة"
                value={car.reviewed_at ? new Date(car.reviewed_at).toLocaleString("ar-SA") : "—"}
                icon={<CalendarDays size={14} />}
              />

              <InfoItem
                label="السعر التقييمي"
                value={<PriceWithIcon iconSize={16} price={toNum(car.evaluation_price)} />}
              />

              {(normalizedReviewDetails?.real_probability !== undefined ||
                normalizedReviewDetails?.fake_probability !== undefined) && (
                <div className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="text-xs text-foreground/60 mb-2">احتمالات المصداقية</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="text-xs text-foreground/60 mb-1">Real</div>
                      <div className="font-bold tabular-nums">
                        {normalizedReviewDetails?.real_probability ?? "—"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="text-xs text-foreground/60 mb-1">Fake</div>
                      <div className="font-bold tabular-nums">
                        {normalizedReviewDetails?.fake_probability ?? "—"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Human readable summary */}
              <div className="rounded-xl border border-border bg-background/40 p-4">
                <div className="text-sm font-semibold mb-2">ملخص مفهوم</div>

                {humanReviewLines.length ? (
                  <div className="space-y-2">
                    {humanReviewLines.map((l, idx) => (
                      <div key={`line-${idx}`} className="flex items-start justify-between gap-3">
                        <div className="text-xs text-foreground/60">{l.label}</div>
                        <div className="text-sm font-semibold text-foreground text-left break-words">
                          {l.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-foreground/60">
                    لا توجد تفاصيل كافية — (تحقق أن الـ API بيرجع review_details).
                  </div>
                )}

                {/* Fallback reason string */}
                {car.review_reason ? (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-xs text-foreground/60 mb-1">النص الأصلي (Reason)</div>
                    <div className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {car.review_reason}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Raw JSON (review_details) */}
              <div className="rounded-xl border border-border bg-background/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRawReview((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-border/40 transition"
                >
                  <div className="text-sm font-semibold">Review Details (JSON)</div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", showRawReview && "rotate-180")} />
                </button>

                {showRawReview && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-end gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => {
                          const raw = normalizedReviewDetails
                            ? JSON.stringify(normalizedReviewDetails, null, 2)
                            : (car.review_details ? String(car.review_details) : "");
                          copyText(raw);
                        }}
                        className="px-3 py-2 rounded-xl bg-border hover:bg-border/80 transition text-sm inline-flex items-center gap-2"
                      >
                        <ClipboardCopy size={16} />
                        نسخ
                      </button>
                    </div>

                    <pre className="text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words bg-background rounded-xl border border-border p-4">
{normalizedReviewDetails
  ? JSON.stringify(normalizedReviewDetails, null, 2)
  : car.review_details
  ? String(car.review_details)
  : "review_details غير موجودة في الـ API"}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="text-base font-bold text-foreground mb-4">الأسعار</div>
            <div className="grid grid-cols-1 gap-3">
              <InfoItem label="أقل سعر مرغوب" value={<PriceWithIcon iconSize={16} price={toNum(car.min_price)} />} />
              <InfoItem label="أعلى سعر مرغوب" value={<PriceWithIcon iconSize={16} price={toNum(car.max_price)} />} />
            </div>
          </div>

          {/* Owner */}
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="text-base font-bold text-foreground mb-4 inline-flex items-center gap-2">
              <User size={18} className="opacity-80" />
              المالك
            </div>

            <InfoItem label="الاسم" value={ownerName} icon={<User size={14} />} />
            {ownerMeta?.email ? <InfoItem label="البريد" value={ownerMeta.email} icon={<Hash size={14} />} /> : null}
            {ownerMeta?.phone ? <InfoItem label="الهاتف" value={ownerMeta.phone} icon={<Hash size={14} />} /> : null}

            <div className="mt-3 text-xs text-foreground/60">
              تاريخ الإضافة:{" "}
              <span className="text-foreground/80">{new Date(car.created_at).toLocaleDateString("ar-SA")}</span>
            </div>
          </div>

          {/* Auctions */}
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="text-base font-bold text-foreground mb-4">المزادات</div>

            {auctions.length > 0 ? (
              <div className="space-y-3">
                {auctions.slice(0, 4).map((a, idx) => (
                  <div key={`auc-${a.id}-${idx}`} className="rounded-xl border border-border bg-background/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">مزاد #{a.id}</div>
                      <div className="text-xs text-foreground/60">{a.status_label || a.status || "—"}</div>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground/70">أقل مزايدة</span>
                        <span className="font-semibold">{toNum(a.minimum_bid).toLocaleString()} ر.س</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground/70">أعلى مزايدة</span>
                        <span className="font-semibold">{toNum(a.maximum_bid).toLocaleString()} ر.س</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground/70">النوع</span>
                        <span className="font-semibold">{a.auction_type || "—"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-foreground/60">لا توجد مزادات مرتبطة بهذه السيارة</div>
            )}
          </div>
        </div>
      </div>

      {/* File Modal */}
      <CleanModal open={fileModalOpen} onClose={() => setFileModalOpen(false)} title={fileModalTitle} maxWidth="max-w-5xl">
        {!fileModalUrl ? (
          <div className="text-center text-foreground/60 py-8">—</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-border bg-background">
              {fileModalIsPdf ? (
                <iframe src={fileModalUrl} className="w-full h-[70vh]" title="pdf-preview" />
              ) : (
                <img src={fileModalUrl} alt="preview" className="w-full max-h-[70vh] object-contain" />
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setFileModalOpen(false)}
                className="flex-1 bg-border hover:bg-border/80 text-foreground py-3 rounded-xl transition"
              >
                إغلاق
              </button>

              <a
                href={fileModalUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-xl transition text-center"
              >
                فتح في تبويب
              </a>
            </div>
          </div>
        )}
      </CleanModal>

      {/* Move To Live */}
      <MoveToLiveDialog
        open={showMoveToLiveDialog}
        onClose={() => setShowMoveToLiveDialog(false)}
        carIds={[car.id]}
        onSuccess={() => {
          setShowMoveToLiveDialog(false);
          fetchCar();
        }}
      />
    </div>
  );
}
