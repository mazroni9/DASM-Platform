"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiFilter,
  FiEdit,
  FiTrash2,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiX,
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

/**
 * =========================================================
 * API base + Helpers
 * =========================================================
 */
const rawBase = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
const API_ROOT = rawBase || (typeof window !== "undefined" ? window.location.origin : "");

const buildApiUrl = (path: string) => {
  const clean = path.replace(/^\//, "");
  return `${API_ROOT}/api/${clean}`;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  return raw.replace(/^"(.+)"$/, "$1");
}

function isProbablyTechnical(msg: string) {
  const m = (msg || "").toLowerCase();
  return (
    m.includes("stack") ||
    m.includes("sqlstate") ||
    m.includes("exception") ||
    m.includes("trace") ||
    m.includes("undefined") ||
    m.includes("internal server error") ||
    m.includes("<!doctype html") ||
    m.includes("<html")
  );
}

async function readJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function friendlyApiError(data: any, fallback: string) {
  if (data?.errors && typeof data.errors === "object") {
    const key = Object.keys(data.errors)[0];
    const first = data.errors[key]?.[0];
    if (typeof first === "string" && first.trim()) return first;
    return fallback;
  }
  const msg = data?.message;
  if (typeof msg === "string" && msg.trim()) {
    if (isProbablyTechnical(msg)) return fallback;
    if (msg.toLowerCase().includes("unauth"))
      return "جلسة الدخول انتهت. رجاءً سجّل الدخول مرة أخرى.";
    return msg;
  }
  return fallback;
}

async function apiFetch(path: string, init?: RequestInit) {
  const url = buildApiUrl(path);

  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      ...init,
      headers: {
        Accept: "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new Error("تعذّر الاتصال بالخادم. تأكد من الاتصال وحاول مرة أخرى.");
  }

  if (res.status === 401) {
    throw new Error("غير مصرح: يرجى تسجيل الدخول مرة أخرى.");
  }

  if (!res.ok) {
    const data = await readJsonSafe(res);
    const fallback = res.status === 404 ? "البيانات غير موجودة أو المسار غير صحيح." : "حدث خطأ أثناء تنفيذ الطلب.";
    throw new Error(friendlyApiError(data, fallback));
  }

  return res;
}

/**
 * =========================================================
 * Types
 * =========================================================
 */
type CarFromApi = {
  id: number;
  dealer_id: number | null;
  make: string;
  model: string;
  year: number;
  vin: string;
  odometer: number;
  condition: string;
  evaluation_price: string;
  auction_status: string;
  created_at: string;
  updated_at: string;
  color: string | null;
  engine: string | null;
  transmission: string | null;
  description: string | null;
  user_id: number;
  images: string[] | null;
  plate: string | null;
  min_price: string | null;
  max_price: string | null;
  province: string | null;
  city: string | null;
  registration_card_image: string | null;
  market_category: string | null;
  auctions: any[];

  review_status?: string | null;
  review_reason?: any; // ⬅️ خليها any لأن ممكن تيجي JSON string أو object
  analysis_status?: string | null;
  analysis_reason?: any;
};

type CarsApiResponse = {
  status: "success";
  data: {
    current_page: number;
    data: CarFromApi[];
    last_page: number;
    per_page: number;
    total: number;
  };
};

type ShowCarApiResponse = {
  status: "success";
  data: {
    car: CarFromApi;
    active_auction?: any;
    total_bids?: number;
  };
};

type UiCar = {
  id: number;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  transmissionLabel: string;

  auctionStatusAr: "معلن" | "محجوز" | "مباع" | "ملغي" | "غير معروف";
  auctionStatusRaw: string;

  reviewStatusRaw: string | null;
  reviewReason: any;

  addedDate: string;
  views: number;
  inquiries: number;
};

const toNumberSafe = (v?: string | number | null) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const cleaned = v.replace(/\s/g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

/**
 * =========================================================
 * Mappers
 * =========================================================
 */
const mapAuctionStatusToArabic = (s?: string): UiCar["auctionStatusAr"] => {
  switch ((s || "").toLowerCase()) {
    case "available":
    case "active":
      return "معلن";
    case "scheduled":
    case "reserved":
      return "محجوز";
    case "sold":
      return "مباع";
    case "cancelled":
    case "canceled":
      return "ملغي";
    default:
      return "غير معروف";
  }
};

const mapTransmissionLabel = (t?: string) => {
  const v = (t || "").toLowerCase();
  if (v === "automatic") return "أوتوماتيك";
  if (v === "manual") return "عادي";
  if (v === "cvt") return "CVT";
  return "";
};

const mapConditionLabel = (c?: string) => {
  const v = (c || "").toLowerCase();
  if (v === "excellent") return "ممتازة";
  if (v === "good") return "جيدة";
  if (v === "fair") return "متوسطة";
  if (v === "poor") return "ضعيفة";
  return c || "";
};

const mapMarketCategoryLabel = (v?: string) => {
  const key = (v || "").toLowerCase();
  switch (key) {
    case "luxurycars":
      return "سوق السيارات الفارهة";
    case "classic":
      return "سوق السيارات الكلاسيكية";
    case "caravan":
      return "سوق الكرافانات";
    case "busestrucks":
      return "سوق الشاحنات والحافلات";
    case "companiescars":
      return "سوق سيارات الشركات";
    default:
      return v || "";
  }
};

/**
 * =========================================================
 * Status Badges
 * =========================================================
 */
type ReviewTone = "muted" | "info" | "warn" | "danger" | "success";

function reviewLabel(st?: string | null) {
  const s = (st || "").toLowerCase();
  if (!s) return { text: "غير معروف", tone: "muted" as const };
  if (s === "processing") return { text: "جارٍ الفحص", tone: "info" as const };
  if (s === "under_review") return { text: "تحت المراجعة", tone: "warn" as const };
  if (s === "approved") return { text: "مقبولة", tone: "success" as const };
  if (s === "rejected") return { text: "مرفوضة", tone: "danger" as const };
  if (s === "failed") return { text: "فشل الفحص", tone: "danger" as const };
  return { text: st || "غير معروف", tone: "muted" as const };
}

function badgeClass(tone: ReviewTone) {
  if (tone === "success") return "bg-emerald-500/12 text-emerald-600 border-emerald-500/25 dark:text-emerald-300";
  if (tone === "danger") return "bg-rose-500/12 text-rose-600 border-rose-500/25 dark:text-rose-300";
  if (tone === "warn") return "bg-amber-500/12 text-amber-700 border-amber-500/25 dark:text-amber-200";
  if (tone === "info") return "bg-sky-500/12 text-sky-700 border-sky-500/25 dark:text-sky-200";
  return "bg-muted/30 text-muted-foreground border-border";
}

function auctionBadgeClass(st: UiCar["auctionStatusAr"]) {
  if (st === "معلن") return "bg-emerald-500/12 text-emerald-700 border-emerald-500/25 dark:text-emerald-200";
  if (st === "محجوز") return "bg-amber-500/12 text-amber-700 border-amber-500/25 dark:text-amber-200";
  if (st === "مباع") return "bg-rose-500/12 text-rose-700 border-rose-500/25 dark:text-rose-200";
  if (st === "ملغي") return "bg-slate-500/12 text-slate-700 border-slate-500/25 dark:text-slate-200";
  return "bg-muted/30 text-muted-foreground border-border";
}

/**
 * =========================================================
 * AI Reason Formatter (الجزء المهم)
 * =========================================================
 */
const aiLabels: Record<string, string> = {
  car_id: "رقم السيارة",
  real_probability: "احتمالية حقيقي",
  fake_probability: "احتمالية مزيف",
  reason: "السبب",

  vin_input: "VIN المُدخل",
  vin_found_in_doc: "تم العثور على VIN في المستند",
  doc_has_any_vin: "هل يحتوي المستند على أي VIN",
  vin_in_doc: "VIN موجود في المستند",

  car_detections: "عدد السيارات المكتشفة",
  best_conf: "أعلى ثقة (Vision)",
  best_car_conf: "أعلى ثقة للسيارة",
  images_count: "عدد الصور",
  has_registration_doc: "يوجد مستند تسجيل",

  vins: "VINs المستخرجة (OCR)",
};

function formatAiValue(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "نعم" : "لا";
  if (typeof v === "number") {
    // لو احتمال -> نسبة
    if (v >= 0 && v <= 1) return `${Math.round(v * 100)}%`;
    // لو ثقة
    if (v > 0 && v < 10) return v.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
    return v.toLocaleString();
  }
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "object") return "—";
  return String(v);
}

function tryParseJson(input: any): any | null {
  if (!input) return null;
  if (typeof input === "object") return input; // already parsed
  if (typeof input !== "string") return null;

  const s = input.trim();
  if (!s) return null;

  // sometimes backend sends JSON as string
  if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  }
  return null;
}

function parseKeyValueReason(input: string): Record<string, any> | null {
  const s = (input || "").trim();
  if (!s) return null;

  // must look like: a=b, c=d ...
  if (!s.includes("=")) return null;

  const out: Record<string, any> = {};
  const parts = s.split(",").map((x) => x.trim()).filter(Boolean);

  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const k = p.slice(0, idx).trim();
    let valRaw = p.slice(idx + 1).trim();

    // normalize booleans
    const low = valRaw.toLowerCase();
    if (low === "true") out[k] = true;
    else if (low === "false") out[k] = false;
    else if (!Number.isNaN(Number(valRaw)) && valRaw !== "") out[k] = Number(valRaw);
    else out[k] = valRaw;
  }

  return Object.keys(out).length ? out : null;
}

function pick(obj: any, keys: string[]) {
  const out: Record<string, any> = {};
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  }
  return out;
}

function KeyValueList({ data }: { data: Record<string, any> }) {
  const entries = Object.entries(data || {});
  if (!entries.length) return null;

  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-4 bg-secondary/30 border border-border rounded-xl px-3 py-2">
          <div className="text-xs font-semibold text-foreground">
            {aiLabels[k] || k}
          </div>
          <div className="text-xs text-muted-foreground text-left tabular-nums whitespace-pre-wrap break-words max-w-[60%]">
            {formatAiValue(v)}
          </div>
        </div>
      ))}
    </div>
  );
}

function AiReadableBlock({ raw }: { raw: any }) {
  // 1) JSON object?
  const parsedJson = tryParseJson(raw);

  // 2) Key=Value string?
  const kv = typeof raw === "string" ? parseKeyValueReason(raw) : null;

  // JSON payload style
  if (parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson)) {
    const main = pick(parsedJson, ["car_id", "real_probability", "fake_probability"]);
    const reasonStr = typeof parsedJson.reason === "string" ? parsedJson.reason : null;
    const reasonKv = reasonStr ? parseKeyValueReason(reasonStr) : null;

    const features = parsedJson.features && typeof parsedJson.features === "object" ? parsedJson.features : null;
    const ocr = parsedJson.ocr && typeof parsedJson.ocr === "object" ? parsedJson.ocr : null;
    const vision = parsedJson.vision && typeof parsedJson.vision === "object" ? parsedJson.vision : null;

    return (
      <div className="space-y-4">
        {Object.keys(main).length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">الملخص</div>
            <KeyValueList data={main} />
          </div>
        )}

        {(reasonKv || reasonStr) && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">السبب</div>
            {reasonKv ? (
              <KeyValueList data={reasonKv} />
            ) : (
              <div className="bg-secondary/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground whitespace-pre-wrap">
                {reasonStr}
              </div>
            )}
          </div>
        )}

        {features && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">تفاصيل الخصائص (Features)</div>
            <KeyValueList data={features} />
          </div>
        )}

        {ocr && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">نتائج OCR</div>
            <KeyValueList data={ocr} />
          </div>
        )}

        {vision && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">نتائج Vision</div>
            <KeyValueList data={vision} />
          </div>
        )}
      </div>
    );
  }

  // Key=Value only
  if (kv) {
    return (
      <div>
        <div className="text-xs text-muted-foreground mb-2">السبب</div>
        <KeyValueList data={kv} />
      </div>
    );
  }

  // fallback plain text
  if (typeof raw === "string" && raw.trim()) {
    return (
      <div>
        <div className="text-xs text-muted-foreground mb-2">السبب</div>
        <div className="bg-secondary/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground whitespace-pre-wrap">
          {raw}
        </div>
      </div>
    );
  }

  return <div className="text-sm text-muted-foreground">لا توجد تفاصيل إضافية.</div>;
}

/**
 * =========================================================
 * Scroll/Keyboard UX
 * =========================================================
 */
function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [locked]);
}

function useEscapeToClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

/**
 * =========================================================
 * Toasts
 * =========================================================
 */
type ToastType = "success" | "error" | "info";
type Toast = { id: string; type: ToastType; title?: string; message: string };

function ToastStack({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed z-[9999] top-5 right-5 flex flex-col gap-2 w-[min(92vw,360px)] pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto rounded-2xl border shadow-xl backdrop-blur bg-card/95 p-4 ${
              t.type === "success"
                ? "border-emerald-500/25"
                : t.type === "error"
                ? "border-rose-500/25"
                : "border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {t.type === "success" ? (
                  <FiCheckCircle className="text-emerald-600 dark:text-emerald-300" />
                ) : t.type === "error" ? (
                  <FiAlertTriangle className="text-rose-600 dark:text-rose-300" />
                ) : (
                  <FiInfo className="text-sky-700 dark:text-sky-200" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {t.title && <div className="text-sm font-bold text-foreground">{t.title}</div>}
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{t.message}</div>
              </div>

              <button
                onClick={() => onRemove(t.id)}
                className="text-muted-foreground hover:text-foreground transition"
                aria-label="إغلاق"
              >
                <FiX />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * =========================================================
 * Small UI primitives
 * =========================================================
 */
const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-card rounded-2xl shadow-lg border border-border ${className}`}>{children}</div>
);

const PrimaryBtn = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm ${
      props.className || ""
    }`}
  />
);

const SubtleBtn = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-colors text-sm ${
      props.className || ""
    }`}
  />
);

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 rounded-xl bg-background text-foreground placeholder-muted-foreground border border-border
      focus:border-primary focus:ring-4 focus:ring-primary/20 text-sm outline-none transition ${props.className || ""}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-2.5 rounded-xl bg-background text-foreground border border-border
      focus:border-primary focus:ring-4 focus:ring-primary/20 text-sm outline-none transition ${props.className || ""}`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-2.5 rounded-xl bg-background text-foreground placeholder-muted-foreground border border-border
      focus:border-primary focus:ring-4 focus:ring-primary/20 text-sm outline-none transition resize-none ${props.className || ""}`}
    />
  );
}

/**
 * =========================================================
 * ModalShell
 * =========================================================
 */
function ModalShell({
  open,
  onClose,
  title,
  children,
  size = "max-w-3xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: string;
}) {
  useLockBodyScroll(open);
  useEscapeToClose(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <div className="min-h-full px-4 py-10 flex items-start justify-center">
            <motion.div
              className={`w-full ${size}`}
              initial={{ scale: 0.98, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onMouseDown={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <Panel className="overflow-hidden">
                <div className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between">
                  <h2 className="text-lg md:text-xl font-bold text-foreground">{title}</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                    aria-label="إغلاق"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-5 py-5">
                  {children}
                </div>
              </Panel>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/30 p-3 rounded-xl border border-border">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground text-sm">{value || "—"}</p>
    </div>
  );
}

/**
 * =========================================================
 * View Modal (✅ AI section أصبح نصوص واضحة)
 * =========================================================
 */
function ViewCarModal({ open, onClose, car }: { open: boolean; onClose: () => void; car: CarFromApi | null }) {
  const rs = car?.review_status ?? car?.analysis_status ?? null;
  const rr = car?.review_reason ?? car?.analysis_reason ?? null;
  const st = reviewLabel(rs);

  return (
    <ModalShell open={open} onClose={onClose} title="تفاصيل السيارة">
      {!car ? (
        <div className="text-muted-foreground text-sm">جاري التحميل...</div>
      ) : (
        <div className="space-y-5 text-foreground">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Info label="الماركة" value={car.make} />
            <Info label="الموديل" value={car.model} />
            <Info label="سنة الصنع" value={String(car.year)} />
            <Info label="VIN" value={car.vin} />
            <Info label="الممشى (كم)" value={String(car.odometer ?? "")} />
            <Info label="الحالة الفنية" value={mapConditionLabel(car.condition)} />
            <Info label="حالة المزاد" value={mapAuctionStatusToArabic(car.auction_status)} />
            <Info label="القير" value={mapTransmissionLabel(car.transmission ?? "")} />
            <Info label="المحرك" value={car.engine ?? ""} />
            <Info label="السعر التقييمي" value={`${car.evaluation_price ?? "0"} ر.س`} />
            <Info label="اللون" value={car.color ?? ""} />
            <Info label="اللوحة" value={car.plate ?? ""} />
            <Info label="المنطقة" value={car.province ?? ""} />
            <Info label="المدينة" value={car.city ?? ""} />
            <Info label="فئة السوق" value={mapMarketCategoryLabel(car.market_category ?? "")} />
          </div>

          {/* ✅ حالة الفحص (Readable) */}
          <div className="rounded-2xl border border-border bg-muted/15 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-foreground">حالة فحص الذكاء الاصطناعي</div>
              <span className={`text-xs px-2.5 py-1 rounded-full border ${badgeClass(st.tone)}`}>{st.text}</span>
            </div>

            <AiReadableBlock raw={rr} />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">الوصف</p>
            <div className="bg-secondary/40 rounded-xl p-4 whitespace-pre-wrap text-foreground text-sm border border-border">
              {car.description || "—"}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">الصور</p>
            {Array.isArray(car.images) && car.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {car.images.map((src, i) => (
                  <img
                    key={`img-${i}-${src}`}
                    src={src}
                    alt={`image-${i}`}
                    className="w-full h-28 object-cover rounded-xl border border-border"
                    loading="lazy"
                  />
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">لا توجد صور</div>
            )}
          </div>
        </div>
      )}
    </ModalShell>
  );
}

/**
 * =========================================================
 * Edit modal
 * =========================================================
 */
type EditFormState = {
  make: string;
  model: string;
  year: string;
  odometer: string;
  evaluation_price: string;
  color: string;
  engine: string;
  transmission: string;
  description: string;
  province: string;
  city: string;
  plate: string;
  min_price: string;
  max_price: string;
  condition: string;
  market_category: string;
};

const transmissionOptions = [
  { value: "automatic", label: "أوتوماتيك" },
  { value: "manual", label: "عادي" },
  { value: "cvt", label: "CVT" },
];

const conditionOptions = [
  { value: "excellent", label: "ممتازة" },
  { value: "good", label: "جيدة" },
  { value: "fair", label: "متوسطة" },
  { value: "poor", label: "ضعيفة" },
];

const marketCategoryOptions = [
  { value: "luxurycars", label: "سوق السيارات الفارهة" },
  { value: "classic", label: "سوق السيارات الكلاسيكية" },
  { value: "caravan", label: "سوق الكرافانات" },
  { value: "busestrucks", label: "سوق الشاحنات والحافلات" },
  { value: "companiescars", label: "سوق سيارات الشركات" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function EditCarModal({
  open,
  onClose,
  car,
  onSaved,
  toast,
}: {
  open: boolean;
  onClose: () => void;
  car: CarFromApi | null;
  onSaved: (updated: CarFromApi) => void;
  toast: (t: Omit<Toast, "id">) => void;
}) {
  const [form, setForm] = useState<EditFormState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && car) {
      setForm({
        make: car.make || "",
        model: car.model || "",
        year: String(car.year || ""),
        odometer: String(car.odometer ?? ""),
        evaluation_price: car.evaluation_price ?? "",
        color: car.color ?? "",
        engine: car.engine ?? "",
        transmission: (car.transmission || "").toLowerCase(),
        description: car.description ?? "",
        province: car.province ?? "",
        city: car.city ?? "",
        plate: car.plate ?? "",
        min_price: car.min_price ?? "",
        max_price: car.max_price ?? "",
        condition: (car.condition || "").toLowerCase(),
        market_category: (car.market_category || "").toLowerCase(),
      });
    }
  }, [open, car]);

  const updateField = (name: keyof EditFormState, value: string) => {
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const submit = async () => {
    if (!car || !form) return;
    setSaving(true);

    try {
      const payload: any = {};
      (
        [
          "make",
          "model",
          "year",
          "odometer",
          "evaluation_price",
          "color",
          "engine",
          "transmission",
          "description",
          "province",
          "city",
          "plate",
          "min_price",
          "max_price",
          "condition",
          "market_category",
        ] as (keyof EditFormState)[]
      ).forEach((k) => {
        const v = form[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          if (["year", "odometer"].includes(k)) payload[k] = Number(v);
          else if (["evaluation_price", "min_price", "max_price"].includes(k)) payload[k] = toNumberSafe(v);
          else payload[k] = v;
        }
      });

      const res = await apiFetch(`cars/${car.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({}));
      const updated = (j.data || j) as CarFromApi;

      onSaved(updated);
      toast({ type: "success", title: "تم الحفظ", message: "تم تحديث بيانات السيارة بنجاح." });
      onClose();
    } catch (e: any) {
      toast({ type: "error", title: "تعذر الحفظ", message: e?.message || "حدث خطأ غير متوقع." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} title="تعديل السيارة">
      {!form ? (
        <div className="text-muted-foreground text-sm">جارى التحميل...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="الماركة">
              <Input value={form.make} onChange={(e) => updateField("make", e.target.value)} />
            </Field>
            <Field label="الموديل">
              <Input value={form.model} onChange={(e) => updateField("model", e.target.value)} />
            </Field>
            <Field label="سنة الصنع">
              <Input type="number" value={form.year} onChange={(e) => updateField("year", e.target.value)} />
            </Field>
            <Field label="الممشى (كم)">
              <Input type="number" value={form.odometer} onChange={(e) => updateField("odometer", e.target.value)} />
            </Field>
            <Field label="السعر التقييمي (ر.س)">
              <Input value={form.evaluation_price} onChange={(e) => updateField("evaluation_price", e.target.value)} />
            </Field>
            <Field label="اللون">
              <Input value={form.color} onChange={(e) => updateField("color", e.target.value)} />
            </Field>
            <Field label="المحرك">
              <Input value={form.engine} onChange={(e) => updateField("engine", e.target.value)} />
            </Field>

            <Field label="القير">
              <Select value={form.transmission} onChange={(e) => updateField("transmission", e.target.value)}>
                <option value="">اختر</option>
                {transmissionOptions.map((o) => (
                  <option key={`tr-${o.value}`} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="الحالة الفنية">
              <Select value={form.condition} onChange={(e) => updateField("condition", e.target.value)}>
                <option value="">اختر</option>
                {conditionOptions.map((o) => (
                  <option key={`cond-${o.value}`} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="فئة السوق">
              <Select value={form.market_category} onChange={(e) => updateField("market_category", e.target.value)}>
                <option value="">اختر</option>
                {marketCategoryOptions.map((o) => (
                  <option key={`mc-${o.value}`} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="المنطقة">
              <Input value={form.province} onChange={(e) => updateField("province", e.target.value)} />
            </Field>
            <Field label="المدينة">
              <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} />
            </Field>
            <Field label="رقم اللوحة">
              <Input value={form.plate} onChange={(e) => updateField("plate", e.target.value)} />
            </Field>

            <Field label="أقل سعر (ر.س)">
              <Input value={form.min_price} onChange={(e) => updateField("min_price", e.target.value)} />
            </Field>
            <Field label="أعلى سعر (ر.س)">
              <Input value={form.max_price} onChange={(e) => updateField("max_price", e.target.value)} />
            </Field>

            <div className="md:col-span-2">
              <Field label="الوصف">
                <Textarea className="h-28" value={form.description} onChange={(e) => updateField("description", e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <SubtleBtn onClick={onClose}>إلغاء</SubtleBtn>
            <PrimaryBtn onClick={submit} disabled={saving}>
              {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </PrimaryBtn>
          </div>
        </>
      )}
    </ModalShell>
  );
}

/**
 * =========================================================
 * Delete confirm
 * =========================================================
 */
function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <ModalShell open={open} onClose={onClose} title="حذف السيارة" size="max-w-lg">
      <p className="text-muted-foreground text-sm leading-relaxed">
        هل أنت متأكد من حذف هذه السيارة؟ هذا الإجراء لا يمكن التراجع عنه.
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <SubtleBtn onClick={onClose}>إلغاء</SubtleBtn>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? "جارٍ الحذف..." : "تأكيد الحذف"}
        </button>
      </div>
    </ModalShell>
  );
}

/**
 * =========================================================
 * Filters
 * =========================================================
 */
const auctionStatuses = ["معلن", "محجوز", "مباع", "ملغي"] as const;
const reviewStatuses = [
  { value: "", label: "الكل" },
  { value: "processing", label: "جارٍ الفحص" },
  { value: "under_review", label: "تحت المراجعة" },
  { value: "approved", label: "مقبولة" },
  { value: "rejected", label: "مرفوضة" },
  { value: "failed", label: "فشل الفحص" },
];

type Filters = {
  status: string;
  reviewStatus: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  yearFrom: string;
  yearTo: string;
};

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs border border-primary/20">
      {label}
      <button onClick={onClear} className="hover:text-primary/80" aria-label="إزالة">
        <FiX size={14} />
      </button>
    </span>
  );
}

function FilterPanel({
  open,
  onClose,
  filters,
  setFilters,
  brands,
  onApply,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  brands: string[];
  onApply: () => void;
  onReset: () => void;
}) {
  useLockBodyScroll(open);

  const activeChips = useMemo(() => {
    const chips: { key: keyof Filters; label: string }[] = [];
    if (filters.status) chips.push({ key: "status", label: `حالة المزاد: ${filters.status}` });
    if (filters.reviewStatus) {
      const r = reviewStatuses.find((x) => x.value === filters.reviewStatus)?.label || filters.reviewStatus;
      chips.push({ key: "reviewStatus", label: `حالة الفحص: ${r}` });
    }
    if (filters.brand) chips.push({ key: "brand", label: `العلامة: ${filters.brand}` });
    if (filters.minPrice) chips.push({ key: "minPrice", label: `≥ ${Number(filters.minPrice).toLocaleString()} ر.س` });
    if (filters.maxPrice) chips.push({ key: "maxPrice", label: `≤ ${Number(filters.maxPrice).toLocaleString()} ر.س` });
    if (filters.yearFrom) chips.push({ key: "yearFrom", label: `من سنة ${filters.yearFrom}` });
    if (filters.yearTo) chips.push({ key: "yearTo", label: `إلى سنة ${filters.yearTo}` });
    return chips;
  }, [filters]);

  const handle = (name: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const body = (
    <>
      {activeChips.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {activeChips.map((c, i) => (
            <FilterChip key={`chip-${c.key}-${i}`} label={c.label} onClear={() => handle(c.key, "")} />
          ))}
          <button onClick={onReset} className="text-xs text-muted-foreground hover:text-foreground underline decoration-dotted">
            مسح الكل
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div>
          <p className="block text-xs text-muted-foreground mb-2">حالة المزاد</p>
          <div className="flex flex-wrap gap-2">
            {(["", ...auctionStatuses] as string[]).map((s) => {
              const selected = filters.status === s || (s === "" && !filters.status);
              return (
                <button
                  key={`status-${s || "all"}`}
                  onClick={() => handle("status", s)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                  }`}
                >
                  {s || "الكل"}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-2">حالة الفحص (AI)</label>
          <Select value={filters.reviewStatus} onChange={(e) => handle("reviewStatus", e.target.value)}>
            {reviewStatuses.map((r) => (
              <option key={`rs-${r.value || "all"}`} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-2">العلامة التجارية</label>
          <Select value={filters.brand} onChange={(e) => handle("brand", e.target.value)}>
            <option value="">الكل</option>
            {brands.map((b) => (
              <option key={`brand-${b}`} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-2">السعر من</label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground pointer-events-none">
              <FiDollarSign />
            </span>
            <Input
              type="number"
              className="pr-10"
              placeholder="أدنى سعر"
              value={filters.minPrice}
              onChange={(e) => handle("minPrice", e.target.value)}
              min={0}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-2">السعر إلى</label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground pointer-events-none">
              <FiDollarSign />
            </span>
            <Input
              type="number"
              className="pr-10"
              placeholder="أعلى سعر"
              value={filters.maxPrice}
              onChange={(e) => handle("maxPrice", e.target.value)}
              min={0}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-2">سنة الصنع من</label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground pointer-events-none">
              <FiCalendar />
            </span>
            <Input type="number" className="pr-10" placeholder="أقدم سنة" value={filters.yearFrom} onChange={(e) => handle("yearFrom", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-2">سنة الصنع إلى</label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground pointer-events-none">
              <FiCalendar />
            </span>
            <Input type="number" className="pr-10" placeholder="أحدث سنة" value={filters.yearTo} onChange={(e) => handle("yearTo", e.target.value)} />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <motion.div
              className="absolute inset-y-0 right-0 w-full max-w-md p-3"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Panel className="h-full overflow-hidden rounded-2xl">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">الفلاتر</h3>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto max-h-[calc(100vh-10rem)]">{body}</div>

                <div className="px-5 py-4 border-t border-border bg-card/90 backdrop-blur sticky bottom-0">
                  <div className="flex gap-3">
                    <SubtleBtn onClick={onReset} className="flex-1">
                      إعادة تعيين
                    </SubtleBtn>
                    <PrimaryBtn onClick={onApply} className="flex-1">
                      تطبيق
                    </PrimaryBtn>
                  </div>
                </div>
              </Panel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Card */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Panel className="p-5 mb-6 hidden md:block">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-foreground">الفلاتر المتقدمة</h3>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                    aria-label="إغلاق الفلاتر"
                  >
                    <FiX />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {activeChips.slice(0, 4).map((c, i) => (
                    <FilterChip key={`chip-head-${c.key}-${i}`} label={c.label} onClear={() => handle(c.key, "")} />
                  ))}
                  {activeChips.length > 4 && <span className="text-xs text-muted-foreground">+{activeChips.length - 4}</span>}
                </div>
              </div>

              {body}

              <div className="mt-5 flex justify-end gap-3">
                <SubtleBtn onClick={onReset}>إعادة تعيين</SubtleBtn>
                <PrimaryBtn onClick={onApply}>تطبيق الفلاتر</PrimaryBtn>
              </div>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * =========================================================
 * Main Page
 * =========================================================
 */
export default function ExhibitorCars() {
  const router = useRouter();

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimers = useRef<Record<string, any>>({});

  const pushToast = (t: Omit<Toast, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const item: Toast = { id, ...t };
    setToasts((prev) => [item, ...prev].slice(0, 5));
    toastTimers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
      delete toastTimers.current[id];
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
    if (toastTimers.current[id]) {
      clearTimeout(toastTimers.current[id]);
      delete toastTimers.current[id];
    }
  };

  useEffect(() => {
    return () => {
      Object.values(toastTimers.current).forEach((t) => clearTimeout(t));
      toastTimers.current = {};
    };
  }, []);

  const [carsRaw, setCarsRaw] = useState<CarFromApi[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [sortKey, setSortKey] = useState<"latest" | "oldest" | "price_desc" | "price_asc">("latest");

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    status: "",
    reviewStatus: "",
    brand: "",
    minPrice: "",
    maxPrice: "",
    yearFrom: "",
    yearTo: "",
  });

  const [applied, setApplied] = useState<{ q: string; f: Filters }>({
    q: "",
    f: { status: "", reviewStatus: "", brand: "", minPrice: "", maxPrice: "", yearFrom: "", yearTo: "" },
  });

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedCarData, setSelectedCarData] = useState<CarFromApi | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const carsUi: UiCar[] = useMemo(() => {
    return (carsRaw || []).map((c) => {
      const reviewStatus = (c.review_status ?? c.analysis_status ?? null) as string | null;
      const reviewReason = c.review_reason ?? c.analysis_reason ?? null;

      return {
        id: c.id,
        title: `${c.make ?? ""} ${c.model ?? ""}`.trim(),
        brand: c.make ?? "",
        model: c.model ?? "",
        year: c.year ?? 0,
        price: toNumberSafe(c.evaluation_price),
        mileage: c.odometer ?? 0,
        transmissionLabel: mapTransmissionLabel(c.transmission ?? ""),
        auctionStatusAr: mapAuctionStatusToArabic(c.auction_status),
        auctionStatusRaw: c.auction_status ?? "",
        reviewStatusRaw: reviewStatus,
        reviewReason,
        addedDate: c.created_at?.slice(0, 10) ?? "",
        views: 0,
        inquiries: 0,
      };
    });
  }, [carsRaw]);

  const brands = useMemo(() => Array.from(new Set(carsUi.map((c) => c.brand).filter(Boolean))).sort(), [carsUi]);

  const activeFilterCount = useMemo(() => {
    const countFilters = Object.values(filters).filter(Boolean).length;
    const countSearch = searchTerm.trim() ? 1 : 0;
    return countFilters + countSearch;
  }, [filters, searchTerm]);

  const applyNow = () => {
    setApplied({ q: searchTerm.trim(), f: { ...filters } });
    setCurrentPage(1);
  };

  const resetFilters = () => {
    const empty: Filters = { status: "", reviewStatus: "", brand: "", minPrice: "", maxPrice: "", yearFrom: "", yearTo: "" };
    setFilters(empty);
    setSearchTerm("");
    setApplied({ q: "", f: empty });
    setCurrentPage(1);
  };

  const goToAddCar = () => router.push("/exhibitor/add-car");

  const fetchCars = async (page: number, q: { q: string; f: Filters }) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(page));

      if (sortKey === "latest") {
        params.set("sort_by", "created_at");
        params.set("sort_dir", "desc");
      } else if (sortKey === "oldest") {
        params.set("sort_by", "created_at");
        params.set("sort_dir", "asc");
      } else if (sortKey === "price_desc") {
        params.set("sort_by", "evaluation_price");
        params.set("sort_dir", "desc");
      } else if (sortKey === "price_asc") {
        params.set("sort_by", "evaluation_price");
        params.set("sort_dir", "asc");
      }

      if (q.q) params.set("q", q.q);
      if (q.f.brand) params.set("make", q.f.brand);

      if (q.f.status) {
        const backendStatus =
          q.f.status === "معلن"
            ? "available"
            : q.f.status === "محجوز"
            ? "scheduled"
            : q.f.status === "مباع"
            ? "sold"
            : q.f.status === "ملغي"
            ? "cancelled"
            : "";
        if (backendStatus) params.set("auction_status", backendStatus);
      }

      if (q.f.reviewStatus) params.set("review_status", q.f.reviewStatus);
      if (q.f.minPrice) params.set("min_price", q.f.minPrice);
      if (q.f.maxPrice) params.set("max_price", q.f.maxPrice);
      if (q.f.yearFrom) params.set("year_from", q.f.yearFrom);
      if (q.f.yearTo) params.set("year_to", q.f.yearTo);

      const res = await fetch(buildApiUrl(`cars?${params.toString()}`), {
        cache: "no-store",
        signal: ac.signal,
        headers: {
          Accept: "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
      });

      if (res.status === 401) {
        pushToast({ type: "error", title: "غير مصرح", message: "جلسة الدخول انتهت. سيتم تحويلك لتسجيل الدخول." });
        router.push("/auth/login");
        return;
      }

      if (!res.ok) {
        const data = await readJsonSafe(res);
        throw new Error(friendlyApiError(data, "تعذر جلب السيارات الآن."));
      }

      const json: CarsApiResponse = await res.json();

      setCarsRaw(json?.data?.data || []);
      setCurrentPage(json?.data?.current_page || 1);
      setLastPage(json?.data?.last_page || 1);
      setTotal(json?.data?.total || 0);
      setPerPage(json?.data?.per_page || 10);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      pushToast({ type: "error", title: "تعذر جلب البيانات", message: err?.message || "حدث خطأ غير متوقع." });
      setCarsRaw([]);
      setCurrentPage(1);
      setLastPage(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const appliedKey = useMemo(() => JSON.stringify({ sortKey, currentPage, applied }), [sortKey, currentPage, applied]);

  useEffect(() => {
    fetchCars(currentPage, applied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedKey]);

  const visibleCars = useMemo(() => {
    let results = [...carsUi];
    const term = searchTerm.trim().toLowerCase();

    if (term) {
      results = results.filter(
        (c) =>
          c.title.toLowerCase().includes(term) ||
          c.brand.toLowerCase().includes(term) ||
          c.model.toLowerCase().includes(term) ||
          String(c.year).includes(term)
      );
    }

    if (filters.yearFrom) results = results.filter((c) => c.year >= Number(filters.yearFrom));
    if (filters.yearTo) results = results.filter((c) => c.year <= Number(filters.yearTo));
    if (filters.minPrice) results = results.filter((c) => c.price >= Number(filters.minPrice));
    if (filters.maxPrice) results = results.filter((c) => c.price <= Number(filters.maxPrice));
    if (filters.status) results = results.filter((c) => c.auctionStatusAr === filters.status);
    if (filters.reviewStatus) results = results.filter((c) => (c.reviewStatusRaw || "") === filters.reviewStatus);
    if (filters.brand) results = results.filter((c) => c.brand === filters.brand);

    return results;
  }, [carsUi, filters, searchTerm]);

  const openView = async (id: number) => {
    setSelectedId(id);
    setViewOpen(true);
    setSelectedCarData(null);

    try {
      const res = await apiFetch(`cars/${id}`);
      const j: ShowCarApiResponse = await res.json();
      setSelectedCarData(j.data.car);
    } catch (e: any) {
      pushToast({ type: "error", title: "تعذر العرض", message: e?.message || "تعذر تحميل تفاصيل السيارة." });
    }
  };

  const openEdit = async (id: number) => {
    setSelectedId(id);
    setEditOpen(true);
    setSelectedCarData(null);

    try {
      const res = await apiFetch(`cars/${id}`);
      const j: ShowCarApiResponse = await res.json();
      setSelectedCarData(j.data.car);
    } catch (e: any) {
      pushToast({ type: "error", title: "تعذر التعديل", message: e?.message || "تعذر تحميل بيانات التعديل." });
    }
  };

  const openDelete = (id: number) => {
    setSelectedId(id);
    setDeleteOpen(true);
  };

  const handleSaved = (updated: CarFromApi) => {
    setCarsRaw((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    setActionLoading(true);

    try {
      await apiFetch(`cars/${selectedId}`, { method: "DELETE" });
      setCarsRaw((prev) => prev.filter((c) => c.id !== selectedId));
      setDeleteOpen(false);
      pushToast({ type: "success", title: "تم الحذف", message: "تم حذف السيارة بنجاح." });
    } catch (e: any) {
      pushToast({ type: "error", title: "تعذر الحذف", message: e?.message || "حدث خطأ أثناء الحذف." });
    } finally {
      setActionLoading(false);
    }
  };

  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  return (
    <div dir="rtl" className="bg-background py-7 px-4 sm:px-6 lg:px-8">
      <ToastStack toasts={toasts} onRemove={removeToast} />

      <ViewCarModal open={viewOpen} onClose={() => setViewOpen(false)} car={selectedCarData} />
      <EditCarModal open={editOpen} onClose={() => setEditOpen(false)} car={selectedCarData} onSaved={handleSaved} toast={pushToast} />
      <DeleteConfirmModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} loading={actionLoading} />

      <div className="max-w-7xl mx-auto">
        <div className="mb-7">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="text-2xl font-bold text-foreground mb-1 leading-tight"
              >
                سيارات المعرض
              </motion.h1>
              <p className="text-muted-foreground text-sm">إدارة السيارات المضافة إلى معرضك</p>
            </div>

            <PrimaryBtn onClick={goToAddCar} aria-label="إضافة سيارة جديدة" className="inline-flex items-center gap-2">
              <FiPlus className="ml-1" size={16} />
              <span>إضافة سيارة جديدة</span>
            </PrimaryBtn>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <motion.div className="relative flex-grow" whileHover={{ scale: 1.003 }}>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FiSearch className="text-muted-foreground" />
              </div>
              <Input
                placeholder="ابحث عن سيارة (ماركة أو موديل أو سنة)"
                className="pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyNow();
                }}
              />
            </motion.div>

            <SubtleBtn onClick={() => fetchCars(currentPage, applied)}>تحديث</SubtleBtn>

            <button
              onClick={() => setShowFilters((v) => !v)}
              className="relative inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-colors text-sm"
            >
              <FiFilter className="ml-2" />
              <span>الفلاتر</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground text-[11px] rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <FilterPanel
          open={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          setFilters={setFilters}
          brands={brands}
          onApply={() => {
            setShowFilters(false);
            applyNow();
          }}
          onReset={() => {
            setShowFilters(false);
            resetFilters();
          }}
        />

        <div className="mb-5 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div className="text-muted-foreground text-sm">
            <span className="font-medium text-foreground tabular-nums">{total}</span> إجمالي السيارات
            {total > 0 && (
              <span className="mr-2">
                (عرض <span className="font-medium text-foreground tabular-nums">{from}</span> -{" "}
                <span className="font-medium text-foreground tabular-nums">{to}</span>)
              </span>
            )}
          </div>

          <div className="flex items-center">
            <span className="text-muted-foreground ml-2 text-sm">ترتيب حسب:</span>
            <Select
              className="w-auto"
              value={sortKey}
              onChange={(e) => {
                setSortKey(e.target.value as any);
                setCurrentPage(1);
              }}
            >
              <option value="latest">الأحدث إضافة</option>
              <option value="oldest">الأقدم إضافة</option>
              <option value="price_desc">الأعلى سعراً</option>
              <option value="price_asc">الأقل سعراً</option>
            </Select>
          </div>
        </div>

        {loading && <SkeletonTable />}

        {!loading && visibleCars.length === 0 && (
          <Panel className="p-10 text-center">
            <div className="text-muted-foreground mb-3">
              <FiSearch size={40} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">لا توجد سيارات متطابقة</h3>
            <p className="text-muted-foreground text-sm mb-5">عدّل الفلاتر أو أعد البحث.</p>
            <PrimaryBtn
              onClick={() => {
                resetFilters();
                pushToast({ type: "info", title: "تمت إعادة التعيين", message: "تم عرض جميع السيارات." });
              }}
            >
              عرض جميع السيارات
            </PrimaryBtn>
          </Panel>
        )}

        {!loading && visibleCars.length > 0 && (
          <Panel className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <Th>السيارة</Th>
                    <Th>السعر</Th>
                    <Th>الحالات</Th>
                    <Th>المشاهدات</Th>
                    <Th>الاستفسارات</Th>
                    <Th>الإجراءات</Th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {visibleCars.map((car, index) => {
                    const ai = reviewLabel(car.reviewStatusRaw);
                    return (
                      <motion.tr
                        key={`car-${car.id}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.02, 0.2) }}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                              <FaCar className="text-primary" size={16} />
                            </div>
                            <div className="mr-4">
                              <div className="text-sm font-semibold text-foreground">{car.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {car.year} • {Number.isFinite(car.mileage) ? car.mileage.toLocaleString() : 0} كم
                                {car.transmissionLabel ? ` • ${car.transmissionLabel}` : ""}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="text-sm font-bold text-primary tabular-nums">
                            {Number.isFinite(car.price) ? car.price.toLocaleString() : 0} ر.س
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${auctionBadgeClass(car.auctionStatusAr)}`}>
                              {car.auctionStatusAr}
                            </span>
                            <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${badgeClass(ai.tone)}`}>
                              {ai.text}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-sm text-muted-foreground tabular-nums">
                          <div className="flex items-center gap-1">
                            <FiEye className="text-muted-foreground" />
                            {(car.views ?? 0).toLocaleString()}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-sm text-muted-foreground tabular-nums">
                          {(car.inquiries ?? 0).toLocaleString()}
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openView(car.id)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/40 transition"
                              title="عرض"
                            >
                              <FiEye size={18} />
                            </button>
                            <button
                              onClick={() => openEdit(car.id)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/40 transition"
                              title="تعديل"
                            >
                              <FiEdit size={18} />
                            </button>
                            <button
                              onClick={() => openDelete(car.id)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted/40 transition"
                              title="حذف"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {lastPage > 1 && (
              <div className="py-4 px-5 border-t border-border flex items-center justify-between bg-muted/20">
                <button
                  onClick={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <FiChevronRight />
                </button>

                <span className="text-sm text-muted-foreground">
                  صفحة <span className="font-bold text-foreground">{currentPage}</span> من {lastPage}
                </span>

                <button
                  onClick={() => currentPage < lastPage && setCurrentPage((p) => p + 1)}
                  disabled={currentPage === lastPage}
                  className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <FiChevronLeft />
                </button>
              </div>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <Panel className="p-5">
      <div className="animate-pulse space-y-3">
        <div className="h-10 bg-muted/50 rounded-xl" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 bg-muted/40 rounded-xl" />
        ))}
      </div>
    </Panel>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">{children}</th>
);
