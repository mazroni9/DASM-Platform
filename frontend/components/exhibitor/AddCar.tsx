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
  FiDollarSign,
  FiCalendar,
  FiMapPin,
  FiHash,
  FiTag,
} from "react-icons/fi";
import { FaTachometerAlt, FaCarSide } from "react-icons/fa";
import { GiGearStick } from "react-icons/gi";
import { SaudiRiyal } from "lucide-react";

/** ================= أنواع الحقول ================= **/
type Condition = "excellent" | "good" | "fair" | "poor";
type Transmission = "automatic" | "manual" | "cvt";
type MarketCategory =
  | "luxuryCars"
  | "classic"
  | "caravan"
  | "busesTrucks"
  | "companiesCars"
  | "government";
type AuctionStatus =
  | "available"
  | "in_auction"
  | "sold"
  | "reserved"
  | "pending_approval";

const DEFAULT_AUCTION_STATUS: AuctionStatus = "available";

/** ========= API Base (مع fallback لنفس الدومين) ========= */
const rawBase = (process.env.NEXT_PUBLIC_API_URL || "")
  .trim()
  .replace(/\/+$/, "");
const API_ROOT =
  rawBase || (typeof window !== "undefined" ? `${window.location.origin}` : "");
const SUGGEST_URL = (q: URLSearchParams) =>
  `${API_ROOT}/api/cars/similar?${q.toString()}`;

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

/** ========= Theme ========= */
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const CARD = "bg-card border border-border backdrop-blur";
const PANEL = "bg-secondary/30 border border-border";
const TXT = { main: "text-foreground", sub: "text-muted-foreground" };

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
}

interface PreviewImage {
  url: string;
  name: string;
  file?: File;
}

interface OcrData {
  make?: string;
  model?: string;
  year?: string;
  vin?: string;
  engine?: string;
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
        className={`mb-1.5 block text-sm ${
          error ? "text-destructive" : TXT.sub
        }`}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p
          className={`mt-1 text-xs ${
            error ? "text-destructive" : "text-muted-foreground"
          }`}
        >
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
    typeof v === "number"
      ? clamp(((v - min!) / span) * 100, 0, 100)
      : undefined;
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
          <div
            className="absolute -top-2"
            style={{ left: `calc(${pVal}% - 8px)` }}
          >
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

/** ================== الكومبوننت الرئيسي ================== **/
export default function AddCarForm() {
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [serverMsg, setServerMsg] = useState<string | null>(null);

  // صور
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);

  // OCR (محاكاة)
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrData, setOcrData] = useState<OcrData | null>(null);

  // لوحة الذكاء الاصطناعي
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

  /** ========= Variants ========= */
  const fadeSlideIn: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: EASE_OUT },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.25, ease: EASE_OUT },
    },
  };

  /** ============ صور ============ */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (previewImages.length + files.length > 10) {
      setErrorMsg("يمكنك رفع 10 صور كحد أقصى");
      return;
    }
    const newPreviewImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      file,
    }));
    setPreviewImages((prev) => [...prev, ...newPreviewImages]);
  };
  const removeImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  /** ============ OCR ============ */
  const handleOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setOcrFile(file);
    setTimeout(() => {
      const mocked: OcrData = {
        make: "Toyota",
        model: "Camry",
        year: "2020",
        vin: "1HGCM82633A123456",
        engine: "2.5L",
      };
      setOcrData(mocked);
    }, 1000);
  };

  /** ============ Inputs ============ */
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (missing.has(name as keyof FormData) && String(value).trim() !== "") {
      const m = new Set(missing);
      m.delete(name as keyof FormData);
      setMissing(m);
    }

    // Real-time validation for max price
    if (name === "min_price" || name === "max_price") {
      const minVal =
        name === "min_price" ? Number(value) : Number(formData.min_price);
      const maxVal =
        name === "max_price" ? Number(value) : Number(formData.max_price);

      if (!isNaN(minVal) && !isNaN(maxVal) && maxVal > 0) {
        let limit = 0;
        if (minVal >= 40000) {
          limit = minVal * 1.1;
        } else {
          limit = minVal * 1.15;
        }

        if (maxVal > limit) {
          // Format numbers for display
          const formattedMin = minVal.toLocaleString();
          const formattedLimit = Math.floor(limit).toLocaleString(); // Use floor to be safe/clean
          setMaxPriceError(
            `بناءً على الحد الأدنى المدخل (${formattedMin})، القيمة القصوى المسموح بها للحد الأعلى هي ${formattedLimit} ريال.`
          );
        } else {
          setMaxPriceError(null);
        }
      } else {
        setMaxPriceError(null);
      }
    }
  };
  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  /** ============ Validate ============ */
  const requiredFields: (keyof FormData)[] = [
    "make",
    "model",
    "year",
    "vin",
    "odometer",
    "condition",
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
  ];
  const labelFor = (key: keyof FormData): string => {
    const map: Record<keyof FormData, string> = {
      make: "الشركة المصنعة",
      model: "الموديل",
      year: "سنة الصنع",
      vin: "رقم الهيكل (VIN)",
      odometer: "عدد الكيلومترات",
      condition: "حالة السيارة",
      evaluation_price: "السعر المقيّم",
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
    };
    return map[key];
  };

  const buildEffectiveData = (): FormData =>
    ({ ...formData, ...(ocrData || {}) } as FormData);

  const validate = (data: FormData): string | null => {
    const miss = new Set<keyof FormData>();
    for (const key of requiredFields) {
      const v = data[key];
      if (v === "" || v === null || v === undefined) miss.add(key);
    }
    setMissing(miss);
    if (miss.size) {
      const k = Array.from(miss)[0];
      return `الرجاء تعبئة الحقل المطلوب: ${labelFor(k)}`;
    }

    const allowedConditions: Condition[] = [
      "excellent",
      "good",
      "fair",
      "poor",
    ];
    if (!allowedConditions.includes(data.condition as Condition))
      return 'قيمة "condition" غير صحيحة';
    const allowedTransmissions: Transmission[] = ["automatic", "manual", "cvt"];
    if (!allowedTransmissions.includes(data.transmission as Transmission))
      return 'قيمة "transmission" غير صحيحة';
    const allowedCategories: MarketCategory[] = [
      "luxuryCars",
      "classic",
      "caravan",
      "busesTrucks",
      "companiesCars",
      "government",
    ];
    if (!allowedCategories.includes(data.market_category as MarketCategory))
      return 'قيمة "market_category" غير صحيحة';

    const y = Number(data.year);
    const thisYearPlusOne = new Date().getFullYear() + 1;
    if (isNaN(y) || y < 1900 || y > thisYearPlusOne)
      return `سنة الصنع يجب أن تكون بين 1900 و ${thisYearPlusOne}`;

    const od = Number(data.odometer);
    if (isNaN(od) || od < 0) return "العداد (odometer) غير صحيح";
    const evalPrice = Number(data.evaluation_price);
    if (isNaN(evalPrice) || evalPrice < 0) return "evaluation_price غير صحيح";
    const minP = Number(data.min_price);
    const maxP = Number(data.max_price);
    if (isNaN(minP) || isNaN(maxP) || minP < 0 || maxP < 0)
      return "min_price/max_price غير صحيح";
    if (minP > maxP) return "min_price يجب أن يكون أقل من أو يساوي max_price";
    if (!/^[A-Za-z0-9]{1,17}$/.test(String(data.vin || "")))
      return "رقم الهيكل (VIN) يجب أن يكون من حروف/أرقام بطول حتى 17";
    return "رقم الهيكل (VIN) يجب أن يكون من حروف/أرقام بطول حتى 17";

    if (maxPriceError) return "الرجاء تصحيح خطأ الحد الأعلى للسعر";

    return null;
  };

  /** ============ إرسال الإنشاء ============ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setServerMsg(null);

    const effective = buildEffectiveData();
    const validationError = validate(effective);
    if (validationError) {
      setErrorMsg(validationError);
      setIsSubmitting(false);
      return;
    }

    const payload = {
      make: String(effective.make).trim(),
      model: String(effective.model).trim(),
      year: Number(effective.year),
      vin: String(effective.vin).trim(),
      odometer: Number(effective.odometer),
      condition: effective.condition,
      evaluation_price: Number(effective.evaluation_price),
      color: String(effective.color).trim(),
      engine: String(effective.engine).trim(),
      transmission: effective.transmission,
      market_category: effective.market_category,
      description: String(effective.description || ""),
      min_price: Number(effective.min_price),
      max_price: Number(effective.max_price),
      province: String(effective.province).trim(),
      city: String(effective.city).trim(),
      plate: String(effective.plate).trim(),
      auction_status: DEFAULT_AUCTION_STATUS,
    };

    try {
      const token = getToken();
      if (!token) {
        setIsSubmitting(false);
        setErrorMsg("غير مصرح: مفقود رمز الدخول. الرجاء تسجيل الدخول أولاً.");
        return;
      }

      const res = await fetch(`${API_ROOT}/api/cars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.errors) {
          const firstKey = Object.keys(data.errors)[0];
          const firstMsg = data.errors[firstKey]?.[0] || "فشل إنشاء السيارة";
          setErrorMsg(firstMsg);
        } else {
          setErrorMsg(data?.message || "حدث خطأ غير متوقع");
        }
        setIsSubmitting(false);
        return;
      }

      setServerMsg(data?.message || "تمت الإضافة بنجاح");
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
      }, 350);
    } catch (err: any) {
      setErrorMsg(err?.message || "تعذّر الاتصال بالخادم");
      setIsSubmitting(false);
    }
  };

  /** ============ جلب اقتراحات السعر الذكية ============ **/
  const debouncedKey = useMemo(() => {
    const m = String(formData.make || ocrData?.make || "")
      .trim()
      .toLowerCase();
    const md = String(formData.model || ocrData?.model || "")
      .trim()
      .toLowerCase();
    const y = Number(formData.year || ocrData?.year || 0);
    const p = Number(formData.evaluation_price || 0);
    const od = Number(formData.odometer || 0);
    return JSON.stringify({ m, md, y, p, od });
  }, [
    formData.make,
    formData.model,
    formData.year,
    formData.evaluation_price,
    formData.odometer,
    ocrData,
  ]);

  useEffect(() => {
    const parsed = JSON.parse(debouncedKey) as {
      m: string;
      md: string;
      y: number;
      p: number;
      od: number;
    };
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
        const res = await fetch(SUGGEST_URL(q), {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: ac.signal,
        });
        if (!res.ok) {
          const tx = await res.text().catch(() => "");
          throw new Error(tx || `فشل التحليل (${res.status})`);
        }
        const js = await res.json();
        setAiSuggestions(Array.isArray(js?.suggestions) ? js.suggestions : []);
        setAiStats(js?.stats || null);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setAiError(err?.message || "تعذّر جلب التحليل");
        }
      } finally {
        setAiLoading(false);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [debouncedKey]);

  /** ============================ UI ============================ */
  return (
    <div dir="rtl" className="min-h-screen w-full p-6 md:p-8">
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
                    {n === 1
                      ? "البيانات الأساسية"
                      : n === 2
                      ? "التفاصيل + تحليل السعر"
                      : "المرفقات"}
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

        {/* تنبيهات */}
        {errorMsg && (
          <motion.div
            variants={fadeSlideIn}
            initial="hidden"
            animate="visible"
            className="mb-4 rounded-lg p-3 border border-destructive/20 bg-destructive/10 text-destructive"
          >
            {errorMsg}
          </motion.div>
        )}
        {serverMsg && !isSuccess && (
          <motion.div
            variants={fadeSlideIn}
            initial="hidden"
            animate="visible"
            className="mb-4 rounded-lg p-3 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
          >
            {serverMsg}
          </motion.div>
        )}

        {/* البطاقة */}
        <motion.form
          onSubmit={handleSubmit}
          key={step}
          initial={{ opacity: 0, x: step > 1 ? 40 : -40 }}
          animate={{
            opacity: 1,
            x: 0,
            transition: { duration: 0.35, ease: EASE_OUT },
          }}
          exit={{ opacity: 0, x: step > 1 ? -40 : 40 }}
          className={`rounded-2xl shadow-xl overflow-hidden ${CARD}`}
        >
          {/* العنوان */}
          <div className="p-6 border-b border-border">
            <h2 className={`text-2xl font-bold ${TXT.main}`}>
              إضافة سيارة جديدة
            </h2>
            <p className={`mt-1 ${TXT.sub}`}>
              املأ التفاصيل أدناه لإضافة سيارة
            </p>
          </div>

          {/* الخطوة 1 */}
          {step === 1 && (
            <div className="p-6 space-y-6">
              {ocrData && (
                <div className={`rounded-xl p-4 ${PANEL}`}>
                  <div className={`flex items-center mb-2 ${TXT.main}`}>
                    <FiInfo className="ml-2" />
                    <h3 className="font-medium">
                      تم استخراج بيانات مبدئية من الاستمارة (محاكاة)
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(ocrData).map(([k, v]) => (
                      <div key={k} className={`p-3 rounded-lg ${CARD}`}>
                        <p className="text-[11px] text-muted-foreground">{k}</p>
                        <p className={`font-medium ${TXT.main}`}>
                          {v as string}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData(
                        (prev) => ({ ...prev, ...ocrData } as FormData)
                      )
                    }
                    className="mt-3 text-sm px-3 py-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition"
                  >
                    تعبئة تلقائية
                  </button>
                </div>
              )}

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
                  type="number"
                  label="سنة الصنع *"
                  value={formData.year}
                  onChange={handleInputChange}
                  icon={<FiCalendar />}
                  error={missing.has("year")}
                  min={1900}
                  max={new Date().getFullYear() + 1}
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
                />
                <InputField
                  name="odometer"
                  type="number"
                  label="عدد الكيلومترات *"
                  value={formData.odometer}
                  onChange={handleInputChange}
                  icon={<FaTachometerAlt />}
                  error={missing.has("odometer")}
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
                placeholder="أدخل وصفًا تفصيليًا للسيارة..."
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
                      type="number"
                      label="سعر السيارة *"
                      value={formData.evaluation_price}
                      onChange={handleInputChange}
                      icon={<SaudiRiyal />}
                      error={missing.has("evaluation_price")}
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
                      <option value="busesTrucks">
                        سوق الشاحنات والحافلات
                      </option>
                      <option value="companiesCars">سوق سيارات الشركات</option>
                      <option value="government">
                        سوق سيارات الجهات الحكومية
                      </option>
                    </SelectField>
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-secondary/20 rounded-xl border border-border/50">
                      <InputField
                        name="min_price"
                        type="number"
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
                          type="number"
                          label="الحد الأعلى للسعر *"
                          value={formData.max_price}
                          onChange={handleInputChange}
                          icon={<SaudiRiyal />}
                          error={missing.has("max_price") || !!maxPriceError}
                          hint="سعر الشراء الفوري (يجب أن يكون ضمن النطاق المسموح)"
                        />
                        {maxPriceError && (
                          <p className="mt-2 text-xs text-destructive text-red-500 font-medium animate-pulse">
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
                        نطاق مقترح: {aiStats?.p25?.toLocaleString?.()} –{" "}
                        {aiStats?.p75?.toLocaleString?.()} • الوسيط:{" "}
                        {aiStats?.median?.toLocaleString?.()}
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
                        <h3 className={`font-semibold ${TXT.main}`}>
                          تحليل السعر الذكي
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAiOpen((v) => !v)}
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        {aiOpen ? "إخفاء" : "عرض"}
                      </button>
                    </div>

                    {/* New Sidebar Note: How Price Limits Work */}

                    {/* Re-opening the previous AI panel div to match structure if I closed it? 
                      Wait, I need to be careful with closing tags. 
                      The original code had:
                      <div className={`rounded-xl overflow-hidden ${PANEL}`}>...</div>
                      I should probably just insert the new div after the existing AI panel div.
                      The AI panel ends at line 1262 with `</div>`.
                      
                      Let's target the END of the column div.
                   */}

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
                            أدخل <b>الماركة</b> و<b>الموديل</b> و<b>السنة</b> و
                            <b>سعر التقييم</b> (والممشى اختياري) لاقتراح أسعار
                            سيارات مشابهة.
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

                          {aiStats && !aiLoading && (
                            <div className="mb-3">
                              <div className="text-xs text-muted-foreground">
                                نتائج متقاربة لنفس الموديل ± سنة:
                                <div className="mt-1 grid grid-cols-5 gap-2 text-center">
                                  {(
                                    [
                                      "min",
                                      "p25",
                                      "median",
                                      "p75",
                                      "max",
                                    ] as const
                                  ).map((k) => (
                                    <div
                                      key={k}
                                      className={`rounded p-1 ${CARD}`}
                                    >
                                      <div className="text-[10px] text-muted-foreground">
                                        {k === "min"
                                          ? "أدنى"
                                          : k === "p25"
                                          ? "ربع أول"
                                          : k === "median"
                                          ? "وسيط"
                                          : k === "p75"
                                          ? "ربع ثالث"
                                          : "أعلى"}
                                      </div>
                                      <div
                                        className={`font-semibold ${TXT.main}`}
                                      >
                                        {(aiStats as any)[
                                          k
                                        ]?.toLocaleString?.()}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
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
                                    transition={{
                                      duration: 0.25,
                                      ease: EASE_OUT,
                                    }}
                                    className={`flex gap-3 items-center rounded-lg p-2 border border-border bg-card hover:bg-muted/50`}
                                  >
                                    <div className="w-16 h-16 rounded-md overflow-hidden grid place-items-center bg-muted border border-border">
                                      {Array.isArray(s?.images) &&
                                      s.images[0] ? (
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
                                      <div
                                        className={`text-sm font-semibold truncate ${TXT.main}`}
                                      >
                                        {s.label}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        سعرها:{" "}
                                        <b className={TXT.main}>
                                          {Number(
                                            s.evaluation_price || 0
                                          ).toLocaleString()}
                                        </b>
                                        {typeof s.odometer === "number" && (
                                          <>
                                            {" "}
                                            • ممشى:{" "}
                                            {s.odometer.toLocaleString()} كم
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div
                                      className={`text-xs font-bold ${
                                        more
                                          ? "text-rose-500"
                                          : "text-emerald-500"
                                      }`}
                                    >
                                      {more ? "+" : ""}
                                      {diff.toLocaleString()}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}

                          {!aiLoading &&
                            !aiError &&
                            aiSuggestions.length === 0 && (
                              <div className="text-xs text-muted-foreground">
                                لا توجد اقتراحات حتى الآن. تأكد من إدخال الماركة
                                والموديل والسنة وسعر التقييم.
                              </div>
                            )}

                          <div className="mt-3 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                lastKeyRef.current = "";
                                const n = Number(
                                  formData.evaluation_price || 0
                                );
                                setFormData((prev) => ({
                                  ...prev,
                                  evaluation_price: n + 0,
                                }));
                              }}
                              className="text-xs flex items-center gap-1 text-primary hover:text-primary/80"
                            >
                              <FiRefreshCw /> تحديث التحليل
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* New Sidebar Note: How Price Limits Work */}
                  <div className={`mt-6 rounded-xl overflow-hidden ${PANEL}`}>
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-emerald-500/10">
                      <FiInfo className="text-emerald-600" />
                      <h3 className={`font-semibold ${TXT.main}`}>
                        كيف تعمل حدود السعر؟
                      </h3>
                    </div>
                    <div className="p-4 text-sm text-muted-foreground space-y-3 leading-relaxed">
                      <p>
                        <strong className="text-foreground block mb-1">
                          الحد الأعلى (Maximum Price):
                        </strong>
                        وصول المزايدة لهذا السعر ينهي المزاد فوراً ويعلن فوز
                        صاحبها.
                      </p>
                      <div>
                        <strong className="text-foreground block mb-1">
                          الحد الأدنى (Minimum Price):
                        </strong>
                        <ul className="list-disc list-inside space-y-2 mr-2">
                          <li>
                            <strong className="text-foreground">
                              في المزادات العادية:
                            </strong>{" "}
                            وصول السعر له يُدخل المزاد في مرحلة العد التنازلي
                            النهائي.
                          </li>
                          <li>
                            <strong className="text-foreground">
                              في السوق المتأخر (Delayed Market):
                            </strong>{" "}
                            أي مزايدة تصل لهذا السعر أو تتجاوزه تؤدي لإنهاء
                            المزاد فوراً وإعلان الفوز.
                          </li>
                        </ul>
                      </div>
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-600">
                        ملاحظة: يضمن النظام هامشاً محدداً بين الحدين لعدالة
                        المزاد.
                      </div>
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
                <h3 className={`text-lg font-medium ${TXT.main} mb-2`}>
                  رفع صور السيارة (بدون ربط حاليًا)
                </h3>
                <p className={`${TXT.sub} mb-4`}>الحد الأقصى 10 صور</p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-12 rounded-xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition`}
                >
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FiUpload size={40} className="mb-3" />
                    <p className={`text-lg ${TXT.main}`}>
                      انقر أو اسحب الصور هنا
                    </p>
                    <p className="text-sm mt-1">
                      JPEG, PNG (5MB كحد أقصى لكل صورة)
                    </p>
                  </div>
                </motion.button>
              </div>

              {previewImages.length > 0 && (
                <div>
                  <h3 className={`text-lg font-medium ${TXT.main} mb-3`}>
                    الصور المرفوعة
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {previewImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg overflow-hidden bg-card border border-border"
                      >
                        <img
                          src={image.url}
                          alt={`Preview ${index}`}
                          className="w-full h-32 object-cover"
                        />
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
                <h3 className={`text-lg font-medium ${TXT.main} mb-2`}>
                  رفع استمارة السيارة (بدون ربط)
                </h3>
                <p className={`${TXT.sub} mb-4`}>
                  سيتم استخدامها لاحقًا للتحقق عبر OCR
                </p>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleOcrUpload}
                  className="hidden"
                  id="ocr-upload"
                />
                <label htmlFor="ocr-upload">
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-block mt-3 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition cursor-pointer"
                  >
                    اختر ملف الاستمارة
                  </motion.span>
                </label>
                {ocrFile && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    تم اختيار الملف:{" "}
                    <span className={TXT.main}>{ocrFile.name}</span>
                  </div>
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
                  className="px-6 py-2 rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition"
                >
                  السابق
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
                  className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition"
                >
                  التالي
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting || !!maxPriceError}
                  className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "جاري الإرسال..." : "إضافة السيارة"}
                </motion.button>
              )}
            </div>
          </div>
        </motion.form>
      </div>

      {/* رسالة النجاح */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className={`p-8 max-w-md w-full mx-4 text-center rounded-2xl shadow-xl ${CARD}`}
            >
              <div className="w-20 h-20 rounded-full grid place-items-center mx-auto mb-4 bg-emerald-500/15 border border-border">
                <FiCheckCircle size={40} className="text-emerald-500" />
              </div>
              <h3 className={`text-2xl font-bold ${TXT.main} mb-2`}>
                تمت الإضافة بنجاح!
              </h3>
              <p className={`${TXT.sub} mb-6`}>
                تمت إضافة السيارة وسيتم مراجعتها قبل النشر.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsSuccess(false);
                    setStep(1);
                    setFormData({
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
                    });
                    setPreviewImages([]);
                    setOcrFile(null);
                    setOcrData(null);
                    setServerMsg(null);
                    setErrorMsg(null);
                    setAiSuggestions([]);
                    setAiStats(null);
                    setAiError(null);
                    setMissing(new Set());
                  }}
                  className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition"
                >
                  إضافة سيارة جديدة
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsSuccess(false)}
                  className="px-6 py-2 rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition"
                >
                  إغلاق
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        body {
          font-family: Lama, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu,
            Cantarell, "Noto Sans Arabic", Cairo, Tahoma, Arial, sans-serif;
        }
      `}</style>
    </div>
  );
}
