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
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

/**
 * ===== API base & helpers =====
 */
const IS_PROD = process.env.NODE_ENV === "production";
const RAW_ROOT = (process.env.NEXT_PUBLIC_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

const getSameOrigin = () =>
  typeof window !== "undefined" ? window.location.origin : "";

function resolveApiRoot() {
  if (RAW_ROOT) return { root: RAW_ROOT, source: "env" as const };
  if (!IS_PROD)
    return { root: getSameOrigin(), source: "dev-fallback" as const };
  throw new Error(
    [
      "Production misconfigured: NEXT_PUBLIC_API_URL is missing.",
      "Set it to your Laravel host ROOT (WITHOUT /api).",
      "Example: https://dasm-development-branch.onrender.com OR https://dasm.com.sa/public",
    ].join(" ")
  );
}

const { root: API_ROOT, source: API_SOURCE } = resolveApiRoot();

const buildApiUrl = (path: string) => {
  const clean = path.replace(/^\//, "");
  return `${API_ROOT}/api/${clean}`;
};

const authHeaders = () => {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token
      ? { Authorization: `Bearer ${token.replace(/^"(.+)"$/, "$1")}` }
      : {};
  } catch {
    return {};
  }
};

async function apiFetch(path: string, init?: RequestInit) {
  const url = buildApiUrl(path);

  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      ...init,
      headers: {
        Accept: "application/json",
        ...authHeaders(),
        ...(init?.headers || {}),
      },
    });
  } catch (err: any) {
    const hint =
      API_SOURCE === "dev-fallback"
        ? "تستخدم نفس الدومين محليًا (dev-fallback)."
        : "تحقق من NEXT_PUBLIC_API_URL أو CORS على Laravel.";
    throw new Error(
      `تعذر الاتصال بالخادم: ${url}\n${hint}\nالتفاصيل: ${err?.message || err}`
    );
  }

  if (res.status === 401)
    throw new Error("غير مصرح: يرجى تسجيل الدخول (رمز مفقود أو منتهي).");

  if (res.status === 404) {
    const body = await res.text().catch(() => "");
    const isNext404 = /The page could not be found/i.test(body);
    const advice = isNext404
      ? `الطلب وصل إلى Next.js بدل Laravel.
- يجب ضبط NEXT_PUBLIC_API_URL ليشير إلى جذر Laravel (بدون /api).
- لاحظ أن الكود يضيف /api تلقائيًا.`
      : "تحقق من مسار Laravel (route) أو البارامترات.";
    throw new Error(`تعذر جلب البيانات (404) من: ${url}\n${advice}\n${body}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`فشل الطلب (${res.status}). ${body}`);
  }

  return res;
}

/** ===== Types (Laravel) ===== */
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
};

type Paginator<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
  next_page_url?: string | null;
  prev_page_url?: string | null;
  path?: string;
  links?: any[];
};

type ShowCarApiResponse = {
  status?: string;
  data?: {
    car?: CarFromApi;
    active_auction?: any;
    total_bids?: number;
  };
  car?: CarFromApi;
};

type UiCar = {
  id: number;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  transmission: string;
  status: "معلن" | "محجوز" | "مباع" | "ملغي" | "غير معروف";
  addedDate: string;
  views: number;
  inquiries: number;
};

/** ===== Helpers & Mappers ===== */
const toNumberSafe = (v?: string | number | null) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const cleaned = String(v).replace(/\s/g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

const mapStatusToArabic = (s?: string): UiCar["status"] => {
  const raw = (s || "").trim();
  const v = raw.toLowerCase();

  // لو الباك بيرجع عربي أصلاً
  if (["معلن", "محجوز", "مباع", "ملغي"].includes(raw as any)) {
    return raw as UiCar["status"];
  }

  if (["available", "active", "published"].includes(v)) return "معلن";
  if (["scheduled", "reserved", "pending"].includes(v)) return "محجوز";
  if (["sold", "completed"].includes(v)) return "مباع";
  if (["cancelled", "canceled", "cancel"].includes(v)) return "ملغي";

  return "غير معروف";
};

const mapTransmissionLabel = (t?: string) => {
  const v = (t || "").toLowerCase();
  if (v === "automatic") return "أوتوماتيك";
  if (v === "manual") return "عادي";
  if (v === "cvt") return "CVT";
  return "";
};

const statuses = ["معلن", "محجوز", "مباع"] as const;

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

const uiStatusToBackend = (ui: string) => {
  // عدّل هنا لو قيم الباك مختلفة
  if (ui === "معلن") return "available";
  if (ui === "محجوز") return "scheduled";
  if (ui === "مباع") return "sold";
  return "";
};

function isPaginator(obj: any): obj is Paginator<any> {
  return (
    !!obj &&
    typeof obj === "object" &&
    typeof obj.current_page === "number" &&
    Array.isArray(obj.data) &&
    typeof obj.last_page === "number" &&
    typeof obj.total === "number"
  );
}

function pickCarsPaginator(json: any): Paginator<CarFromApi> | null {
  // unwrapped paginator
  if (isPaginator(json)) return json;

  // wrapped {status, data: paginator}
  if (isPaginator(json?.data)) return json.data;

  // fallback: {success:true, data:paginator}
  if (json?.success && isPaginator(json?.data)) return json.data;

  return null;
}

function pickShowCar(json: any): CarFromApi | null {
  // {status, data:{car}}
  if (json?.data?.car && typeof json.data.car === "object") return json.data.car;

  // {car: {...}}
  if (json?.car && typeof json.car === "object") return json.car;

  // {data:{...car}}
  if (json?.data?.id) return json.data as CarFromApi;

  // {...car}
  if (json?.id) return json as CarFromApi;

  return null;
}

function resolveMediaUrl(src: string) {
  const s = (src || "").trim();
  if (!s) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return `${API_ROOT}${s}`;
  return `${API_ROOT}/${s}`;
}

/** ===== Small UI primitives ===== */
const Panel = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-card rounded-2xl shadow-lg border border-border ${className}`}>
    {children}
  </div>
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

/** ===== UI Modals ===== */
function Backdrop({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        className="w-full max-w-3xl relative"
        initial={{ scale: 0.97, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Panel className="p-5">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            aria-label="إغلاق"
          >
            <FiX size={20} />
          </button>
          {children}
        </Panel>
      </motion.div>
    </motion.div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/30 p-3 rounded-lg border border-border">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground text-sm">{value || "—"}</p>
    </div>
  );
}

function ViewCarModal({
  open,
  onClose,
  car,
}: {
  open: boolean;
  onClose: () => void;
  car: CarFromApi | null;
}) {
  return (
    <AnimatePresence>
      {open && (
        <Backdrop onClose={onClose}>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
            تفاصيل السيارة
          </h2>

          {!car ? (
            <div className="text-muted-foreground text-sm">جاري التحميل...</div>
          ) : (
            <div className="space-y-4 text-foreground">
              <div className="grid grid-cols-2 gap-3">
                <Info label="الماركة" value={car.make} />
                <Info label="الموديل" value={car.model} />
                <Info label="سنة الصنع" value={String(car.year)} />
                <Info label="VIN" value={car.vin} />
                <Info label="الممشى (كم)" value={String(car.odometer ?? "")} />
                <Info label="الحالة" value={mapStatusToArabic(car.auction_status)} />
                <Info
                  label="القير"
                  value={mapTransmissionLabel(car.transmission ?? "") || "—"}
                />
                <Info label="المحرك" value={car.engine ?? "—"} />
                <Info
                  label="السعر التقييمي"
                  value={`${toNumberSafe(car.evaluation_price).toLocaleString()} ر.س`}
                />
                <Info label="اللون" value={car.color ?? "—"} />
                <Info label="اللوحة" value={car.plate ?? "—"} />
                <Info label="المنطقة" value={car.province ?? "—"} />
                <Info label="المدينة" value={car.city ?? "—"} />
                <Info label="فئة السوق" value={car.market_category ?? "—"} />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">الوصف</p>
                <p className="bg-secondary rounded-lg p-3 whitespace-pre-wrap text-foreground text-sm border border-border">
                  {car.description || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">الصور</p>
                {Array.isArray(car.images) && car.images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {car.images.map((src, i) => (
                      <img
                        key={`img-${i}-${src}`}
                        src={resolveMediaUrl(src)}
                        alt={`image-${i}`}
                        className="w-full h-24 object-cover rounded-lg border border-border"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">لا توجد صور</div>
                )}
              </div>
            </div>
          )}
        </Backdrop>
      )}
    </AnimatePresence>
  );
}

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">{label}</label>
      {children}
      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.55rem 0.8rem;
          border: 1px solid hsl(var(--border));
          border-radius: 0.75rem;
          outline: none;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-size: 0.9rem;
        }
        .input::placeholder {
          color: hsl(var(--muted-foreground));
        }
        .input:focus {
          border-color: hsl(var(--primary));
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.2);
        }
        select.input option {
          color: hsl(var(--foreground));
          background: hsl(var(--background));
        }
      `}</style>
    </div>
  );
}

function EditCarModal({
  open,
  onClose,
  car,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  car: CarFromApi | null;
  onSaved: (updated: CarFromApi) => void;
}) {
  const [form, setForm] = useState<EditFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && car) {
      setForm({
        make: car.make || "",
        model: car.model || "",
        year: String(car.year || ""),
        odometer: String(car.odometer ?? ""),
        evaluation_price: String(car.evaluation_price ?? ""),
        color: car.color ?? "",
        engine: car.engine ?? "",
        transmission: (car.transmission || "").toLowerCase(),
        description: car.description ?? "",
        province: car.province ?? "",
        city: car.city ?? "",
        plate: car.plate ?? "",
        min_price: String(car.min_price ?? ""),
        max_price: String(car.max_price ?? ""),
        condition: (car.condition || "").toLowerCase(),
        market_category: car.market_category ?? "",
      });
      setError(null);
    }
  }, [open, car]);

  const updateField = (name: keyof EditFormState, value: string) => {
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const submit = async () => {
    if (!car || !form) return;
    setSaving(true);
    setError(null);

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
          else if (["evaluation_price", "min_price", "max_price"].includes(k))
            payload[k] = toNumberSafe(v);
          else payload[k] = v;
        }
      });

      const res = await apiFetch(`cars/${car.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({}));
      const updated = pickShowCar(j) ?? pickShowCar(j?.data) ?? null;

      if (!updated) throw new Error("تعذر قراءة استجابة التعديل من السيرفر.");

      onSaved(updated);
      onClose();
    } catch (e: any) {
      setError(e?.message || "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Backdrop onClose={onClose}>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
            تعديل السيارة
          </h2>

          {!form ? (
            <div className="text-muted-foreground text-sm">جارى التحميل...</div>
          ) : (
            <>
              {error && (
                <div className="mb-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-3 whitespace-pre-wrap text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="الماركة">
                  <input
                    className="input"
                    value={form.make}
                    onChange={(e) => updateField("make", e.target.value)}
                  />
                </Field>
                <Field label="الموديل">
                  <input
                    className="input"
                    value={form.model}
                    onChange={(e) => updateField("model", e.target.value)}
                  />
                </Field>
                <Field label="سنة الصنع">
                  <input
                    type="number"
                    className="input"
                    value={form.year}
                    onChange={(e) => updateField("year", e.target.value)}
                  />
                </Field>
                <Field label="الممشى (كم)">
                  <input
                    type="number"
                    className="input"
                    value={form.odometer}
                    onChange={(e) => updateField("odometer", e.target.value)}
                  />
                </Field>
                <Field label="السعر التقييمي (ر.س)">
                  <input
                    type="text"
                    className="input"
                    value={form.evaluation_price}
                    onChange={(e) =>
                      updateField("evaluation_price", e.target.value)
                    }
                  />
                </Field>
                <Field label="اللون">
                  <input
                    className="input"
                    value={form.color}
                    onChange={(e) => updateField("color", e.target.value)}
                  />
                </Field>
                <Field label="المحرك">
                  <input
                    className="input"
                    value={form.engine}
                    onChange={(e) => updateField("engine", e.target.value)}
                  />
                </Field>
                <Field label="القير">
                  <select
                    className="input"
                    value={form.transmission}
                    onChange={(e) => updateField("transmission", e.target.value)}
                  >
                    <option value="">اختر</option>
                    {transmissionOptions.map((o) => (
                      <option key={`tr-${o.value}`} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="الحالة الفنية">
                  <select
                    className="input"
                    value={form.condition}
                    onChange={(e) => updateField("condition", e.target.value)}
                  >
                    <option value="">اختر</option>
                    {conditionOptions.map((o) => (
                      <option key={`cond-${o.value}`} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="المنطقة">
                  <input
                    className="input"
                    value={form.province}
                    onChange={(e) => updateField("province", e.target.value)}
                  />
                </Field>
                <Field label="المدينة">
                  <input
                    className="input"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                </Field>
                <Field label="رقم اللوحة">
                  <input
                    className="input"
                    value={form.plate}
                    onChange={(e) => updateField("plate", e.target.value)}
                  />
                </Field>
                <Field label="أقل سعر (ر.س)">
                  <input
                    type="text"
                    className="input"
                    value={form.min_price}
                    onChange={(e) => updateField("min_price", e.target.value)}
                  />
                </Field>
                <Field label="أعلى سعر (ر.س)">
                  <input
                    type="text"
                    className="input"
                    value={form.max_price}
                    onChange={(e) => updateField("max_price", e.target.value)}
                  />
                </Field>

                <div className="md:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">
                    الوصف
                  </label>
                  <textarea
                    className="input h-24"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <SubtleBtn onClick={onClose}>إلغاء</SubtleBtn>
                <PrimaryBtn onClick={submit} disabled={saving}>
                  {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                </PrimaryBtn>
              </div>
            </>
          )}
        </Backdrop>
      )}
    </AnimatePresence>
  );
}

function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <AnimatePresence>
      {open && (
        <Backdrop onClose={onClose}>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
            حذف السيارة
          </h2>
          <p className="text-muted-foreground text-sm">
            هل أنت متأكد من حذف هذه السيارة؟ هذا الإجراء لا يمكن التراجع عنه.
          </p>
          {error && (
            <div className="mt-3 bg-rose-500/10 border border-rose-700 text-rose-300 rounded-xl p-3 whitespace-pre-wrap text-sm">
              {error}
            </div>
          )}
          <div className="mt-5 flex justify-end gap-3">
            <SubtleBtn onClick={onClose}>إلغاء</SubtleBtn>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "جارٍ الحذف..." : "تأكيد الحذف"}
            </button>
          </div>
        </Backdrop>
      )}
    </AnimatePresence>
  );
}

/** ===== Filter Panel ===== */
type Filters = {
  status: string;
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
      <button
        onClick={onClear}
        className="hover:text-primary/80"
        aria-label="إزالة"
      >
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
  const activeChips = useMemo(() => {
    const chips: { key: keyof Filters; label: string }[] = [];
    if (filters.status)
      chips.push({ key: "status", label: `الحالة: ${filters.status}` });
    if (filters.brand)
      chips.push({ key: "brand", label: `العلامة: ${filters.brand}` });
    if (filters.minPrice)
      chips.push({
        key: "minPrice",
        label: `≥ ${Number(filters.minPrice).toLocaleString()} ر.س`,
      });
    if (filters.maxPrice)
      chips.push({
        key: "maxPrice",
        label: `≤ ${Number(filters.maxPrice).toLocaleString()} ر.س`,
      });
    if (filters.yearFrom)
      chips.push({ key: "yearFrom", label: `من سنة ${filters.yearFrom}` });
    if (filters.yearTo)
      chips.push({ key: "yearTo", label: `إلى سنة ${filters.yearTo}` });
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
            <FilterChip
              key={`chip-${c.key}-${i}`}
              label={c.label}
              onClear={() => handle(c.key, "")}
            />
          ))}
          <button
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground underline decoration-dotted"
          >
            مسح الكل
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div>
          <p className="block text-xs text-muted-foreground mb-2">حالة الإعلان</p>
          <div className="flex flex-wrap gap-2">
            {(["", ...statuses] as string[]).map((s) => {
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
          <label className="block text-xs text-muted-foreground mb-2">
            العلامة التجارية
          </label>
          <select
            value={filters.brand}
            onChange={(e) => handle("brand", e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-background text-foreground border border-border focus:border-primary focus:ring-4 focus:ring-primary/20 text-sm"
          >
            <option value="">الكل</option>
            {brands.map((b) => (
              <option key={`brand-${b}`} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-2">السعر من</label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground">
              <FiDollarSign />
            </span>
            <input
              type="number"
              className="w-full pr-10 pl-4 py-2 rounded-xl bg-background text-foreground border border-border focus:border-primary focus:ring-4 focus:ring-primary/20 text-sm"
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
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground">
              <FiDollarSign />
            </span>
            <input
              type="number"
              className="w-full pr-10 pl-4 py-2 rounded-xl bg-background text-foreground border border-border focus:border-primary focus:ring-4 focus:ring-primary/20 text-sm"
              placeholder="أعلى سعر"
              value={filters.maxPrice}
              onChange={(e) => handle("maxPrice", e.target.value)}
              min={0}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-2">
            سنة الصنع من
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground">
              <FiCalendar />
            </span>
            <input
              type="number"
              className="w-full pr-10 pl-4 py-2 rounded-xl bg-background text-foreground border border-border focus:border-primary focus:ring-4 focus:ring-primary/20 text-sm"
              placeholder="أقدم سنة"
              value={filters.yearFrom}
              onChange={(e) => handle("yearFrom", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-2">
            سنة الصنع إلى
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground">
              <FiCalendar />
            </span>
            <input
              type="number"
              className="w-full pr-10 pl-4 py-2 rounded-xl bg-background text-foreground border border-border focus:border-primary focus:ring-4 focus:ring-primary/20 text-sm"
              placeholder="أحدث سنة"
              value={filters.yearTo}
              onChange={(e) => handle("yearTo", e.target.value)}
            />
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
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <motion.div
              className="absolute inset-y-0 right-0 w-full max-w-md p-3"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Panel className="p-5 h-full overflow-y-auto rounded-l-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-foreground">الفلاتر</h3>
                  <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                {body}

                <div className="sticky bottom-0 bg-card/80 backdrop-blur pt-3 border-t border-border mt-6">
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

      {/* Desktop Floating Card */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Panel className="p-5 mb-6 hidden md:block">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-foreground">الفلاتر المتقدمة</h3>
                <div className="flex items-center gap-2">
                  {activeChips.slice(0, 4).map((c, i) => (
                    <FilterChip
                      key={`chip-head-${c.key}-${i}`}
                      label={c.label}
                      onClear={() => handle(c.key, "")}
                    />
                  ))}
                  {activeChips.length > 4 && (
                    <span className="text-xs text-muted-foreground">
                      +{activeChips.length - 4}
                    </span>
                  )}
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

/** ===== Main Component ===== */
export default function ExhibitorCars() {
  const router = useRouter();

  const [cars, setCars] = useState<UiCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [sortKey, setSortKey] = useState<"latest" | "oldest" | "price_desc" | "price_asc">("latest");

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    status: "",
    brand: "",
    minPrice: "",
    maxPrice: "",
    yearFrom: "",
    yearTo: "",
  });

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedCarData, setSelectedCarData] = useState<CarFromApi | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // لتجنب duplicate fetch عند setState + fetch يدوي
  const [reloadKey, setReloadKey] = useState(0);

  // لتجاهل نتائج الطلبات القديمة (race condition)
  const reqSeqRef = useRef(0);

  const fetchCars = async (page: number) => {
    const seq = ++reqSeqRef.current;

    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", String(perPage)); // لو الباك بيتجاهله مفيش مشكلة

      // sort
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

      // server-side filters (لو الباك يدعمها هتشتغل، لو لا غالباً هيتجاهلها)
      if (filters.status) {
        const backendStatus = uiStatusToBackend(filters.status);
        if (backendStatus) params.set("auction_status", backendStatus);
      }
      if (filters.brand) params.set("make", filters.brand);

      if (filters.minPrice) params.set("min_price", filters.minPrice);
      if (filters.maxPrice) params.set("max_price", filters.maxPrice);
      if (filters.yearFrom) params.set("year_from", filters.yearFrom);
      if (filters.yearTo) params.set("year_to", filters.yearTo);

      const trimmedSearch = searchTerm.trim();
      if (trimmedSearch) params.set("search", trimmedSearch);

      const res = await apiFetch(`cars?${params.toString()}`);
      const json = await res.json().catch(() => ({}));

      const paginator = pickCarsPaginator(json);
      if (!paginator) {
        throw new Error("شكل استجابة /cars غير متوقع (Paginator غير موجود).");
      }

      const mapped: UiCar[] = (paginator.data || []).map((c) => ({
        id: c.id,
        title: `${c.make ?? ""} ${c.model ?? ""}`.trim(),
        brand: c.make ?? "",
        model: c.model ?? "",
        year: c.year ?? 0,
        price: toNumberSafe(c.evaluation_price),
        mileage: c.odometer ?? 0,
        transmission: mapTransmissionLabel(c.transmission ?? ""),
        status: mapStatusToArabic(c.auction_status),
        addedDate: c.created_at?.slice(0, 10) ?? "",
        views: 0,
        inquiries: 0,
      }));

      // تجاهل لو فيه طلب أحدث خلّص بعده
      if (seq !== reqSeqRef.current) return;

      setCars(mapped);
      setCurrentPage(paginator.current_page || 1);
      setLastPage(paginator.last_page || 1);
      setTotal(paginator.total || 0);
      setPerPage(paginator.per_page || perPage);
    } catch (err: any) {
      if (seq !== reqSeqRef.current) return;

      setErrorMsg(err?.message || "حدث خطأ غير متوقع أثناء جلب البيانات.");
      setCars([]);
      setCurrentPage(1);
      setLastPage(1);
      setTotal(0);
    } finally {
      if (seq !== reqSeqRef.current) return;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKey, currentPage, reloadKey]);

  const filteredCars = useMemo(() => {
    // فلترة محلية إضافية (عشان لو الباك مش داعم كل params)
    let results = [...cars];

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

    return results;
  }, [cars, filters, searchTerm]);

  const brands = useMemo(
    () => Array.from(new Set(cars.map((c) => c.brand).filter(Boolean))).sort(),
    [cars]
  );

  const activeFilterCount = useMemo(() => {
    const countFilters = Object.values(filters).filter(Boolean).length;
    const countSearch = searchTerm.trim() ? 1 : 0;
    return countFilters + countSearch;
  }, [filters, searchTerm]);

  const resetFilters = () => {
    setFilters({
      status: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      yearFrom: "",
      yearTo: "",
    });
    setSearchTerm("");
  };

  const goToAddCar = () => router.push("/exhibitor/add-car");

  /** ===== Actions ===== */
  const openView = async (id: number) => {
    setSelectedId(id);
    setViewOpen(true);
    setSelectedCarData(null);
    setActionError(null);

    try {
      const res = await apiFetch(`cars/${id}`);
      const j: ShowCarApiResponse = await res.json().catch(() => ({} as any));
      const car = pickShowCar(j);
      if (!car) throw new Error("تعذر قراءة تفاصيل السيارة من الاستجابة.");
      setSelectedCarData(car);
    } catch (e: any) {
      setActionError(e?.message || "تعذر تحميل تفاصيل السيارة.");
    }
  };

  const openEdit = async (id: number) => {
    setSelectedId(id);
    setEditOpen(true);
    setSelectedCarData(null);
    setActionError(null);

    try {
      const res = await apiFetch(`cars/${id}`);
      const j: ShowCarApiResponse = await res.json().catch(() => ({} as any));
      const car = pickShowCar(j);
      if (!car) throw new Error("تعذر قراءة بيانات التعديل من الاستجابة.");
      setSelectedCarData(car);
    } catch (e: any) {
      setActionError(e?.message || "تعذر تحميل بيانات التعديل.");
    }
  };

  const openDelete = (id: number) => {
    setSelectedId(id);
    setDeleteOpen(true);
    setActionError(null);
  };

  const handleSaved = (updated: CarFromApi) => {
    setCars((prev) =>
      prev.map((c) =>
        c.id === updated.id
          ? {
              ...c,
              title: `${updated.make ?? ""} ${updated.model ?? ""}`.trim(),
              brand: updated.make ?? "",
              model: updated.model ?? "",
              year: updated.year ?? 0,
              price: toNumberSafe(updated.evaluation_price),
              mileage: updated.odometer ?? 0,
              transmission: mapTransmissionLabel(updated.transmission ?? ""),
              status: mapStatusToArabic(updated.auction_status),
              addedDate: updated.created_at?.slice(0, 10) ?? "",
            }
          : c
      )
    );
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    setActionError(null);

    try {
      await apiFetch(`cars/${selectedId}`, { method: "DELETE" });
      setDeleteOpen(false);

      // أعد التحميل لضمان التزامن مع الباك + pagination
      // (خصوصًا لو الصفحة فضيت بعد الحذف)
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setActionError(e?.message || "حدث خطأ أثناء الحذف.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div dir="rtl" className="bg-background py-7 px-4 sm:px-6 lg:px-8">
      {/* Modals */}
      <ViewCarModal open={viewOpen} onClose={() => setViewOpen(false)} car={selectedCarData} />
      <EditCarModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        car={selectedCarData}
        onSaved={handleSaved}
      />
      <DeleteConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        loading={actionLoading}
        error={actionError}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header + Search */}
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
            <PrimaryBtn
              onClick={goToAddCar}
              aria-label="إضافة سيارة جديدة"
              className="inline-flex items-center gap-2"
            >
              <FiPlus className="ml-1" size={16} />
              <span>إضافة سيارة جديدة</span>
            </PrimaryBtn>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <motion.div className="relative flex-grow" whileHover={{ scale: 1.003 }}>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FiSearch className="text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="ابحث عن سيارة (ماركة أو موديل أو سنة)"
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-background text-foreground placeholder-muted-foreground border border-border focus:border-primary focus:ring-4 focus:ring-primary/20 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setCurrentPage(1);
                    setReloadKey((k) => k + 1);
                  }
                }}
              />
            </motion.div>

            <SubtleBtn
              onClick={() => {
                setReloadKey((k) => k + 1);
              }}
            >
              تحديث
            </SubtleBtn>

            <button
              onClick={() => setShowFilters(true)}
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

        {/* Error */}
        {errorMsg && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 whitespace-pre-wrap text-sm">
            {errorMsg}
          </div>
        )}

        {/* Filters Panel */}
        <FilterPanel
          open={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          setFilters={setFilters}
          brands={brands}
          onApply={() => {
            setShowFilters(false);
            setCurrentPage(1);
            setReloadKey((k) => k + 1);
          }}
          onReset={() => {
            resetFilters();
            setShowFilters(false);
            setCurrentPage(1);
            setReloadKey((k) => k + 1);
          }}
        />

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-7">
          <StatCard title="إجمالي الصفحة الحالية" color="indigo" value={filteredCars.length} />
          <StatCard
            title="معلن"
            color="green"
            value={filteredCars.filter((c) => c.status === "معلن").length}
          />
          <StatCard
            title="محجوز"
            color="yellow"
            value={filteredCars.filter((c) => c.status === "محجوز").length}
          />
          <StatCard
            title="مباع"
            color="red"
            value={filteredCars.filter((c) => c.status === "مباع").length}
          />
        </div>

        {/* Toolbar */}
        <div className="mb-5 flex justify-between items-center">
          <div className="text-muted-foreground text-sm">
            <span className="font-medium text-foreground tabular-nums">{total}</span> إجمالي السيارات
          </div>

          <div className="flex items-center">
            <span className="text-muted-foreground mr-2 text-sm">ترتيب حسب:</span>
            <select
              className="px-3 py-2 rounded-xl bg-background text-foreground border border-border focus:border-primary focus:ring-4 focus:ring-primary/20 text-sm"
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
            </select>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && <SkeletonTable />}

        {/* No results */}
        {!loading && filteredCars.length === 0 && (
          <Panel className="p-10 text-center">
            <div className="text-muted-foreground mb-3">
              <FiSearch size={40} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">لا توجد سيارات متطابقة</h3>
            <p className="text-muted-foreground text-sm mb-5">عدّل الفلاتر أو أعد البحث.</p>
            <PrimaryBtn
              onClick={() => {
                resetFilters();
                setCurrentPage(1);
                setReloadKey((k) => k + 1);
              }}
            >
              عرض جميع السيارات
            </PrimaryBtn>
          </Panel>
        )}

        {/* Table */}
        {!loading && filteredCars.length > 0 && (
          <Panel className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <Th>السيارة</Th>
                    <Th>السعر</Th>
                    <Th>الحالة</Th>
                    <Th>المشاهدات</Th>
                    <Th>الاستفسارات</Th>
                    <Th>الإجراءات</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCars.map((car, index) => (
                    <motion.tr
                      key={`car-${car.id}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                            <FaCar className="text-primary" size={16} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-foreground">{car.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {car.year} •{" "}
                              {Number.isFinite(car.mileage) ? car.mileage.toLocaleString() : 0} كم
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
                        <span
                          className={`px-2 py-1 inline-flex text-[11px] leading-5 font-semibold rounded-full ${
                            car.status === "معلن"
                              ? "bg-green-500/15 text-green-600 border border-green-600/30 dark:text-green-300"
                              : car.status === "محجوز"
                              ? "bg-amber-500/15 text-amber-600 border border-amber-600/30 dark:text-amber-200"
                              : car.status === "مباع"
                              ? "bg-rose-500/15 text-rose-600 border border-rose-600/30 dark:text-rose-300"
                              : "bg-gray-500/15 text-gray-600 border border-gray-600/30 dark:text-gray-300"
                          }`}
                        >
                          {car.status}
                        </span>
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
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="عرض"
                          >
                            <FiEye size={18} />
                          </button>
                          <button
                            onClick={() => openEdit(car.id)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="تعديل"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => openDelete(car.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="حذف"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: "indigo" | "green" | "yellow" | "red";
}) {
  const colorClasses = {
    indigo: "from-indigo-500 to-violet-500",
    green: "from-emerald-500 to-green-500",
    yellow: "from-amber-400 to-orange-400",
    red: "from-rose-500 to-red-500",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-5 shadow-sm">
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${colorClasses[color]}`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{title}</p>
          <div className="text-2xl font-bold text-foreground">{value}</div>
        </div>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorClasses[color]} opacity-10`}>
          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${colorClasses[color]}`} />
        </div>
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <Panel className="p-5">
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted/50 rounded-lg" />
        ))}
      </div>
    </Panel>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
    {children}
  </th>
);
