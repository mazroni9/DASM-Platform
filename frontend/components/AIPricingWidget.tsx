"use client";
import { useState } from "react";
import { Sparkles, AlertTriangle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AIPricingWidgetProps {
  prefill?: {
    make?: string;
    model?: string;
    year?: number;
    mileage?: number;
    condition?: string;
    city?: string;
  };
  mode?: "auto" | "manual";
}

interface PricingResult {
  estimated_price: number;
  price_min: number;
  price_max: number;
  reasoning: string;
  confidence: "high" | "medium" | "low";
}

const CONFIDENCE_LABELS: Record<string, { label: string; color: string }> = {
  high:   { label: "عالية",   color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
  medium: { label: "متوسطة", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  low:    { label: "منخفضة", color: "text-red-500 bg-red-50 dark:bg-red-950/30" },
};

const CITIES = ["Riyadh", "Jeddah", "Makkah", "Madinah", "Dammam", "Khobar"];

export default function AIPricingWidget({ prefill, mode = "auto" }: AIPricingWidgetProps) {
  const [isOpen, setIsOpen]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<PricingResult | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [city, setCity]         = useState(prefill?.city || "Riyadh");
  const [form, setForm] = useState({
    make:      prefill?.make      || "",
    model:     prefill?.model     || "",
    year:      prefill?.year?.toString()     || "",
    mileage:   prefill?.mileage?.toString()  || "",
    condition: prefill?.condition || "good",
  });

  const handleEstimate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        "https://lobster-app-ba3dk.ondigitalocean.app/api/v1/pricing/estimate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            make:      mode === "auto" ? prefill?.make      : form.make,
            model:     mode === "auto" ? prefill?.model     : form.model,
            year:      mode === "auto" ? prefill?.year      : parseInt(form.year, 10),
            mileage:   mode === "auto" ? prefill?.mileage   : parseInt(form.mileage, 10),
            condition: mode === "auto" ? (prefill?.condition || "good") : form.condition,
            city,
          }),
        }
      );
      if (!res.ok) throw new Error("server_error");
      const data: PricingResult = await res.json();
      setResult(data);
    } catch {
      setError("تعذر الحصول على التسعير، حاول مجدداً.");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString("ar-SA") + " ر.س";

  return (
    <div className="rounded-2xl border border-purple-200 dark:border-purple-800/40 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/10 overflow-hidden shadow-sm" dir="rtl">

      {/* ── Header ── */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-right"
      >
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 dark:bg-purple-900/40 p-2.5 rounded-xl">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="font-bold text-foreground text-base">
              التسعير الاسترشادي بالذكاء الاصطناعي
            </p>
            <p className="text-xs text-foreground/50 mt-0.5">
              تقدير غير ملزم · مدعوم بنموذج Groq
            </p>
          </div>
        </div>
        {isOpen
          ? <ChevronUp   className="w-5 h-5 text-foreground/40" />
          : <ChevronDown className="w-5 h-5 text-foreground/40" />
        }
      </button>

      {/* ── Body ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">

              {/* تنبيه استرشادي */}
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  هذا التسعير <strong>استرشادي فقط</strong> ويُقدَّم بواسطة الذكاء الاصطناعي
                  بناءً على بيانات السوق السعودي. لا يُعدّ سعراً نهائياً أو ملزماً.
                </p>
              </div>

              {/* حقول يدوية - وضع الداشبورد */}
              {mode === "manual" && (
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["make",    "الماركة",       "Toyota", "text"],
                    ["model",   "الموديل",       "Camry",  "text"],
                    ["year",    "السنة",          "2022",  "number"],
                    ["mileage", "الممشى (كم)",   "45000", "number"],
                  ] as const).map(([key, label, placeholder, type]) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-foreground/60 mb-1 block">{label}</label>
                      <input
                        type={type}
                        value={form[key]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-medium text-foreground/60 mb-1 block">الحالة</label>
                    <select
                      value={form.condition}
                      onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="excellent">ممتازة</option>
                      <option value="good">جيدة</option>
                      <option value="fair">مقبولة</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground/60 mb-1 block">المدينة</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* بيانات تلقائية - وضع تفاصيل السيارة */}
              {mode === "auto" && prefill && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {([
                    ["الماركة",  prefill.make],
                    ["الموديل",  prefill.model],
                    ["السنة",    prefill.year],
                    ["الممشى",   prefill.mileage ? `${prefill.mileage.toLocaleString()} كم` : "—"],
                    ["الحالة",   prefill.condition],
                    ["المدينة",  city],
                  ] as [string, string | number | undefined][]).map(([label, val]) => (
                    <div key={label} className="bg-white/60 dark:bg-white/5 rounded-lg p-2">
                      <p className="text-foreground/40">{label}</p>
                      <p className="font-bold text-foreground">{val ?? "—"}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* اختيار المدينة - وضع auto */}
              {mode === "auto" && (
                <div>
                  <label className="text-xs font-medium text-foreground/60 mb-1 block">المدينة</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {/* زر الحصول على التسعير */}
              <button
                type="button"
                onClick={handleEstimate}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/20"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> جاري التقدير...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> احصل على التسعير الاسترشادي</>
                )}
              </button>

              {error && <p className="text-center text-sm text-red-500">{error}</p>}

              {/* النتيجة */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-card rounded-2xl border border-border/60 p-5 space-y-4"
                >
                  <div className="text-center">
                    <p className="text-xs text-foreground/50 mb-1">السعر التقديري الاسترشادي</p>
                    <p className="text-4xl font-extrabold text-purple-600">{fmt(result.estimated_price)}</p>
                    <span className={`mt-2 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${CONFIDENCE_LABELS[result.confidence]?.color}`}>
                      دقة التقدير: {CONFIDENCE_LABELS[result.confidence]?.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-foreground/50 mb-1">أدنى تقدير</p>
                      <p className="font-bold text-green-700 dark:text-green-400">{fmt(result.price_min)}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-foreground/50 mb-1">أعلى تقدير</p>
                      <p className="font-bold text-orange-700 dark:text-orange-400">{fmt(result.price_max)}</p>
                    </div>
                  </div>
                  <div className="border-t border-border/60 pt-4">
                    <p className="text-xs text-foreground/50 mb-2 text-right">المبررات</p>
                    <p className="text-sm text-foreground/80 leading-relaxed text-right whitespace-pre-wrap">
                      {result.reasoning}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
