/**
 * 📝 نموذج إدخال بيانات السيارة
 * 📁 المسار: frontend/components/dashboard/CarDataEntryForm.tsx
 *
 * ✅ نقاط مهمة:
 * - تحويل أي label كائن {ar,en} إلى نص آمن قبل العرض
 * - منع 404 باستخدام apiPath()
 * - إزالة سوق الحكومة + فصل الشاحنات/الحافلات
 */

"use client";

import { useState, useRef, FormEvent, ChangeEvent, useEffect } from "react";
import { Upload, FileX, Car, CheckCircle2, AlertCircle } from "lucide-react";
import carsData from "@/components/shared/cars_syarah.en.json";
import api from "@/lib/axios";
import toast from "react-hot-toast";

/* ---------------- helpers ---------------- */

const apiPath = (p: string) => {
  try {
    const base = (api as any)?.defaults?.baseURL ?? "";
    if (p.startsWith("/api/")) return p;
    if (String(base).endsWith("/api")) return p.startsWith("/") ? p : `/${p}`;
    return p.startsWith("/") ? `/api${p}` : `/api/${p}`;
  } catch {
    return p.startsWith("/") ? `/api${p}` : `/api/${p}`;
  }
};

const emirates = [
  "منطقة الرياض","منطقة مكة المكرمة","منطقة المدينة المنورة","المنطقة الشرقية","منطقة القصيم",
  "منطقة عسير","منطقة حائل","منطقة تبوك","منطقة الباحة","منطقة الحدود الشمالية",
  "منطقة الجوف","منطقة جازان","منطقة نجران",
];

const carColors = [
  { name: "أسود", value: "black" },{ name: "أبيض", value: "white" },{ name: "أحمر", value: "red" },
  { name: "أخضر", value: "green" },{ name: "أزرق", value: "blue" },{ name: "أصفر", value: "yellow" },
  { name: "برتقالي", value: "orange" },{ name: "أرجواني", value: "purple" },{ name: "وردي", value: "pink" },
  { name: "بني", value: "brown" },{ name: "رمادي", value: "gray" },{ name: "سماوي", value: "cyan" },
  { name: "أرجواني فاتح", value: "magenta" },{ name: "ليموني", value: "lime" },{ name: "أخضر مزرق", value: "teal" },
  { name: "كحلي", value: "navy" },{ name: "خمري", value: "maroon" },{ name: "زيتي", value: "olive" },
  { name: "ذهبي", value: "gold" },{ name: "فضي", value: "silver" },{ name: "أبيض لؤلؤي", value: "Pearl White" },
  { name: "أسود معدني", value: "Metallic Black" },{ name: "فضي معدني", value: "Silver Metallic" },
  { name: "رمادي جرافيت", value: "Graphite Gray" },{ name: "أزرق داكن", value: "Deep Blue" },
  { name: "أحمر قاني", value: "Crimson Red" },{ name: "أحمر حلوى", value: "Candy Apple Red" },
  { name: "أخضر بريطاني سباق", value: "British Racing Green" },{ name: "رمادي ناردو", value: "Nardo Grey" },
  { name: "أخضر جرينتا مانتس", value: "Verde Mantis" },{ name: "أحمر هيلروت", value: "Hellrot" },
  { name: "ليلكي غامق", value: "Nightshade Purple" },{ name: "أزرق ليلى", value: "Lapis Blue" },
  { name: "أحمر روسّو كورسا", value: "Rosso Corsa" },{ name: "أصفر لامع", value: "Solar Yellow" },
  { name: "برتقالي لهب", value: "Flame Red (or Orange)" },{ name: "بيج شوكولاتة", value: "Champagne Beige" },
  { name: "أزرق رالي العالم", value: "World Rally Blue" },
];

interface CarFormData {
  make: string;
  model: string;
  year: string;
  vin: string;
  engine: string;
  odometer: string;
  color: string;
  transmission: string;
  condition: string;
  min_price: string;
  max_price: string;
  description: string;
  plate: string;
  agency_number: string;
  agency_issue_date: string;
  registration_card_image: string;
  city: string;
  province: string;
  market_category: string;
  main_auction_duration: string;

  // 🟦 حقول الكرفان
  usage: string;              // "سكني" / "تجاري" / "فخم" / "مخصص"
  year_built: string;         // سنة البناء
  length_m: string;           // الطول بالمتر
  width_m: string;            // العرض بالمتر
  weight_kg: string;          // الوزن
  capacity_persons: string;   // السعة (عدد الأشخاص)
  has_bathroom: string;       // "true" / "false"
  has_kitchen: string;        // "true" / "false"
  bedrooms_count: string;     // عدد غرف النوم
  solar_power_kw: string;     // قدرة الألواح
  license_required: string;   // "true" / "false"
}

const emptyCar: CarFormData = {
  make: "",
  model: "",
  year: "",
  vin: "",
  engine: "",
  odometer: "",
  color: "",
  transmission: "",
  condition: "",
  min_price: "",
  max_price: "",
  description: "",
  plate: "",
  agency_number: "",
  agency_issue_date: "",
  registration_card_image: "",
  city: "",
  province: "",
  market_category: "",
  main_auction_duration: "",

  // الكرفان
  usage: "",
  year_built: "",
  length_m: "",
  width_m: "",
  weight_kg: "",
  capacity_persons: "",
  has_bathroom: "",
  has_kitchen: "",
  bedrooms_count: "",
  solar_power_kw: "",
  license_required: "",
};

interface AiAnalysis {
  marketPrice: number;
  demandLevel: string;
  similarCars: number;
  priceSuggestion: number;
}

type Option = { value: string; label: string };

// ترجمات أسواق بدون حكومة + فصل buses/trucks
const MARKET_TRANSLATIONS: Record<string, any> = {
  luxuryCars: { ar: "سوق السيارات الفارهة", en: "Luxury Cars" },
  classic: { ar: "سوق السيارات الكلاسيكية", en: "Classic Cars" },
  caravan: { ar: "سوق الكرافانات", en: "Caravans" },
  trucks: { ar: "سوق الشاحنات", en: "Trucks" },
  buses: { ar: "سوق الحافلات", en: "Buses" },
  companiesCars: { ar: "سوق سيارات الشركات", en: "Company Cars" },
};

const pickLabel = (val: any, key?: string, translations?: Record<string, any>) => {
  // يحوّل أي قيمة إلى نص آمن للعرض
  if (val == null) {
    const t = key && translations ? translations[key] : undefined;
    if (t && typeof t === "object") return t.ar ?? t.en ?? key ?? "";
    if (typeof t === "string") return t;
    return key ?? "";
  }
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean")
    return String(val);
  if (typeof val === "object")
    return (
      val.ar ??
      val.en ??
      (key && translations
        ? translations[key]?.ar ?? translations[key]?.en ?? key
        : key ?? "")
    );
  return String(val);
};

const DEFAULT_MARKET_OPTIONS: Option[] = [
  "luxuryCars",
  "classic",
  "caravan",
  "trucks",
  "buses",
  "companiesCars",
].map((k) => ({
  value: k,
  label: pickLabel(MARKET_TRANSLATIONS[k], k, MARKET_TRANSLATIONS),
}));

const DEFAULT_CONDITION_OPTIONS: Option[] = [
  { value: "excellent", label: "ممتازة" },
  { value: "good", label: "جيدة" },
  { value: "fair", label: "متوسطة" },
  { value: "poor", label: "ضعيفة" },
];

const DEFAULT_TRANSMISSION_OPTIONS: Option[] = [
  { value: "automatic", label: "أوتوماتيك" },
  { value: "manual", label: "يدوي" },
  { value: "cvt", label: "نصف أوتوماتيك" },
];

const toOptions = (input: any, translations?: Record<string, any>): Option[] => {
  // يحول array/object إلى مصفوفة Options مع تحويل اللصيقات لنص
  try {
    if (Array.isArray(input)) {
      return input
        .filter((v) => v != null && String(v).trim() !== "")
        .map((v: any) => {
          const val = String(v);
          const lblSrc = translations?.[val] ?? val;
          return { value: val, label: pickLabel(lblSrc, val, translations) };
        });
    }
    if (input && typeof input === "object") {
      const arr: Option[] = [];
      for (const k in input) {
        if (Object.prototype.hasOwnProperty.call(input, k)) {
          const raw = input[k];
          arr.push({ value: k, label: pickLabel(raw, k, translations) });
        }
      }
      return arr;
    }
  } catch {}
  return [];
};

/* ---------------- component ---------------- */

export default function CarDataEntryForm() {
  const [formData, setFormData] = useState<CarFormData>(emptyCar);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);

  const [conditionOptions, setConditionOptions] =
    useState<Option[]>(DEFAULT_CONDITION_OPTIONS);
  const [transmissionOptions, setTransmissionOptions] =
    useState<Option[]>(DEFAULT_TRANSMISSION_OPTIONS);
  const [marketOptions, setMarketOptions] =
    useState<Option[]>(DEFAULT_MARKET_OPTIONS);

  const [images, setImages] = useState<File[]>([]);
  const [reports, setReports] = useState<File[]>([]);
  const [registrationCardFile, setRegistrationCardFile] =
    useState<File | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [registrationCardPreview, setRegistrationCardPreview] =
    useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const reportInputRef = useRef<HTMLInputElement>(null);

  const ENUMS_ENDPOINT = apiPath("/cars/enum-options");
  const CARS_ENDPOINT = apiPath("/cars");

  const isCaravan = formData.market_category === "caravan";
  const lengthNum = parseFloat(formData.length_m || "");
  const widthNum = parseFloat(formData.width_m || "");
  const areaM2 =
    !Number.isNaN(lengthNum) &&
    !Number.isNaN(widthNum) &&
    lengthNum > 0 &&
    widthNum > 0
      ? lengthNum * widthNum
      : null;

  // جلب خيارات الـ enums بأمان وتطبيع اللصيقات
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(ENUMS_ENDPOINT);
        const d = res?.data?.data ?? res?.data ?? {};

        const cond = toOptions(d?.conditions);
        if (mounted && cond.length) setConditionOptions(cond);

        const trans = toOptions(d?.transmissions);
        if (mounted && trans.length) setTransmissionOptions(trans);

        // markets
        let markets: string[] = [];
        if (Array.isArray(d?.markets_allowed)) markets = d.markets_allowed.slice();
        else if (d?.market_categories && typeof d.market_categories === "object") {
          markets = Object.keys(d.market_categories);
        }

        let opts: Option[] = DEFAULT_MARKET_OPTIONS;
        if (markets.length) {
          const cleaned = markets
            .filter((m) => !!m && m !== "government")
            .flatMap((m) => (m === "busesTrucks" ? ["buses", "trucks"] : [m]));

          const uniq: string[] = [];
          cleaned.forEach((m) => {
            if (!uniq.includes(m)) uniq.push(m);
          });

          const translations =
            (d?.markets_translations &&
              typeof d.markets_translations === "object" &&
              d.markets_translations) ||
            MARKET_TRANSLATIONS;

          opts = uniq.map((val) => ({
            value: val,
            label: pickLabel(
              translations[val] ?? MARKET_TRANSLATIONS[val] ?? val,
              val,
              translations
            ),
          }));

          const order = [
            "luxuryCars",
            "classic",
            "caravan",
            "trucks",
            "buses",
            "companiesCars",
          ];
          opts.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
        }

        if (mounted) setMarketOptions(opts);
      } catch {
        if (mounted) {
          setConditionOptions(DEFAULT_CONDITION_OPTIONS);
          setTransmissionOptions(DEFAULT_TRANSMISSION_OPTIONS);
          setMarketOptions(DEFAULT_MARKET_OPTIONS);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [ENUMS_ENDPOINT]);

  // تحليل بسيط حسب بيانات المستخدم
  useEffect(() => {
    if (formData.make && formData.model && formData.year) {
      const matching = (carsData as any[]).filter(
        (car: any) =>
          String(car.make).trim() === String(formData.make).trim() &&
          String(car.model).trim().includes(String(formData.model).trim()) &&
          Math.floor(Number(car.year)) === Number(formData.year)
      );
      if (matching.length) {
        const avg =
          matching.reduce((s, c) => s + Number(c.price), 0) / matching.length;
        setAiAnalysis({
          marketPrice: Math.round(avg),
          demandLevel: ["منخفض", "متوسط", "مرتفع"][
            Math.floor(Math.random() * 3)
          ],
          similarCars: matching.length,
          priceSuggestion: Math.round(avg * (0.95 + Math.random() * 0.1)),
        });
      } else {
        setAiAnalysis(null);
      }
    } else {
      setAiAnalysis(null);
    }
  }, [formData.make, formData.model, formData.year]);

  /* ------------ handlers ------------ */

  const handleInputChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...urls]);
  };

  const handleReportChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    setReports((prev) => [...prev, ...files]);
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    if (previewUrls[i]) URL.revokeObjectURL(previewUrls[i]);
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== i));
  };

  const removeReport = (i: number) => {
    setReports((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("يجب تسجيل الدخول أولاً");

      const required = [
        { field: "make", name: "الماركة" },
        { field: "model", name: "الموديل" },
        { field: "year", name: "سنة الصنع" },
        { field: "vin", name: "رقم التسجيل" },
        { field: "odometer", name: "رقم العداد" },
        { field: "condition", name: "حالة السيارة" },
        { field: "min_price", name: "الحد الأدنى المقبول" },
        { field: "province", name: "المنطقة" },
        { field: "market_category", name: "سوق السيارة" },
        { field: "description", name: "وصف السيارة" },
      ];

      // لو السوق كرافانات نلزم نوع الاستخدام والسعة
      if (formData.market_category === "caravan") {
        required.push(
          { field: "usage", name: "نوع استخدام الكرفان" },
          { field: "capacity_persons", name: "السعة (عدد الأشخاص)" }
        );
      }

      for (const { field, name } of required) {
        const v = (formData as any)[field];
        if (v == null || String(v).trim() === "")
          throw new Error(`حقل ${name} مطلوب`);
      }

      if (images.length === 0)
        throw new Error("يجب إضافة صورة واحدة على الأقل للسيارة");

      const fd = new FormData();

      const baseFields: (keyof CarFormData)[] = [
        "make",
        "model",
        "year",
        "vin",
        "engine",
        "odometer",
        "color",
        "transmission",
        "condition",
        "min_price",
        "max_price",
        "description",
        "plate",
        "agency_number",
        "agency_issue_date",
        "city",
        "province",
        "market_category",
        "main_auction_duration",
      ];

      baseFields.forEach((k) => {
        const v = formData[k];
        if (v != null && String(v) !== "") {
          fd.append(String(k), String(v));
        }
      });

      const isCaravanSubmit = formData.market_category === "caravan";

      if (isCaravanSubmit) {
        // نوع المركبة
        fd.append("type", "caravan");

        const caravanFields: (keyof CarFormData)[] = [
          "usage",
          "year_built",
          "length_m",
          "width_m",
          "weight_kg",
          "capacity_persons",
          "has_bathroom",
          "has_kitchen",
          "bedrooms_count",
          "solar_power_kw",
          "license_required",
        ];

        caravanFields.forEach((k) => {
          const v = formData[k];
          if (v != null && String(v) !== "") {
            fd.append(String(k), String(v));
          }
        });
      }

      // نقدر نستخدم الحد الأدنى كتقدير مبدئي للتقييم
      fd.append("evaluation_price", formData.min_price || "0");

      images.forEach((img) => fd.append("images[]", img));
      if (registrationCardFile) {
        fd.append("registration_card_image", registrationCardFile);
      }
      reports.forEach((rep) => fd.append("reports_images[]", rep));

      const response = await api.post(CARS_ENDPOINT, fd);
      if (response?.data?.status === "success") {
        toast.success(
          "تم إضافة السيارة وإنشاء المزاد بنجاح - في انتظار الموافقة"
        );
        setSubmitResult({
          success: true,
          message:
            "تم إضافة السيارة وإنشاء المزاد بنجاح - في انتظار الموافقة",
        });

        // reset
        previewUrls.forEach((u) => URL.revokeObjectURL(u));
        if (registrationCardPreview)
          URL.revokeObjectURL(registrationCardPreview);
        setFormData(emptyCar);
        setImages([]);
        setReports([]);
        setRegistrationCardFile(null);
        setPreviewUrls([]);
        setRegistrationCardPreview("");
      } else {
        toast.error("فشل في إضافة السيارة");
        setSubmitResult({
          success: false,
          message: "فشل في إضافة السيارة",
        });
      }
    } catch (error: any) {
      if (error?.response?.status === 422 && error?.response?.data?.errors) {
        const msgs: string[] = [];
        const errs = error.response.data.errors;
        for (const k in errs) {
          if (Object.prototype.hasOwnProperty.call(errs, k)) {
            const v = errs[k];
            if (Array.isArray(v)) msgs.push(...v);
            else msgs.push(String(v));
          }
        }
        toast.error(`أخطاء في التحقق: ${msgs.join(", ")}`);
        setSubmitResult({
          success: false,
          message: `أخطاء في التحقق: ${msgs.join(", ")}`,
        });
      } else if (error?.response?.status === 401) {
        toast.error("غير مصرح لك بالوصول - يرجى تسجيل الدخول مرة أخرى");
        setSubmitResult({
          success: false,
          message: "غير مصرح لك بالوصول - يرجى تسجيل الدخول مرة أخرى",
        });
      } else if (error?.response?.status === 404) {
        toast.error("الخدمة غير متاحة - تحقق من مسار الـ API (404)");
        setSubmitResult({
          success: false,
          message: "الخدمة غير متاحة - تحقق من مسار الـ API (404)",
        });
      } else if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
        setSubmitResult({
          success: false,
          message: error.response.data.message,
        });
      } else {
        toast.error(error?.message || "حدث خطأ أثناء إضافة السيارة");
        setSubmitResult({
          success: false,
          message: error?.message || "حدث خطأ أثناء إضافة السيارة",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 w-full max-w-6xl mx-auto mb-10">
      <div className="border-b pb-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          نموذج إدخال بيانات السيارة
        </h1>
        <p className="text-sm sm:text-base text-foreground/70 mt-1">
          يرجى تعبئة جميع البيانات المطلوبة لإضافة سيارتك
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* بيانات أساسية */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:p-6">
          <div>
            <label
              htmlFor="make"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              الماركة *
            </label>
            <select
              id="make"
              name="make"
              value={formData.make}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              required
            >
              <option value="">-- اختر الماركة --</option>
              <option value="تويوتا">تويوتا</option>
              <option value="نيسان">نيسان</option>
              <option value="هونداي">هونداي</option>
              <option value="كيا">كيا</option>
              <option value="فورد">فورد</option>
              <option value="شيفروليه">شيفروليه</option>
              <option value="مرسيدس">مرسيدس</option>
              <option value="بي إم دبليو">بي إم دبليو</option>
              <option value="أودي">أودي</option>
              <option value="لكزس">لكزس</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="model"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              الموديل *
            </label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              required
            />
          </div>

          <div>
            <label
              htmlFor="year"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              سنة الصنع *
            </label>
            <select
              id="year"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              required
            >
              <option value="">-- اختر السنة --</option>
              {Array.from(
                { length: 30 },
                (_, i) => new Date().getFullYear() - i
              ).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="vin"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              رقم التسجيل*
            </label>
            <input
              type="text"
              id="vin"
              name="vin"
              value={formData.vin}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              placeholder="رقم الهيكل"
              required
            />
          </div>

          <div>
            <label
              htmlFor="plate"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              لوحة السيارة
            </label>
            <input
              type="text"
              id="plate"
              name="plate"
              value={formData.plate}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              placeholder="لوحة السيارة"
            />
          </div>

          <div>
            <label
              htmlFor="engine"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              نوع الوقود
            </label>
            <select
              id="engine"
              name="engine"
              value={formData.engine}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
            >
              <option value="">-- اختر نوع الوقود --</option>
              <option value="بنزين">بنزين</option>
              <option value="ديزل">ديزل</option>
              <option value="هجين">هجين</option>
              <option value="كهربائي">كهربائي</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="odometer"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              رقم العداد (كم) *
            </label>
            <input
              type="number"
              id="odometer"
              name="odometer"
              value={formData.odometer}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              min="0"
              placeholder="10000"
              required
            />
          </div>

          <div>
            <label
              htmlFor="color"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              لون السيارة
            </label>
            <select
              name="color"
              id="color"
              value={formData.color}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
            >
              <option value="">اختر لون السيارة</option>
              {carColors.map((c) => (
                <option key={c.value} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="transmission"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              نوع ناقل الحركة
            </label>
            <select
              id="transmission"
              name="transmission"
              value={formData.transmission}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
            >
              <option value="">-- اختر نوع ناقل الحركة --</option>
              {transmissionOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="condition"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              حالة السيارة
            </label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              required
            >
              <option value="">-- اختر حالة السيارة --</option>
              {conditionOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="province"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              المنطقة
            </label>
            <select
              id="province"
              name="province"
              value={formData.province}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              required
            >
              <option value="">-- أختر المنطقة --</option>
              {emirates.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              المدينة
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              placeholder="المدينة"
            />
          </div>

          <div>
            <label
              htmlFor="min_price"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              الحد الأدنى المقبول (ريال) *
            </label>
            <input
              type="number"
              id="min_price"
              name="min_price"
              value={formData.min_price}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              min="0"
              placeholder="أقل سعر تقبل به للسيارة"
              required
            />
          </div>

          <div>
            <label
              htmlFor="max_price"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              الحد الأعلى المرغوب (ريال)
            </label>
            <input
              type="number"
              id="max_price"
              name="max_price"
              value={formData.max_price}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              min="0"
              placeholder="السعر المستهدف للبيع"
            />
          </div>

          <div>
            <label
              htmlFor="agency_number"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              رقم الوكالة
            </label>
            <input
              type="text"
              id="agency_number"
              name="agency_number"
              value={formData.agency_number}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              placeholder="رقم الوكالة"
            />
          </div>

          <div>
            <label
              htmlFor="agency_issue_date"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              تاريخ إصدار الوكالة
            </label>
            <input
              type="date"
              id="agency_issue_date"
              name="agency_issue_date"
              value={formData.agency_issue_date}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="market_category"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              سوق السيارة
            </label>
            <select
              id="market_category"
              name="market_category"
              value={formData.market_category}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              required
            >
              <option value="">-- اختر  سوق السيارة --</option>
              {(marketOptions?.length ? marketOptions : DEFAULT_MARKET_OPTIONS).map(
                (opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="main_auction_duration"
              className="block text-sm font-medium text-foreground/80 mb-1"
            >
              مدة البقاء في المزادات الرئيسية
            </label>
            <select
              id="main_auction_duration"
              name="main_auction_duration"
              value={formData.main_auction_duration}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
            >
              <option value="">اختر مدة</option>
              <option value="10">10 أيام</option>
              <option value="20">20 يوم</option>
              <option value="30">30 يوم</option>
            </select>
          </div>
        </div>

        {/* تفاصيل الكرفان - تظهر فقط لسوق الكرفانات */}
        {isCaravan && (
          <div className="border-t pt-6 mt-4">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              تفاصيل الكرفان
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="usage"
                  className="block text-sm font-medium text-foreground/80 mb-1"
                >
                  نوع استخدام الكرفان *
                </label>
                <select
                  id="usage"
                  name="usage"
                  value={formData.usage}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                  required={isCaravan}
                >
                  <option value="">-- اختر نوع الاستخدام --</option>
                  <option value="سكني">سكني</option>
                  <option value="تجاري">تجاري</option>
                  <option value="فخم">فخم</option>
                  <option value="مخصص">مخصص</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="year_built"
                  className="block text-sm font-medium text-foreground/80 mb-1"
                >
                  سنة البناء (اختياري)
                </label>
                <input
                  type="number"
                  id="year_built"
                  name="year_built"
                  value={formData.year_built}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                  min="1970"
                  max={new Date().getFullYear()}
                  placeholder="مثال: 2020"
                />
              </div>

              <div>
                <label
                  htmlFor="length_m"
                  className="block text-sm font-medium text-foreground/80 mb-1"
                >
                  الطول (متر)
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="length_m"
                  name="length_m"
                  value={formData.length_m}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                  min="0"
                  placeholder="مثال: 7.5"
                />
              </div>

              <div>
                <label
                  htmlFor="width_m"
                  className="block text-sm font-medium text-foreground/80 mb-1"
                >
                  العرض (متر)
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="width_m"
                  name="width_m"
                  value={formData.width_m}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                  min="0"
                  placeholder="مثال: 2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  مساحة المعيشة (م²) - للعرض فقط
                </label>
                <input
                  type="text"
                  readOnly
                  value={areaM2 != null ? areaM2.toFixed(2) : ""}
                  className="w-full p-3 border border-dashed rounded-md bg-background/60 text-foreground/80"
                  placeholder="تُحسب تلقائيًا = الطول × العرض"
                />
                <p className="text-xs text-foreground/60 mt-1">
                  هذه القيمة تُحسب في الواجهة، ويتم حسابها مرة أخرى في الخادم
                  تلقائيًا ولا تُحرَّر يدويًا.
                </p>
              </div>

              <div>
                <label
                  htmlFor="weight_kg"
                  className="block text-sm font-medium text-foreground/80 mb-1"
                >
                  الوزن (كجم) (اختياري)
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="weight_kg"
                  name="weight_kg"
                  value={formData.weight_kg}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                  min="0"
                  placeholder="مثال: 2800"
                />
              </div>

              <div>
                <label
                  htmlFor="capacity_persons"
                  className="block text-sm font-medium text-foreground/80 mb-1"
                >
                  السعة (عدد الأشخاص) *
                </label>
                <input
                  type="number"
                  id="capacity_persons"
                  name="capacity_persons"
                  value={formData.capacity_persons}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                  min="1"
                  placeholder="مثال: 4"
                  required={isCaravan}
                />
              </div>

              <div>
                <label
                  htmlFor="has_bathroom"
                  className="block text-sm font-medium text-foreground/80 mb-1"
                >
                  هل يوجد دورة مياه؟
                </label>
                <select
                  id="has_bathroom"
                  name="has_bathroom"
                  value={formData.has_bathroom}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                >
                  <option value="">-- اختر --</option>
                  <option value="true">نعم</option>
                  <option value="false">لا</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="has_kitchen"
                  className="block text-sm font-medium text-foreground/80 mb-1"
                >
                  هل يوجد مطبخ؟
                </label>
                <select
                  id="has_kitchen"
                  name="has_kitchen"
                  value={formData.has_kitchen}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                >
                  <option value="">-- اختر --</option>
                  <option value="true">نعم</option>
                  <option value="false">لا</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="bedrooms_count"
                  className="block text-sm font-medium text-foreground/80 mb-1"
                >
                  عدد غرف النوم (اختياري)
                </label>
                <input
                  type="number"
                  id="bedrooms_count"
                  name="bedrooms_count"
                  value={formData.bedrooms_count}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                  min="0"
                  placeholder="مثال: 1"
                />
              </div>

              <div>
                <label
                  htmlFor="solar_power_kw"
                  className="block text-sm font-medium text-foreground/80 mb-1"
                >
                  قدرة الألواح الشمسية (كيلوواط) (اختياري)
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="solar_power_kw"
                  name="solar_power_kw"
                  value={formData.solar_power_kw}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                  min="0"
                  placeholder="مثال: 1.2"
                />
              </div>

              <div>
                <label
                  htmlFor="license_required"
                  className="block text-sm font-medium text-foreground/80 mb-1"
                >
                  هل يحتاج لترخيص/تصريح خاص؟
                </label>
                <select
                  id="license_required"
                  name="license_required"
                  value={formData.license_required}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                >
                  <option value="">-- اختر --</option>
                  <option value="true">نعم</option>
                  <option value="false">لا</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* تحليل الذكاء الاصطناعي */}
        {aiAnalysis && (
          <div className="mt-6 bg-background border border-border rounded-lg p-4">
            <h3 className="font-bold text-foreground mb-3">
              تحليل السوق الذكي
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card p-3 rounded-lg border border-border">
                <p className="text-sm text-foreground/70">متوسط السعر بالسوق</p>
                <p className="text-xl font-bold">
                  {aiAnalysis.marketPrice.toLocaleString()} ر.س
                </p>
              </div>
              <div className="bg-card p-3 rounded-lg border border-border">
                <p className="text-sm text-foreground/70">مستوى الطلب</p>
                <p
                  className={`text-xl font-bold ${
                    aiAnalysis.demandLevel === "مرتفع"
                      ? "text-green-600"
                      : aiAnalysis.demandLevel === "متوسط"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {aiAnalysis.demandLevel}
                </p>
              </div>
              <div className="bg-card p-3 rounded-lg border border-border">
                <p className="text-sm text-foreground/70">سيارات مشابهة</p>
                <p className="text-xl font-bold">
                  {aiAnalysis.similarCars}
                </p>
              </div>
              <div className="bg-card p-3 rounded-lg border border-border">
                <p className="text-sm text-foreground/70">السعر المقترح</p>
                <p className="text-xl font-bold text-primary">
                  {aiAnalysis.priceSuggestion.toLocaleString()} ر.س
                </p>
              </div>
            </div>
          </div>
        )}

        {/* كرت التسجيل */}
        <div className="border-t pt-6">
          <label
            htmlFor="registration_card_image"
            className="block text-sm font-medium text-foreground/80 mb-1"
          >
            صورة كرت التسجيل
          </label>
          <input
            type="file"
            id="registration_card_image"
            name="registration_card_image"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setRegistrationCardFile(file);
                const previewUrl = URL.createObjectURL(file);
                setRegistrationCardPreview(previewUrl);
                setFormData((prev) => ({
                  ...prev,
                  registration_card_image: "",
                }));
              }
            }}
            className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
          />
          {registrationCardPreview && (
            <div className="mt-4">
              <img
                src={registrationCardPreview}
                alt="معاينة كرت التسجيل"
                className="w-full max-w-md h-40 object-cover rounded-md border"
              />
              <button
                type="button"
                onClick={() => {
                  setRegistrationCardFile(null);
                  if (registrationCardPreview)
                    URL.revokeObjectURL(registrationCardPreview);
                  setRegistrationCardPreview("");
                  setFormData((prev) => ({
                    ...prev,
                    registration_card_image: "",
                  }));
                }}
                className="mt-2 text-red-600 hover:text-red-800 text-sm"
              >
                حذف الصورة
              </button>
            </div>
          )}
        </div>

        {/* وصف */}
        <div className="border-t pt-6">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-foreground/80 mb-1"
          >
            وصف السيارة
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-4 sm:p-6 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
            placeholder="وصف السيارة"
            required
          />
        </div>

        {/* صور */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-foreground mb-3 flex items-center">
            <Upload className="ml-2 h-5 w-5 text-primary" />
            صور السيارة <span className="text-red-500">*</span>
          </h3>

          <div className="mb-4">
            <input
              type="file"
              id="car-images"
              ref={imageInputRef}
              onChange={handleImageChange}
              accept="image/*"
              multiple
              className="hidden"
              title="إضافة صور السيارة"
              aria-label="إضافة صور السيارة"
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-primary/30 rounded-md shadow-sm text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Upload className="ml-2 -mr-1 h-5 w-5" />
              إضافة صور السيارة
            </button>
            <p className="text-sm text-foreground/50 mt-1">
              يمكنك رفع حتى 10 صور للسيارة بصيغة JPG أو PNG. يجب أن تكون الصور
              واضحة.
            </p>
          </div>

          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`صورة السيارة ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="حذف الصورة"
                  >
                    <FileX className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* تقارير */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-foreground mb-3 flex items-center">
            <Upload className="ml-2 h-5 w-5 text-primary" />
            تقارير الفحص
          </h3>

          <div className="mb-4">
            <input
              type="file"
              id="car-reports"
              ref={reportInputRef}
              onChange={handleReportChange}
              accept=".pdf,.doc,.docx,.jpg,.png"
              multiple
              className="hidden"
              title="إضافة تقارير الفحص"
              aria-label="إضافة تقارير الفحص"
            />
            <button
              type="button"
              onClick={() => reportInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-secondary/30 rounded-md shadow-sm text-sm font-medium text-secondary bg-secondary/10 hover:bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
            >
              <Upload className="ml-2 -mr-1 h-5 w-5" />
              إضافة تقارير الفحص
            </button>
            <p className="text-sm text-foreground/50 mt-1">
              يمكنك رفع تقارير فحص السيارة بصيغة PDF أو DOC أو صور.
            </p>
          </div>

          {reports.length > 0 && (
            <div className="space-y-2 mb-4">
              {reports.map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-background border rounded-md"
                >
                  <span className="text-sm truncate max-w-xs">
                    {report.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeReport(index)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="حذف التقرير"
                  >
                    <FileX className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* الإقرار والتوقيع */}
        <div className="border-t pt-6">
          <h3 className="text-xl font-bold text-foreground mb-3">
            إقرار قبول الشروط والأحكام
          </h3>

          <div className="bg-background/50 p-4 rounded-lg border border-border mb-4">
            <p className="text-foreground/80 mb-4">
              أقر أنا مقدم هذا النموذج بموافق
              ي على جميع شروط وإجراءات المنصة،
              وأوافق على خصم جميع العمولات والرسوم المقررة من قيمة بيع السيارة.
              كما أتعهد بأن جميع البيانات المقدمة في هذا النموذج صحيحة وكاملة،
              وأتحمل المسؤولية القانونية الكاملة في حال ثبوت عدم صحة أي منها.
            </p>

            <p className="text-foreground/80 mb-4">
              كما أوافق على التوقيع على هذا الإقرار بنظام التوقيع الإلكتروني
              بواسطة الشركة السعودية للمصادقة (صادق)، وأقر بأن هذا التوقيع يعتبر
              ملزماً قانونياً لي ولا يجوز لي الرجوع فيه بعد إتمام عملية البيع.
            </p>
            <div className="flex items-center mt-6 mb-2">
              <input
                type="checkbox"
                id="acceptTerms"
                name="acceptTerms"
                className="w-5 h-5 text-primary border-border rounded focus:ring-primary"
                required
              />
              <label
                htmlFor="acceptTerms"
                className="mr-2 text-sm font-medium text-foreground/80"
              >
                أوافق على جميع الشروط والأحكام والعمولات المذكورة أعلاه
              </label>
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 mb-4">
            <h4 className="text-md font-semibold text-foreground mb-3">
              التوقيع الإلكتروني (صادق)
            </h4>

            <div className="flex items-center justify-center p-4 bg-background border border-dashed border-border rounded-md">
              <div className="text-center">
                <img
                  src="/images/sadad-logo.png"
                  alt="شعار صادق للتوقيع الإلكتروني"
                  className="h-10 mb-2 mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjUwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iNTAiIGZpbGw9IiNmMWYxZjEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxNHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjODg4ODg4Ij7Ytdin2K/ZgiAtINin2YTYqtmI2YLZitisINin2YTYpdmE2YPYqtix2YjZhti5PC90ZXh0Pjwvc3ZnPg==";
                  }}
                />
                <p className="text-sm text-foreground/50">
                  اضغط هنا للتوقيع بواسطة خدمة صادق
                </p>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 bg-secondary text-white text-sm font-medium rounded-md hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                >
                  توقيع إلكتروني
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* رسائل النظام */}
        {submitResult && (
          <div
            className={`p-4 rounded-md ${
              submitResult.success
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}
          >
            <div className="flex items-start">
              {submitResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 ml-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 ml-2" />
              )}
              <p
                className={
                  submitResult.success ? "text-green-700" : "text-red-700"
                }
              >
                {submitResult.message}
              </p>
            </div>
          </div>
        )}

        {/* أزرار */}
        <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4 border-t">
          <button
            type="button"
            onClick={() => {
              // Clean up preview URLs before resetting
              previewUrls.forEach((url) => URL.revokeObjectURL(url));
              if (registrationCardPreview) {
                URL.revokeObjectURL(registrationCardPreview);
              }

              setFormData(emptyCar);
              setImages([]);
              setReports([]);
              setRegistrationCardFile(null);
              setPreviewUrls([]);
              setRegistrationCardPreview("");
              setSubmitResult(null);
            }}
            className="px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground/80 bg-card hover:bg-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            مسح النموذج
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
              isSubmitting
                ? "bg-border/50 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {isSubmitting ? "جاري الحفظ..." : "حفظ بيانات السيارة"}
            <Car className="mr-2 h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
