"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  FiUpload,
  FiInfo,
  FiCheckCircle,
  FiX,
  FiChevronDown,
  FiTrendingUp,
  FiRefreshCw,
  FiCalendar,
  FiMapPin,
  FiHash,
  FiTag,
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowRight,
} from "react-icons/fi";
import { FaTachometerAlt, FaCarSide, FaRobot } from "react-icons/fa";
import { GiGearStick } from "react-icons/gi";
import { SaudiRiyal } from "lucide-react";
import { useRouter } from "next/navigation";

/** ================= أنواع الحقول ================= **/
type Condition = "excellent" | "good" | "fair" | "poor";
type Transmission = "automatic" | "manual" | "cvt";

// ✅ ممنوع government في الإضافة (الباك اند حاجبه)
type MarketCategory =
  | "luxuryCars"
  | "classic"
  | "caravan"
  | "busesTrucks"
  | "companiesCars";

/** ========= API Base (الأفضل تعتمد NEXT_PUBLIC_API_URL بدل origin) ========= */
const rawBase = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
const API_ROOT =
  rawBase || (typeof window !== "undefined" ? `${window.location.origin}` : "");

/**
 * ✅ نحاول أكتر من endpoint للـ AI لو السيرفر مغير المسار
 * أول واحد يدي 200 هنستخدمه.
 */
const AI_SIMILAR_ENDPOINTS = [
  `${API_ROOT}/api/cars/similar`,
  `${API_ROOT}/api/cars/similar-cars`,
  `${API_ROOT}/api/v1/cars/similar`,
  `${API_ROOT}/api/v1/cars/similar-cars`,
];

// ✅ جلب الحالة: نجرب /status أولاً (لو الباك اند داعمه) ثم GET car العادي
const CAR_STATUS_ENDPOINTS = [
  `${API_ROOT}/api/cars/`, // + {id}/status
  `${API_ROOT}/api/v1/cars/`, // + {id}/status
];

const CAR_GET_ENDPOINTS = [
  `${API_ROOT}/api/cars/`, // + {id}
  `${API_ROOT}/api/v1/cars/`, // + {id}
];

/** ========= Limits (حماية UX + منع إدخال قيم مبالغ فيها) ========= */
const LIMITS = {
  IMAGES_MAX: 10,
  IMAGE_MAX_MB: 5,
  REG_MAX_MB: 10,

  YEAR_MIN: 1900,
  YEAR_MAX: new Date().getFullYear() + 1,

  ODOMETER_MIN: 0,
  ODOMETER_MAX: 2_000_000,

  PRICE_MIN: 0,
  PRICE_MAX: 100_000_000,

  TEXT_MAX: 120,
  DESC_MAX: 2000,
  PLATE_MAX: 24,
};

async function fetchSimilarCars(
  qs: URLSearchParams,
  headers: Record<string, string>,
  signal: AbortSignal
) {
  for (const base of AI_SIMILAR_ENDPOINTS) {
    try {
      const res = await fetch(`${base}?${qs.toString()}`, { headers, signal });
      if (res.ok) return await res.json();
      if (res.status === 404) continue;
      throw new Error("تعذّر جلب التحليل الذكي الآن. حاول مرة أخرى لاحقًا.");
    } catch (e: any) {
      if (e?.name === "AbortError") throw e;
      continue;
    }
  }
  throw new Error("تعذّر الوصول لخدمة التحليل الذكي الآن. حاول لاحقًا.");
}

async function fetchCarStatusById(
  id: number,
  headers: Record<string, string>,
  signal: AbortSignal
) {
  // 1) Try /status
  for (const base of CAR_STATUS_ENDPOINTS) {
    try {
      const res = await fetch(`${base}${id}/status`, { headers, signal });
      if (res.ok) return await res.json().catch(() => ({}));
      if (res.status === 404) continue;
      break;
    } catch (e: any) {
      if (e?.name === "AbortError") throw e;
      continue;
    }
  }

  // 2) fallback: GET car
  for (const base of CAR_GET_ENDPOINTS) {
    try {
      const res = await fetch(`${base}${id}`, { headers, signal });
      if (res.ok) {
        const js = await res.json().catch(() => ({}));
        return js?.car ?? js?.data ?? js?.result ?? js;
      }
      if (res.status === 404) continue;
      throw new Error("تعذّر تحديث حالة الفحص الآن.");
    } catch (e: any) {
      if (e?.name === "AbortError") throw e;
      continue;
    }
  }

  throw new Error("تعذّر تحديث حالة الفحص الآن.");
}

/** ========= Helpers ========= */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  return raw.replace(/^"(.+)"$/, "$1");
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function onlyDigits(raw: string) {
  return (raw || "").replace(/[^\d]/g, "");
}
function safeText(raw: string, maxLen: number) {
  const v = (raw ?? "").toString().replace(/\s+/g, " ").trim();
  return v.slice(0, maxLen);
}
function safeVin(raw: string) {
  const v = (raw ?? "")
    .toString()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
  return v.slice(0, 17);
}
function normalizeNumberField(raw: string, { min, max }: { min: number; max: number }) {
  const d = onlyDigits(raw);
  if (!d) return "";
  const n = Number(d);
  if (Number.isNaN(n)) return "";
  return String(clamp(n, min, max));
}
function formatBytes(bytes: number) {
  if (!bytes) return "0B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)}${sizes[i]}`;
}
function isProbablyTechnical(msg: string) {
  const m = (msg || "").toLowerCase();
  return (
    m.includes("stacktrace") ||
    m.includes("sqlstate") ||
    m.includes("exception") ||
    m.includes("traceback") ||
    m.includes("undefined") ||
    m.includes("http request returned status code") ||
    m.includes("internal server error")
  );
}
function friendlyApiError(data: any, fallback: string) {
  if (data?.errors && typeof data.errors === "object") {
    const key = Object.keys(data.errors)[0];
    const first = data.errors[key]?.[0];
    const fieldMap: Record<string, string> = {
      make: "الشركة المصنعة",
      model: "الموديل",
      year: "سنة الصنع",
      vin: "رقم الهيكل (VIN)",
      odometer: "عدد الكيلومترات",
      condition: "حالة السيارة",
      evaluation_price: "سعر السيارة",
      color: "اللون",
      engine: "المحرك",
      transmission: "ناقل الحركة",
      market_category: "فئة السوق",
      min_price: "الحد الأدنى",
      max_price: "الحد الأعلى",
      province: "المحافظة",
      city: "المدينة",
      plate: "رقم اللوحة",
      images: "صور السيارة",
      "images.0": "صور السيارة",
      registration_card_image: "استمارة السيارة",
    };
    const fieldName = fieldMap[key] || key;
    if (typeof first === "string" && first.trim()) return `تحقّق من حقل: ${fieldName}. ${first}`;
    return `تحقّق من حقل: ${fieldName}.`;
  }

  const msg = data?.message;
  if (typeof msg === "string" && msg.trim()) {
    if (isProbablyTechnical(msg)) return fallback;
    if (msg.toLowerCase().includes("unauth")) return "جلسة الدخول انتهت. رجاءً سجّل الدخول مرة أخرى.";
    return msg;
  }

  return fallback;
}

/** ========= Theme ========= */
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const CARD = "bg-card border border-border backdrop-blur";
const PANEL = "bg-secondary/30 border border-border";
const TXT = { main: "text-foreground", sub: "text-muted-foreground" };

/** ================== Toast (Popup) ================== **/
type ToastKind = "success" | "error" | "info";
type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
};

function toastClasses(kind: ToastKind) {
  if (kind === "success") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700";
  if (kind === "error") return "border-destructive/25 bg-destructive/10 text-destructive";
  return "border-primary/25 bg-primary/10 text-primary";
}

function ToastViewport({
  toasts,
  dismiss,
}: {
  toasts: ToastItem[];
  dismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-[92%] max-w-md space-y-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: EASE_OUT } }}
            exit={{ opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.14, ease: EASE_OUT } }}
            className={`rounded-2xl border px-4 py-3 shadow-lg backdrop-blur bg-card/70 ${toastClasses(t.kind)}`}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                {t.kind === "error" ? (
                  <FiAlertTriangle />
                ) : t.kind === "success" ? (
                  <FiCheckCircle />
                ) : (
                  <FiInfo />
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{t.title}</div>
                {t.message && <div className="text-sm opacity-90 mt-0.5 leading-relaxed">{t.message}</div>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
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

/** ================== النماذج ================== **/
interface FormData {
  make: string;
  model: string;
  year: string | number;
  vin: string;
  odometer: string | number;
  condition: Condition | "";
  evaluation_price: string | number;
  color: string;
  engine: string;
  transmission: Transmission | "";
  market_category: MarketCategory | "";
  description: string;
  min_price: string | number;
  max_price: string | number;
  province: string;
  city: string;
  plate: string;

  main_auction_duration: "" | "10" | "20" | "30";
}

interface PreviewImage {
  url: string;
  name: string;
  file?: File;
}

interface AiStats {
  min?: number;
  p25?: number;
  median?: number;
  p75?: number;
  max?: number;
}
interface AiSuggestion {
  id?: string | number;
  label?: string;
  evaluation_price?: number;
  odometer?: number;
  images?: string[];
  price_diff?: number;
}

/** ================== حقول موحّدة ================== **/
type BaseFieldProps = {
  name: keyof FormData | string;
  label: string;
  value?: any;
  onChange?: (e: React.ChangeEvent<any>) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  error?: boolean;
  hint?: string;
  required?: boolean;
};

function FieldRow({
  label,
  name,
  children,
  error,
  hint,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
  error?: boolean;
  hint?: string;
}) {
  return (
    <div className="w-full">
      <label
        htmlFor={name}
        className={`mb-1.5 block text-sm ${error ? "text-destructive" : TXT.sub}`}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className={`mt-1 text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}

function InputField({
  name,
  label,
  value,
  onChange,
  placeholder,
  icon,
  error,
  hint,
  required,
  ...props
}: BaseFieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldRow label={label} name={String(name)} error={error} hint={hint}>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={String(name)}
          name={String(name)}
          value={value as any}
          onChange={onChange}
          placeholder={placeholder || ""}
          aria-invalid={!!error}
          aria-required={!!required}
          className={`
            w-full rounded-xl bg-background ${TXT.main}
            border ${error ? "border-destructive" : "border-border"}
            focus:border-primary focus:ring-4 focus:ring-primary/20
            outline-none transition px-4 py-3
            ${icon ? "pl-10 pr-4" : "px-4"}
          `}
          {...props}
        />
      </div>
    </FieldRow>
  );
}

function SelectField({
  name,
  label,
  value,
  onChange,
  icon,
  error,
  hint,
  required,
  children,
}: BaseFieldProps & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldRow label={label} name={String(name)} error={error} hint={hint}>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <FiChevronDown />
        </span>
        <select
          id={String(name)}
          name={String(name)}
          value={value as any}
          onChange={onChange}
          aria-invalid={!!error}
          aria-required={!!required}
          className={`
            w-full appearance-none rounded-xl bg-background ${TXT.main}
            border ${error ? "border-destructive" : "border-border"}
            focus:border-primary focus:ring-4 focus:ring-primary/20
            outline-none transition py-3
            ${icon ? "pl-10 pr-10" : "px-10"}
          `}
        >
          {children}
        </select>
      </div>
    </FieldRow>
  );
}

function TextareaField({
  name,
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  required,
  rows = 4,
  ...props
}: BaseFieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldRow label={label} name={String(name)} error={error} hint={hint}>
      <textarea
        id={String(name)}
        name={String(name)}
        value={value as any}
        onChange={onChange}
        placeholder={placeholder || ""}
        aria-invalid={!!error}
        aria-required={!!required}
        rows={rows}
        className={`
          w-full rounded-xl bg-background ${TXT.main}
          border ${error ? "border-destructive" : "border-border"}
          focus:border-primary focus:ring-4 focus:ring-primary/20
          outline-none transition px-4 py-3
        `}
        {...props}
      />
    </FieldRow>
  );
}

/** ================== شريط النطاق السعري ================== **/
function PriceRangeBar({
  min,
  p25,
  median,
  p75,
  max,
  value,
}: {
  min?: number | null;
  p25?: number | null;
  median?: number | null;
  p75?: number | null;
  max?: number | null;
  value?: number;
}) {
  const ok = typeof min === "number" && typeof max === "number" && max! > min!;
  if (!ok) return null;

  const span = max! - min!;
  const toPct = (v?: number | null) =>
    typeof v === "number" ? clamp(((v - min!) / span) * 100, 0, 100) : undefined;

  const pMin = 0;
  const pP25 = toPct(p25);
  const pMedian = toPct(median);
  const pP75 = toPct(p75);
  const pMax = 100;
  const pVal = value != null ? toPct(value) : undefined;

  return (
    <div className="mt-3">
      <div className="relative h-3 rounded-full overflow-hidden bg-secondary">
        {pP25 != null && pP75 != null && (
          <div
            className="absolute top-0 h-full bg-primary/35"
            style={{ left: `${pP25}%`, width: `${pP75 - pP25}%` }}
          />
        )}
        <div className="absolute inset-0 opacity-40 bg-muted" />
        {[
          ["min", pMin],
          ["p25", pP25],
          ["median", pMedian],
          ["p75", pP75],
          ["max", pMax] as const,
        ].map(
          ([k, p]) =>
            p != null && (
              <div
                key={String(k)}
                className={`absolute -top-1 w-0.5 h-5 ${
                  k === "median" ? "bg-primary" : "bg-muted-foreground"
                }`}
                style={{ left: `${p}%` }}
              />
            )
        )}
        {pVal != null && (
          <div className="absolute -top-2" style={{ left: `calc(${pVal}% - 8px)` }}>
            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-transparent border-b-emerald-500" />
          </div>
        )}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>أدنى</span>
        <span>ربع أول</span>
        <span>وسيط</span>
        <span>ربع ثالث</span>
        <span>أعلى</span>
      </div>
    </div>
  );
}

/** ================== Overlay احترافي (بوت + سيارة) ================== **/
function AiOverlay({ open, stage }: { open: boolean; stage: 0 | 1 | 2 | 3 }) {
  const stages = [
    { title: "نجهّز البيانات", desc: "تجهيز الملفات والبيانات قبل الإرسال…" },
    { title: "نرفع الملفات بأمان", desc: "رفع صور السيارة والاستمارة…" },
    { title: "نحفظ بيانات السيارة", desc: "تسجيل السيارة في النظام…" },
    { title: "نبدأ الفحص الذكي", desc: "تشغيل الفحص على الصور والمستند…" },
  ];
  const s = stages[stage] || stages[0];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className={`w-full max-w-lg mx-4 rounded-2xl shadow-2xl ${CARD} overflow-hidden`}
          >
            <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
              <div>
                <div className="font-bold text-foreground">جاري فحص بيانات سيارتك بواسطة الذكاء الاصطناعي</div>
                <div className="text-xs text-muted-foreground">رجاءً لا تغلق الصفحة الآن</div>
              </div>
              <div className="text-xs text-muted-foreground">{stage + 1}/4</div>
            </div>

            <div className="p-6">
              <div className="relative h-32 rounded-2xl border border-border bg-muted/20 overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 w-28 bg-primary/15 blur-xl"
                  initial={{ x: -80 }}
                  animate={{ x: 520 }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                />

                <motion.div
                  className="absolute left-6 bottom-6"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: EASE_OUT }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 grid place-items-center">
                    <FaRobot className="text-primary" size={26} />
                  </div>
                </motion.div>

                <motion.div
                  className="absolute right-6 bottom-7"
                  animate={{ x: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.0, ease: EASE_OUT }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 grid place-items-center">
                    <FaCarSide className="text-emerald-600" size={26} />
                  </div>
                </motion.div>

                <div className="absolute left-1/2 top-4 -translate-x-1/2 flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary/60"
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.15, ease: "linear" }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-semibold text-foreground">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>

                <div className="mt-4 h-2 rounded-full bg-border overflow-hidden">
                  <motion.div
                    className="h-2 bg-primary"
                    initial={false}
                    animate={{ width: `${((stage + 1) / 4) * 100}%` }}
                    transition={{ duration: 0.35, ease: EASE_OUT }}
                    style={{ borderRadius: 999 }}
                  />
                </div>

                <div className="mt-3 text-[11px] text-muted-foreground">
                  ملاحظة: قد يستغرق الفحص بعض الوقت حسب حجم الملفات.
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** ================== الكومبوننت الرئيسي ================== **/
export default function AddCarForm() {
  const router = useRouter();

  // ✅ Toast state
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (kind: ToastKind, title: string, message?: string, ms = 3800) => {
    const id =
      (typeof crypto !== "undefined" && "randomUUID" in crypto && (crypto as any).randomUUID?.()) ||
      `${Date.now()}-${Math.random()}`;
    const item: ToastItem = { id, kind, title, message };
    setToasts((p) => [item, ...p].slice(0, 3));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), ms);
  };
  const dismissToast = (id: string) => setToasts((p) => p.filter((x) => x.id !== id));

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<FormData>({
    make: "",
    model: "",
    year: "",
    vin: "",
    odometer: "",
    condition: "",
    evaluation_price: "",
    color: "",
    engine: "",
    transmission: "",
    market_category: "",
    description: "",
    min_price: "",
    max_price: "",
    province: "",
    city: "",
    plate: "",
    main_auction_duration: "10",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ مودال النتيجة
  const [resultOpen, setResultOpen] = useState(false);

  // صور
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);

  // ملف استمارة السيارة
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);

  // إجبارية المرفقات + تلوين
  const [missingUploads, setMissingUploads] = useState<{ images: boolean; reg: boolean }>({
    images: false,
    reg: false,
  });

  // Overlay التحليل
  const [analyzingOpen, setAnalyzingOpen] = useState(false);
  const [analyzingStage, setAnalyzingStage] = useState<0 | 1 | 2 | 3>(0);

  // السيارة التي تم إنشاؤها
  const [createdCar, setCreatedCar] = useState<any>(null);

  // حالة فحص AI
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const [reviewReason, setReviewReason] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const statusAbortRef = useRef<AbortController | null>(null);

  // لوحة الذكاء الاصطناعي (سعر مشابهات)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [aiStats, setAiStats] = useState<AiStats | null>(null);
  const [aiOpen, setAiOpen] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const lastKeyRef = useRef<string>("");

  // إبراز الحقول الناقصة
  const [missing, setMissing] = useState<Set<keyof FormData>>(new Set());
  const [maxPriceError, setMaxPriceError] = useState<string | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => () => statusAbortRef.current?.abort(), []);

  // تنظيف objectURLs
  useEffect(() => {
    return () => {
      previewImages.forEach((img) => {
        if (img.url?.startsWith("blob:")) URL.revokeObjectURL(img.url);
      });
    };
  }, [previewImages]);

  /** ========= Variants ========= */
  const fadeSlideIn: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.25, ease: EASE_OUT } },
  };

  /** ============ صور السيارة ============ */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    if (previewImages.length + files.length > LIMITS.IMAGES_MAX) {
      pushToast("error", "عدد الصور كبير", `يمكنك رفع ${LIMITS.IMAGES_MAX} صور كحد أقصى`);
      return;
    }

    const valid: File[] = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        pushToast("error", "ملف غير مدعوم", "الملفات المسموحة: صور فقط (JPG/PNG/WEBP).");
        continue;
      }
      if (f.size > LIMITS.IMAGE_MAX_MB * 1024 * 1024) {
        pushToast("error", "صورة كبيرة", `حجم الصورة ${formatBytes(f.size)} — الحد ${LIMITS.IMAGE_MAX_MB}MB.`);
        continue;
      }
      valid.push(f);
    }

    if (!valid.length) return;

    const newPreviewImages: PreviewImage[] = valid.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      file,
    }));

    setPreviewImages((prev) => [...prev, ...newPreviewImages]);
    setMissingUploads((p) => ({ ...p, images: false }));
  };

  const removeImage = (index: number) => {
    setPreviewImages((prev) => {
      const target = prev[index];
      if (target?.url?.startsWith("blob:")) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  /** ============ استمارة السيارة ============ */
  const handleRegistrationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > LIMITS.REG_MAX_MB * 1024 * 1024) {
      pushToast("error", "ملف كبير", `حجم الاستمارة ${formatBytes(file.size)} — الحد ${LIMITS.REG_MAX_MB}MB.`);
      return;
    }

    setRegistrationFile(file);
    setMissingUploads((p) => ({ ...p, reg: false }));
  };

  /** ============ Inputs (مع حماية/Clamp) ============ */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    let value: any = (e.target as any).value;

    if (name === "vin") value = safeVin(value);
    if (name === "make" || name === "model" || name === "color" || name === "engine")
      value = safeText(value, LIMITS.TEXT_MAX);
    if (name === "province" || name === "city") value = safeText(value, LIMITS.TEXT_MAX);
    if (name === "plate") value = safeText(value, LIMITS.PLATE_MAX);
    if (name === "description") value = safeText(value, LIMITS.DESC_MAX);

    if (name === "year") {
      value = normalizeNumberField(value, { min: LIMITS.YEAR_MIN, max: LIMITS.YEAR_MAX });
    }
    if (name === "odometer") {
      value = normalizeNumberField(value, { min: LIMITS.ODOMETER_MIN, max: LIMITS.ODOMETER_MAX });
    }
    if (name === "evaluation_price" || name === "min_price" || name === "max_price") {
      value = normalizeNumberField(value, { min: LIMITS.PRICE_MIN, max: LIMITS.PRICE_MAX });
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (missing.has(name as keyof FormData) && String(value).trim() !== "") {
      const m = new Set(missing);
      m.delete(name as keyof FormData);
      setMissing(m);
    }

    if (name === "min_price" || name === "max_price") {
      const minVal = name === "min_price" ? Number(value) : Number(formData.min_price);
      const maxVal = name === "max_price" ? Number(value) : Number(formData.max_price);

      if (!Number.isNaN(minVal) && !Number.isNaN(maxVal) && maxVal > 0 && minVal > 0) {
        let limit = minVal >= 40000 ? minVal * 1.1 : minVal * 1.15;
        if (maxVal > limit) {
          setMaxPriceError(
            `بناءً على الحد الأدنى (${minVal.toLocaleString()}), الحد الأعلى المسموح به هو ${Math.floor(
              limit
            ).toLocaleString()} ريال.`
          );
        } else {
          setMaxPriceError(null);
        }
      } else {
        setMaxPriceError(null);
      }
    }
  };

  /** ============ Validate (مقسّم حسب الخطوة) ============ */
  const stepFields: Record<number, (keyof FormData)[]> = {
    1: ["make", "model", "year", "vin", "odometer", "condition"],
    2: [
      "evaluation_price",
      "color",
      "engine",
      "transmission",
      "market_category",
      "min_price",
      "max_price",
      "province",
      "city",
      "plate",
      "main_auction_duration",
    ],
    3: [],
  };

  const labelFor = (key: keyof FormData): string => {
    const map: Record<keyof FormData, string> = {
      make: "الشركة المصنعة",
      model: "الموديل",
      year: "سنة الصنع",
      vin: "رقم الهيكل (VIN)",
      odometer: "عدد الكيلومترات",
      condition: "حالة السيارة",
      evaluation_price: "سعر السيارة",
      color: "اللون",
      engine: "سعة/نوع المحرك",
      transmission: "ناقل الحركة",
      market_category: "فئة السوق",
      description: "الوصف",
      min_price: "الحد الأدنى",
      max_price: "الحد الأعلى",
      province: "المحافظة",
      city: "المدينة",
      plate: "رقم اللوحة",
      main_auction_duration: "مدة المزاد",
    };
    return map[key];
  };

  const validateStep = (s: number): string | null => {
    const miss = new Set<keyof FormData>();
    for (const key of stepFields[s] || []) {
      const v = formData[key];
      if (v === "" || v === null || v === undefined) miss.add(key);
    }
    setMissing(miss);

    if (miss.size) {
      const k = Array.from(miss)[0];
      return `من فضلك أدخل: ${labelFor(k)}`;
    }

    if (s === 2 && maxPriceError) return "من فضلك صحّح قيمة الحد الأعلى للسعر.";

    if (s <= 2) {
      const y = Number(formData.year);
      if (Number.isNaN(y) || y < LIMITS.YEAR_MIN || y > LIMITS.YEAR_MAX)
        return `سنة الصنع يجب أن تكون بين ${LIMITS.YEAR_MIN} و ${LIMITS.YEAR_MAX}`;

      if (!/^[A-Za-z0-9]{1,17}$/.test(String(formData.vin || "")))
        return "رقم الهيكل (VIN) يجب أن يكون حروف/أرقام وبحد أقصى 17.";

      const od = Number(formData.odometer);
      if (Number.isNaN(od) || od < LIMITS.ODOMETER_MIN || od > LIMITS.ODOMETER_MAX)
        return "قيمة العداد غير صحيحة.";

      const evalPrice = Number(formData.evaluation_price || 0);
      if (s === 2 && (Number.isNaN(evalPrice) || evalPrice < LIMITS.PRICE_MIN))
        return "سعر السيارة غير صحيح.";

      const minP = Number(formData.min_price || 0);
      const maxP = Number(formData.max_price || 0);
      if (s === 2) {
        if (Number.isNaN(minP) || Number.isNaN(maxP))
          return "تأكد من إدخال الحد الأدنى والحد الأعلى بشكل صحيح.";
        if (minP > maxP) return "الحد الأدنى يجب أن يكون أقل من أو يساوي الحد الأعلى.";
      }
    }

    if (s === 3) {
      const missImgs = previewImages.length === 0;
      const missReg = !registrationFile;

      setMissingUploads({ images: missImgs, reg: missReg });

      if (missImgs && missReg) return "لازم ترفع صور السيارة + استمارة السيارة.";
      if (missImgs) return "لازم ترفع صورة واحدة على الأقل للسيارة.";
      if (missReg) return "لازم ترفع استمارة السيارة (PDF/صورة).";
    }

    return null;
  };

  const nextStep = () => {
    const err = validateStep(step);
    if (err) {
      pushToast("error", "بيانات ناقصة", err);
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  /** ============ تحديث حالة الفحص (Polling خفيف) ============ */
  const refreshReviewStatus = async (carId: number) => {
    statusAbortRef.current?.abort();
    const ac = new AbortController();
    statusAbortRef.current = ac;

    const token = getToken();
    if (!token) return { status: null as string | null, reason: null as string | null };

    setStatusLoading(true);
    try {
      const js = await fetchCarStatusById(
        carId,
        { Accept: "application/json", Authorization: `Bearer ${token}` },
        ac.signal
      );

      // يدعم: /status {review_status} أو GET car
      const rs =
        js?.review_status ??
        js?.analysis_status ??
        js?.status ??
        js?.approval_status ??
        null;

      const rr = js?.review_reason ?? js?.analysis_reason ?? null;

      const s = typeof rs === "string" ? rs : null;
      const r = typeof rr === "string" ? rr : null;

      setReviewStatus(s);
      setReviewReason(r);

      return { status: s, reason: r };
    } catch {
      return { status: null as string | null, reason: null as string | null };
    } finally {
      setStatusLoading(false);
    }
  };

  const startLightPolling = async (carId: number) => {
    for (let i = 0; i < 12; i++) {
      const r = await refreshReviewStatus(carId);
      const st = (r.status || "").toLowerCase();
      if (["failed", "rejected", "under_review", "approved"].includes(st)) break;
      await new Promise((res) => setTimeout(res, 2000));
    }
  };

  /** ============ إرسال الإنشاء (FormData + ملفات) ============ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const err1 = validateStep(1);
    if (err1) {
      setStep(1);
      pushToast("error", "الخطوة 1", err1);
      return;
    }
    const err2 = validateStep(2);
    if (err2) {
      setStep(2);
      pushToast("error", "الخطوة 2", err2);
      return;
    }
    const err3 = validateStep(3);
    if (err3) {
      setStep(3);
      pushToast("error", "المرفقات", err3);
      return;
    }

    setIsSubmitting(true);
    setCreatedCar(null);
    setReviewStatus(null);
    setReviewReason(null);

    setAnalyzingOpen(true);
    setAnalyzingStage(0);

    try {
      const token = getToken();
      if (!token) {
        pushToast("error", "غير مسموح", "من فضلك سجّل الدخول أولاً لإضافة سيارة.");
        setIsSubmitting(false);
        setAnalyzingOpen(false);
        return;
      }

      setAnalyzingStage(1);

      const fd = new FormData();
      fd.append("make", safeText(formData.make, LIMITS.TEXT_MAX));
      fd.append("model", safeText(formData.model, LIMITS.TEXT_MAX));
      fd.append("year", String(Number(formData.year)));
      fd.append("vin", safeVin(formData.vin));
      fd.append("odometer", String(Number(formData.odometer)));
      fd.append("condition", String(formData.condition));

      fd.append("evaluation_price", String(Number(formData.evaluation_price)));
      fd.append("color", safeText(formData.color, LIMITS.TEXT_MAX));
      fd.append("engine", safeText(formData.engine, LIMITS.TEXT_MAX));
      if (formData.transmission) fd.append("transmission", String(formData.transmission));
      fd.append("market_category", String(formData.market_category));

      fd.append("description", safeText(formData.description, LIMITS.DESC_MAX));
      fd.append("min_price", String(Number(formData.min_price)));
      fd.append("max_price", String(Number(formData.max_price)));
      fd.append("province", safeText(formData.province, LIMITS.TEXT_MAX));
      fd.append("city", safeText(formData.city, LIMITS.TEXT_MAX));
      fd.append("plate", safeText(formData.plate, LIMITS.PLATE_MAX));
      fd.append("main_auction_duration", String(formData.main_auction_duration || "10"));

      previewImages.forEach((img) => {
        if (img.file) fd.append("images[]", img.file);
      });
      fd.append("registration_card_image", registrationFile as File);

      setAnalyzingStage(2);

      const res = await fetch(`${API_ROOT}/api/cars`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        pushToast("error", "تعذّر الإرسال", friendlyApiError(data, "تعذّر إضافة السيارة الآن. حاول مرة أخرى."));
        setIsSubmitting(false);
        setAnalyzingOpen(false);
        return;
      }

      setAnalyzingStage(3);

      const carObj = data?.car ?? data?.data ?? data?.result ?? null;
      setCreatedCar(carObj);

      // ✅ نجاح الإرسال فقط (بدون ادعاء نجاح الفحص)
      pushToast("success", "تم الإرسال", "تم إرسال السيارة للفحص بنجاح.");

      setResultOpen(true);

      await new Promise((r) => setTimeout(r, 650));
      setAnalyzingOpen(false);
      setIsSubmitting(false);

      const id = Number(carObj?.id || data?.id || 0);
      if (id) {
        await refreshReviewStatus(id);
        startLightPolling(id);
      }
    } catch {
      pushToast("error", "فشل الاتصال", "تعذّر الاتصال بالخادم. تأكد من تشغيل السيرفرات وحاول مرة أخرى.");
      setIsSubmitting(false);
      setAnalyzingOpen(false);
    }
  };

  /** ============ جلب اقتراحات السعر الذكية ============ **/
  const debouncedKey = useMemo(() => {
    const m = String(formData.make || "").trim().toLowerCase();
    const md = String(formData.model || "").trim().toLowerCase();
    const y = Number(formData.year || 0);
    const p = Number(formData.evaluation_price || 0);
    const od = Number(formData.odometer || 0);
    return JSON.stringify({ m, md, y, p, od });
  }, [formData.make, formData.model, formData.year, formData.evaluation_price, formData.odometer]);

  useEffect(() => {
    const parsed = JSON.parse(debouncedKey) as { m: string; md: string; y: number; p: number; od: number };

    if (!parsed.m || !parsed.md || !parsed.y || !parsed.p) {
      setAiSuggestions([]);
      setAiStats(null);
      setAiError(null);
      setAiLoading(false);
      return;
    }

    const t = setTimeout(async () => {
      if (lastKeyRef.current === debouncedKey) return;
      lastKeyRef.current = debouncedKey;

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setAiLoading(true);
      setAiError(null);

      try {
        const q = new URLSearchParams();
        q.set("make", parsed.m);
        q.set("model", parsed.md);
        q.set("year", String(parsed.y));
        q.set("price", String(parsed.p));
        if (parsed.od) q.set("odometer", String(parsed.od));
        q.set("limit", "3");

        const token = getToken();
        const js = await fetchSimilarCars(
          q,
          { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          ac.signal
        );

        setAiSuggestions(Array.isArray(js?.suggestions) ? js.suggestions : []);
        setAiStats(js?.stats || null);
      } catch (err: any) {
        if (err?.name !== "AbortError") setAiError("تعذّر جلب التحليل الذكي الآن.");
      } finally {
        setAiLoading(false);
      }
    }, 450);

    return () => clearTimeout(t);
  }, [debouncedKey]);

  const aiBadge = useMemo(() => {
    if (!aiStats?.min || !aiStats?.max) return null;
    const v = Number(formData.evaluation_price || 0);
    if (!v) return null;
    const inRange =
      typeof aiStats.p25 === "number" &&
      typeof aiStats.p75 === "number" &&
      v >= aiStats.p25 &&
      v <= aiStats.p75;
    return inRange ? "السعر داخل النطاق العادل" : "السعر خارج النطاق المقترح";
  }, [aiStats, formData.evaluation_price]);

  /** ============================ UI ============================ */
  const reviewLabel = (st?: string | null) => {
    const s = (st || "").toLowerCase();
    if (!s) return { text: "غير معروف", tone: "muted" as const };

    if (s === "processing") return { text: "جارٍ الفحص", tone: "info" as const };
    if (s === "under_review") return { text: "تحت المراجعة", tone: "warn" as const };
    if (s === "rejected") return { text: "مرفوضة", tone: "danger" as const };
    if (s === "failed") return { text: "فشل الفحص", tone: "danger" as const };
    if (s === "approved") return { text: "مقبولة", tone: "success" as const };

    return { text: st || "غير معروف", tone: "muted" as const };
  };

  const badgeClass = (tone: "muted" | "info" | "warn" | "danger" | "success") => {
    if (tone === "success") return "bg-emerald-500/12 text-emerald-600 border-emerald-500/20";
    if (tone === "danger") return "bg-destructive/10 text-destructive border-destructive/20";
    if (tone === "warn") return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    if (tone === "info") return "bg-primary/10 text-primary border-primary/20";
    return "bg-muted/30 text-muted-foreground border-border";
  };

  const stBadge = reviewLabel(reviewStatus);

  return (
    <div dir="rtl" className="min-h-screen w-full p-6 md:p-8">
      {/* ✅ Toasts (Popup) */}
      <ToastViewport toasts={toasts} dismiss={dismissToast} />

      <div className="max-w-6xl mx-auto">
        {/* شريط التقدم */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-3">
            {[1, 2, 3].map((n) => {
              const state = step === n ? "current" : step > n ? "done" : "todo";
              return (
                <div key={n} className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg grid place-items-center border shrink-0
                    ${
                      state === "current"
                        ? "border-primary bg-primary text-primary-foreground"
                        : state === "done"
                        ? "border-emerald-600 bg-emerald-500 text-white"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {state === "done" ? <FiCheckCircle size={18} /> : n}
                  </div>
                  <span className={`text-sm ${TXT.sub}`}>
                    {n === 1 ? "البيانات الأساسية" : n === 2 ? "التفاصيل + تحليل السعر" : "المرفقات"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-2 bg-primary"
              initial={false}
              animate={{ width: `${(step - 1) * 50}%` }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              style={{ borderRadius: 999 }}
            />
          </div>
        </div>

        {/* البطاقة */}
        <motion.form
          onSubmit={handleSubmit}
          key={step}
          initial={{ opacity: 0, x: step > 1 ? 40 : -40 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_OUT } }}
          exit={{ opacity: 0, x: step > 1 ? -40 : 40 }}
          className={`rounded-2xl shadow-xl overflow-hidden ${CARD}`}
        >
          {/* العنوان */}
          <div className="p-6 border-b border-border">
            <h2 className={`text-2xl font-bold ${TXT.main}`}>إضافة سيارة جديدة</h2>
            <p className={`mt-1 ${TXT.sub}`}>أدخل البيانات بدقة — وسيتم فحص الملفات تلقائيًا بعد الإرسال.</p>
          </div>

          {/* الخطوة 1 */}
          {step === 1 && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  name="make"
                  label="الشركة المصنعة *"
                  value={formData.make}
                  onChange={handleInputChange}
                  icon={<FaCarSide />}
                  error={missing.has("make")}
                  autoComplete="off"
                />
                <InputField
                  name="model"
                  label="الموديل *"
                  value={formData.model}
                  onChange={handleInputChange}
                  icon={<FaCarSide />}
                  error={missing.has("model")}
                  autoComplete="off"
                />
                <InputField
                  name="year"
                  type="text"
                  inputMode="numeric"
                  label="سنة الصنع *"
                  value={formData.year}
                  onChange={handleInputChange}
                  icon={<FiCalendar />}
                  error={missing.has("year")}
                  placeholder={`${LIMITS.YEAR_MIN} - ${LIMITS.YEAR_MAX}`}
                />
                <InputField
                  name="vin"
                  label="رقم الهيكل (VIN) *"
                  value={formData.vin}
                  onChange={handleInputChange}
                  maxLength={17}
                  icon={<FiHash />}
                  error={missing.has("vin")}
                  autoComplete="off"
                  placeholder="مثال: 1HGCM82633A004352"
                />
                <InputField
                  name="odometer"
                  type="text"
                  inputMode="numeric"
                  label="عدد الكيلومترات *"
                  value={formData.odometer}
                  onChange={handleInputChange}
                  icon={<FaTachometerAlt />}
                  error={missing.has("odometer")}
                  placeholder={`حد أقصى: ${LIMITS.ODOMETER_MAX.toLocaleString()}`}
                />
                <SelectField
                  name="condition"
                  label="حالة السيارة *"
                  value={formData.condition}
                  onChange={handleInputChange}
                  icon={<FiTag />}
                  error={missing.has("condition")}
                >
                  <option value="">اختر الحالة</option>
                  <option value="excellent">ممتازة</option>
                  <option value="good">جيدة</option>
                  <option value="fair">متوسطة</option>
                  <option value="poor">ضعيفة</option>
                </SelectField>
              </div>

              <TextareaField
                name="description"
                label="الوصف"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="أدخل وصفًا مختصرًا وواضحًا للسيارة (اختياري)…"
              />
            </div>
          )}

          {/* الخطوة 2 */}
          {step === 2 && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* العمود الأيسر */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      name="evaluation_price"
                      type="text"
                      inputMode="numeric"
                      label="سعر السيارة *"
                      value={formData.evaluation_price}
                      onChange={handleInputChange}
                      icon={<SaudiRiyal />}
                      error={missing.has("evaluation_price")}
                      placeholder={`حتى ${LIMITS.PRICE_MAX.toLocaleString()}`}
                    />
                    <InputField
                      name="color"
                      label="اللون *"
                      value={formData.color}
                      onChange={handleInputChange}
                      icon={<FiTag />}
                      error={missing.has("color")}
                    />
                    <SelectField
                      name="transmission"
                      label="ناقل الحركة *"
                      value={formData.transmission}
                      onChange={handleInputChange}
                      icon={<GiGearStick />}
                      error={missing.has("transmission")}
                    >
                      <option value="">اختر ناقل الحركة</option>
                      <option value="automatic">أوتوماتيك</option>
                      <option value="manual">يدوي</option>
                      <option value="cvt">CVT</option>
                    </SelectField>
                    <InputField
                      name="engine"
                      label="سعة/نوع المحرك *"
                      value={formData.engine}
                      onChange={handleInputChange}
                      icon={<GiGearStick />}
                      error={missing.has("engine")}
                    />

                    <SelectField
                      name="main_auction_duration"
                      label="مدة المزاد (بالأيام) *"
                      value={formData.main_auction_duration}
                      onChange={handleInputChange}
                      icon={<FiCalendar />}
                      error={missing.has("main_auction_duration")}
                    >
                      <option value="10">10 أيام</option>
                      <option value="20">20 يوم</option>
                      <option value="30">30 يوم</option>
                    </SelectField>

                    <SelectField
                      name="market_category"
                      label="فئة السوق *"
                      value={formData.market_category}
                      onChange={handleInputChange}
                      error={missing.has("market_category")}
                    >
                      <option value="">اختر الفئة</option>
                      <option value="luxuryCars">سوق السيارات الفارهة</option>
                      <option value="classic">سوق السيارات الكلاسيكية</option>
                      <option value="caravan">سوق الكرافانات</option>
                      <option value="busesTrucks">سوق الشاحنات والحافلات</option>
                      <option value="companiesCars">سوق سيارات الشركات</option>
                    </SelectField>

                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-secondary/20 rounded-xl border border-border/50">
                      <InputField
                        name="min_price"
                        type="text"
                        inputMode="numeric"
                        label="الحد الأدنى للسعر *"
                        value={formData.min_price}
                        onChange={handleInputChange}
                        icon={<SaudiRiyal />}
                        error={missing.has("min_price")}
                        hint="السعر الذي يبدأ عنده العد التنازلي للمزاد"
                      />
                      <div>
                        <InputField
                          name="max_price"
                          type="text"
                          inputMode="numeric"
                          label="الحد الأعلى للسعر *"
                          value={formData.max_price}
                          onChange={handleInputChange}
                          icon={<SaudiRiyal />}
                          error={missing.has("max_price") || !!maxPriceError}
                          hint="سعر الشراء الفوري (ضمن النطاق المسموح)"
                        />
                        {maxPriceError && (
                          <p className="mt-2 text-xs text-destructive font-medium">
                            {maxPriceError}
                          </p>
                        )}
                      </div>
                    </div>

                    <InputField
                      name="province"
                      label="المحافظة *"
                      value={formData.province}
                      onChange={handleInputChange}
                      icon={<FiMapPin />}
                      error={missing.has("province")}
                    />
                    <InputField
                      name="city"
                      label="المدينة *"
                      value={formData.city}
                      onChange={handleInputChange}
                      icon={<FiMapPin />}
                      error={missing.has("city")}
                    />
                    <InputField
                      name="plate"
                      label="رقم اللوحة *"
                      value={formData.plate}
                      onChange={handleInputChange}
                      icon={<FiHash />}
                      error={missing.has("plate")}
                    />
                  </div>

                  <div className={`rounded-xl p-4 ${PANEL}`}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-foreground">ملخص تحليل السعر (اختياري)</div>
                      {aiBadge && (
                        <span className="text-xs px-2 py-1 rounded-full border border-border bg-card">
                          {aiBadge}
                        </span>
                      )}
                    </div>
                    <PriceRangeBar
                      min={aiStats?.min}
                      p25={aiStats?.p25}
                      median={aiStats?.median}
                      p75={aiStats?.p75}
                      max={aiStats?.max}
                      value={Number(formData.evaluation_price || 0)}
                    />
                    {!!aiStats?.median && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        نطاق مقترح: {aiStats?.p25?.toLocaleString?.()} – {aiStats?.p75?.toLocaleString?.()} •
                        الوسيط: {aiStats?.median?.toLocaleString?.()}
                      </div>
                    )}
                  </div>
                </div>

                {/* العمود الأيمن: لوحة الذكاء الاصطناعي */}
                <div className="lg:col-span-1">
                  <div className={`rounded-xl overflow-hidden ${PANEL}`}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full grid place-items-center bg-primary/10 border border-primary/20">
                          <FiTrendingUp className="text-primary" />
                        </div>
                        <h3 className={`font-semibold ${TXT.main}`}>تحليل السعر الذكي</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAiOpen((v) => !v)}
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        {aiOpen ? "إخفاء" : "عرض"}
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {aiOpen && (
                        <motion.div
                          key="ai-panel"
                          variants={fadeSlideIn}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="p-4"
                        >
                          <p className="text-xs text-muted-foreground mb-3">
                            التحليل يساعدك على تسعير أقرب للواقع حسب سيارات مشابهة.
                          </p>

                          {aiLoading && (
                            <div className="animate-pulse space-y-3">
                              <div className="h-3 bg-muted rounded" />
                              <div className="h-3 bg-muted rounded w-5/6" />
                              <div className="h-24 bg-muted rounded" />
                            </div>
                          )}

                          {aiError && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded p-2 text-xs mb-2">
                              {aiError}
                            </div>
                          )}

                          {!aiLoading && aiSuggestions.length > 0 && (
                            <div className="space-y-2">
                              {aiSuggestions.map((s, i) => {
                                const diff = Number(s?.price_diff || 0);
                                const more = diff > 0;
                                return (
                                  <motion.div
                                    key={s.id || i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, ease: EASE_OUT }}
                                    className="flex gap-3 items-center rounded-lg p-2 border border-border bg-card hover:bg-muted/50"
                                  >
                                    <div className="w-16 h-16 rounded-md overflow-hidden grid place-items-center bg-muted border border-border">
                                      {Array.isArray(s?.images) && s.images[0] ? (
                                        <img
                                          src={s.images[0] as string}
                                          alt={s.label || "صورة"}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <FaCarSide className="text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className={`text-sm font-semibold truncate ${TXT.main}`}>{s.label}</div>
                                      <div className="text-xs text-muted-foreground">
                                        سعرها:{" "}
                                        <b className={TXT.main}>
                                          {Number(s.evaluation_price || 0).toLocaleString()}
                                        </b>
                                        {typeof s.odometer === "number" && (
                                          <>
                                            {" "}
                                            • ممشى: {s.odometer.toLocaleString()} كم
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className={`text-xs font-bold ${more ? "text-rose-500" : "text-emerald-500"}`}>
                                      {more ? "+" : ""}
                                      {diff.toLocaleString()}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}

                          {!aiLoading && !aiError && aiSuggestions.length === 0 && (
                            <div className="text-xs text-muted-foreground">
                              لا توجد نتائج مشابهة الآن — جرّب تعديل السعر/البيانات.
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                lastKeyRef.current = "";
                                const n = Number(formData.evaluation_price || 0);
                                setFormData((prev) => ({ ...prev, evaluation_price: n + 0 }));
                              }}
                              className="text-xs flex items-center gap-1 text-primary hover:text-primary/80"
                            >
                              <FiRefreshCw /> تحديث
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className={`mt-6 rounded-xl overflow-hidden ${PANEL}`}>
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-emerald-500/10">
                      <FiInfo className="text-emerald-600" />
                      <h3 className={`font-semibold ${TXT.main}`}>توضيح سريع للحدود</h3>
                    </div>
                    <div className="p-4 text-sm text-muted-foreground space-y-3 leading-relaxed">
                      <p>
                        <strong className="text-foreground block mb-1">الحد الأعلى:</strong>
                        وصول المزايدة له يُنهي المزاد فورًا (شراء فوري).
                      </p>
                      <p>
                        <strong className="text-foreground block mb-1">الحد الأدنى:</strong>
                        عند الوصول له يبدأ العدّ التنازلي النهائي للمزاد.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* الخطوة 3 */}
          {step === 3 && (
            <div className="p-6 space-y-8">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-medium ${TXT.main} mb-2`}>رفع صور السيارة *</h3>
                  <span className="text-xs text-muted-foreground">
                    {previewImages.length}/{LIMITS.IMAGES_MAX}
                  </span>
                </div>
                <p className={`${TXT.sub} mb-4`}>إجباري: صورة واحدة على الأقل</p>

                <input type="file" ref={fileInputRef} onChange={handleImageUpload} multiple accept="image/*" className="hidden" />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-12 rounded-xl border-2 border-dashed transition
                    ${missingUploads.images ? "border-destructive bg-destructive/5" : "border-border bg-muted/20 hover:bg-muted/40"}
                  `}
                >
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FiUpload size={40} className="mb-3" />
                    <p className={`text-lg ${TXT.main}`}>انقر لاختيار الصور</p>
                    <p className="text-sm mt-1">
                      JPG, PNG, WEBP — حد أقصى {LIMITS.IMAGE_MAX_MB}MB للصورة
                    </p>
                    {missingUploads.images && <p className="mt-2 text-xs text-destructive">رفع الصور إجباري</p>}
                  </div>
                </motion.button>
              </div>

              {previewImages.length > 0 && (
                <div>
                  <h3 className={`text-lg font-medium ${TXT.main} mb-3`}>الصور المرفوعة</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {previewImages.map((image, index) => (
                      <div key={index} className="relative group rounded-lg overflow-hidden bg-card border border-border">
                        <img src={image.url} alt={`Preview ${index}`} className="w-full h-32 object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="حذف الصورة"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className={`text-lg font-medium ${TXT.main} mb-2`}>رفع استمارة السيارة (PDF/صورة) *</h3>
                <p className={`${TXT.sub} mb-4`}>إجباري: ارفع الاستمارة</p>

                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleRegistrationUpload}
                  className="hidden"
                  id="registration-upload"
                />
                <label htmlFor="registration-upload">
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`inline-block mt-1 px-4 py-2 rounded-lg transition cursor-pointer
                      ${missingUploads.reg ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"}
                    `}
                  >
                    اختر ملف الاستمارة
                  </motion.span>
                </label>

                {registrationFile ? (
                  <div className="mt-3 text-sm text-muted-foreground">
                    تم اختيار:{" "}
                    <span className={TXT.main}>
                      {registrationFile.name} ({formatBytes(registrationFile.size)})
                    </span>
                  </div>
                ) : (
                  missingUploads.reg && <p className="mt-2 text-xs text-destructive">رفع الاستمارة إجباري</p>
                )}
              </div>
            </div>
          )}

          {/* أزرار التنقل / الإرسال */}
          <div className="p-6 border-t border-border bg-muted/20">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between">
              {step > 1 ? (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={prevStep}
                  className="px-6 py-2 rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition inline-flex items-center gap-2"
                >
                  <FiArrowRight /> السابق
                </motion.button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={nextStep}
                  className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition inline-flex items-center gap-2"
                >
                  التالي <FiArrowLeft />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting || !!maxPriceError || previewImages.length === 0 || !registrationFile}
                  className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "جاري الإرسال..." : "إرسال السيارة للفحص"}
                </motion.button>
              )}
            </div>
          </div>
        </motion.form>
      </div>

      {/* ✅ Overlay التحليل الاحترافي */}
      <AiOverlay open={analyzingOpen} stage={analyzingStage} />

      {/* ✅ مودال النتيجة (لا يدّعي نجاح الفحص) */}
      <AnimatePresence>
        {resultOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className={`p-7 max-w-lg w-full mx-4 rounded-2xl shadow-xl ${CARD}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 grid place-items-center">
                  <FiCheckCircle className="text-primary" size={22} />
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold text-foreground">تم إرسال السيارة للفحص</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    قد يستغرق ظهور نتيجة الفحص عدة دقائق حسب الضغط وحجم الملفات.
                  </div>
                </div>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setResultOpen(false)}
                  aria-label="إغلاق"
                >
                  <FiX />
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-foreground">حالة الفحص الحالية</div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${badgeClass(stBadge.tone)}`}>
                    {stBadge.text}
                  </span>
                </div>


                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      const id = Number(createdCar?.id || 0);
                      if (!id) return;
                      const r = await refreshReviewStatus(id);
                      if (!r.status) pushToast("info", "تم التحديث", "لو ما ظهرتش نتيجة الآن، جرّب بعد دقائق.");
                    }}
                    className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted/50 text-sm inline-flex items-center gap-2"
                    disabled={statusLoading}
                  >
                    <FiRefreshCw />
                    {statusLoading ? "جاري التحديث..." : "تحديث الحالة"}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/exhibitor/all-cars")}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
                  >
                    الذهاب لصفحة السيارات
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-border bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                  <FiInfo />
                  ماذا بعد؟
                </div>
                <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  تم إرسال السيارة بنجاح. لو نتيجة الفحص ما ظهرتش فورًا — افتح صفحة السيارات لمتابعة الحالة:
                  <span className="font-semibold text-foreground"> /exhibitor/all-cars</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        body {
          font-family: Lama, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell,
            "Noto Sans Arabic", Cairo, Tahoma, Arial, sans-serif;
        }
      `}</style>
    </div>
  );
}
