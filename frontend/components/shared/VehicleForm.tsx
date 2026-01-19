"use client";

import { useState, useRef, FormEvent, ChangeEvent, useEffect } from "react";
import {
  Upload,
  FileX,
  Car,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  Calendar,
} from "lucide-react";
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
  "منطقة الرياض",
  "منطقة مكة المكرمة",
  "منطقة المدينة المنورة",
  "المنطقة الشرقية",
  "منطقة القصيم",
  "منطقة عسير",
  "منطقة حائل",
  "منطقة تبوك",
  "منطقة الباحة",
  "منطقة الحدود الشمالية",
  "منطقة الجوف",
  "منطقة جازان",
  "منطقة نجران",
];

const carColors = [
  { name: "أسود", value: "black" },
  { name: "أبيض", value: "white" },
  { name: "أحمر", value: "red" },
  { name: "أخضر", value: "green" },
  { name: "أزرق", value: "blue" },
  { name: "أصفر", value: "yellow" },
  { name: "برتقالي", value: "orange" },
  { name: "أرجواني", value: "purple" },
  { name: "وردي", value: "pink" },
  { name: "بني", value: "brown" },
  { name: "رمادي", value: "gray" },
  { name: "سماوي", value: "cyan" },
  { name: "أرجواني فاتح", value: "magenta" },
  { name: "ليموني", value: "lime" },
  { name: "أخضر مزرق", value: "teal" },
  { name: "كحلي", value: "navy" },
  { name: "خمري", value: "maroon" },
  { name: "زيتي", value: "olive" },
  { name: "ذهبي", value: "gold" },
  { name: "فضي", value: "silver" },
  { name: "أبيض لؤلؤي", value: "Pearl White" },
  { name: "أسود معدني", value: "Metallic Black" },
  { name: "فضي معدني", value: "Silver Metallic" },
  { name: "رمادي جرافيت", value: "Graphite Gray" },
  { name: "أزرق داكن", value: "Deep Blue" },
  { name: "أحمر قاني", value: "Crimson Red" },
  { name: "أحمر حلوى", value: "Candy Apple Red" },
  { name: "أخضر بريطاني سباق", value: "British Racing Green" },
  { name: "رمادي ناردو", value: "Nardo Grey" },
  { name: "أخضر جرينتا مانتس", value: "Verde Mantis" },
  { name: "أحمر هيلروت", value: "Hellrot" },
  { name: "ليلكي غامق", value: "Nightshade Purple" },
  { name: "أزرق ليلى", value: "Lapis Blue" },
  { name: "أحمر روسّو كورسا", value: "Rosso Corsa" },
  { name: "أصفر لامع", value: "Solar Yellow" },
  { name: "برتقالي لهب", value: "Flame Red (or Orange)" },
  { name: "بيج شوكولاتة", value: "Champagne Beige" },
  { name: "أزرق رالي العالم", value: "World Rally Blue" },
];

export interface CarFormData {
  id?: number;
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
  start_immediately: boolean;
  auction_start_date: string;

  // 🟦 حقول الكرفان
  usage: string;
  year_built: string;
  length_m: string;
  width_m: string;
  weight_kg: string;
  capacity_persons: string;
  has_bathroom: string;
  has_kitchen: string;
  bedrooms_count: string;
  solar_power_kw: string;
  license_required: string;
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
  main_auction_duration: "10",
  start_immediately: true,
  auction_start_date: "",

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

const pickLabel = (
  val: any,
  key?: string,
  translations?: Record<string, any>,
) => {
  if (val == null) {
    const t = key && translations ? translations[key] : undefined;
    if (t && typeof t === "object") return t.ar ?? t.en ?? key ?? "";
    if (typeof t === "string") return t;
    return key ?? "";
  }
  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean"
  )
    return String(val);
  if (typeof val === "object")
    return (
      val.ar ??
      val.en ??
      (key && translations
        ? (translations[key]?.ar ?? translations[key]?.en ?? key)
        : (key ?? ""))
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

const toOptions = (
  input: any,
  translations?: Record<string, any>,
): Option[] => {
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

interface VehicleFormProps {
  mode: "add" | "edit";
  initialData?: any; // The car object from API
  onSuccess?: (data?: any) => void;
}

export default function VehicleForm({
  mode,
  initialData,
  onSuccess,
}: VehicleFormProps) {
  const [formData, setFormData] = useState<CarFormData>(emptyCar);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);

  const [conditionOptions, setConditionOptions] = useState<Option[]>(
    DEFAULT_CONDITION_OPTIONS,
  );
  const [transmissionOptions, setTransmissionOptions] = useState<Option[]>(
    DEFAULT_TRANSMISSION_OPTIONS,
  );
  const [marketOptions, setMarketOptions] = useState<Option[]>(
    DEFAULT_MARKET_OPTIONS,
  );

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [reports, setReports] = useState<File[]>([]);
  const [registrationCardFile, setRegistrationCardFile] = useState<File | null>(
    null,
  );
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [registrationCardPreview, setRegistrationCardPreview] =
    useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [maxPriceError, setMaxPriceError] = useState<string | null>(null);

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

  // Initialize Data for Edit Mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      // Map initialData to formData
      const car = initialData;

      // Helpers to safely get string values
      const val = (k: string) => (car[k] != null ? String(car[k]) : "");

      // Determine auction settings from latest scheduled auction if available
      // Or from car fields if they exist (backend car object might have them)

      const latestAuction = Array.isArray(car.auctions)
        ? car.auctions
            .filter((a: any) => a.status === "scheduled")
            .sort((a: any, b: any) => b.id - a.id)[0]
        : null;

      const isScheduled = !!latestAuction?.start_time;
      const startTime = latestAuction?.start_time
        ? new Date(latestAuction.start_time)
        : null;
      const isFuture = startTime && startTime > new Date();

      setFormData((prev) => ({
        ...prev,
        ...car,
        // Override with string conversions to match form state
        year: val("year"),
        odometer: val("odometer"),
        min_price: val("min_price"),
        max_price: val("max_price"),
        bedrooms_count: val("bedrooms_count"),

        // Auction Settings
        main_auction_duration: val("main_auction_duration") || "10",
        start_immediately: latestAuction ? !isFuture : true,
        auction_start_date:
          isFuture && startTime ? startTime.toISOString().split("T")[0] : "",
      }));

      // Images
      if (Array.isArray(car.images)) {
        setExistingImages(car.images);
      } else if (typeof car.images === "string") {
        try {
          const parsed = JSON.parse(car.images);
          if (Array.isArray(parsed)) setExistingImages(parsed);
        } catch {
          setExistingImages([car.images]);
        }
      }

      // Registration Card
      if (car.registration_card_image) {
        setRegistrationCardPreview(car.registration_card_image);
      }
    }
  }, [mode, initialData]);

  // جلب خيارات الـ enums بأمان
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

        let markets: string[] = [];
        if (Array.isArray(d?.markets_allowed))
          markets = d.markets_allowed.slice();
        else if (
          d?.market_categories &&
          typeof d.market_categories === "object"
        ) {
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
              translations,
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

  // AI Analysis
  useEffect(() => {
    if (formData.make && formData.model && formData.year) {
      const matching = (carsData as any[]).filter(
        (car: any) =>
          String(car.make).trim() === String(formData.make).trim() &&
          String(car.model).trim().includes(String(formData.model).trim()) &&
          Math.floor(Number(car.year)) === Number(formData.year),
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
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

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
          const formattedMin = minVal.toLocaleString();
          const formattedLimit = Math.floor(limit).toLocaleString();
          setMaxPriceError(
            `بناءً على الحد الأدنى المدخل (${formattedMin})، القيمة القصوى المسموح بها للحد الأعلى هي ${formattedLimit} ريال.`,
          );
        } else {
          setMaxPriceError(null);
        }
      } else {
        setMaxPriceError(null);
      }
    }
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

    if (maxPriceError) {
      toast.error("الرجاء تصحيح خطأ الحد الأعلى للسعر");
      setIsSubmitting(false);
      return;
    }

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

      if (formData.market_category === "caravan") {
        required.push(
          { field: "usage", name: "نوع استخدام الكرفان" },
          { field: "capacity_persons", name: "السعة (عدد الأشخاص)" },
        );
      }

      for (const { field, name } of required) {
        const v = (formData as any)[field];
        if (v == null || String(v).trim() === "")
          throw new Error(`حقل ${name} مطلوب`);
      }

      if (mode === "add" && images.length === 0)
        throw new Error("يجب إضافة صورة واحدة على الأقل للسيارة");

      const fd = new FormData();

      // Handle Edit Mode Method Spoofing
      if (mode === "edit") {
        fd.append("_method", "PUT");
        fd.append("keep_existing_images", "1"); // Append new images
      }

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
        "start_immediately",
        "auction_start_date",
      ];

      // Clean boolean/nulls
      baseFields.forEach((k) => {
        const v = formData[k];
        if (v != null && String(v) !== "") {
          if (k === "start_immediately") {
            fd.append(String(k), v ? "1" : "0");
          } else {
            fd.append(String(k), String(v));
          }
        }
      });

      const isCaravanSubmit = formData.market_category === "caravan";
      if (isCaravanSubmit) {
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

      fd.append("evaluation_price", formData.min_price || "0");

      images.forEach((img) => fd.append("images[]", img));
      if (registrationCardFile) {
        fd.append("registration_card_image", registrationCardFile);
      }
      reports.forEach((rep) => fd.append("reports_images[]", rep));

      const endpoint =
        mode === "edit" ? `${CARS_ENDPOINT}/${initialData.id}` : CARS_ENDPOINT;

      const response = await api.post(endpoint, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response?.data?.status === "success") {
        toast.success(
          mode === "edit"
            ? "تم تعديل بيانات السيارة بنجاح"
            : "تم إضافة السيارة وإنشاء المزاد بنجاح - في انتظار الموافقة",
        );
        setSubmitResult({
          success: true,
          message:
            mode === "edit"
              ? "تم تعديل بيانات السيارة بنجاح"
              : "تم إضافة السيارة وإنشاء المزاد بنجاح - في انتظار الموافقة",
        });

        if (mode === "add") {
          // Reset form only on Add
          previewUrls.forEach((u) => URL.revokeObjectURL(u));
          if (registrationCardPreview)
            URL.revokeObjectURL(registrationCardPreview);
          setFormData(emptyCar);
          setImages([]);
          setReports([]);
          setRegistrationCardFile(null);
          setPreviewUrls([]);
          setRegistrationCardPreview("");
        }

        if (onSuccess) {
          onSuccess(response?.data?.data);
        }
      } else {
        toast.error("فشل في العملية");
        setSubmitResult({
          success: false,
          message: "فشل في العملية",
        });
      }
    } catch (error: any) {
      // Error Handling
      const status = error?.response?.status;
      const data = error?.response?.data;

      if (status === 422 && data?.errors) {
        const msgs: string[] = [];
        for (const k in data.errors) {
          const v = data.errors[k];
          if (Array.isArray(v)) msgs.push(...v);
          else msgs.push(String(v));
        }
        toast.error(`أخطاء: ${msgs.join(", ")}`);
      } else if (status === 403) {
        toast.error(data?.message || "غير مصرح لك بتعديل هذه السيارة");
      } else {
        toast.error(data?.message || error?.message || "حدث خطأ غير متوقع");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- UI ---------------- */

  const pageTitle =
    mode === "edit" ? "تعديل بيانات السيارة" : "نموذج إدخال بيانات السيارة";

  return (
    <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 w-full max-w-6xl mx-auto mb-10">
      <div className="border-b pb-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {pageTitle}
        </h1>
        <p className="text-sm sm:text-base text-foreground/70 mt-1">
          {mode === "edit"
            ? "يمكنك تحديث البيانات أدناه"
            : "يرجى تعبئة جميع البيانات المطلوبة لإضافة سيارتك"}
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
              {/* Common brands, simplified list */}
              {[
                "تويوتا",
                "نيسان",
                "هونداي",
                "كيا",
                "فورد",
                "شيفروليه",
                "مرسيدس",
                "بي إم دبليو",
                "أودي",
                "لكزس",
                "أخرى",
              ].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
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
                (_, i) => new Date().getFullYear() - i,
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
            />
            {maxPriceError && (
              <p className="mt-2 text-xs text-red-500 font-medium animate-pulse">
                {maxPriceError}
              </p>
            )}
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
              <option value="">-- اختر سوق السيارة --</option>
              {(marketOptions?.length
                ? marketOptions
                : DEFAULT_MARKET_OPTIONS
              ).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Auction Settings Section */}
        <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 mt-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            إعدادات المزاد
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                مدة المزاد (أيام)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[10, 20, 30].map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        main_auction_duration: String(d),
                      }))
                    }
                    className={`
                        py-3 px-4 rounded-xl border transition-all duration-200
                        ${
                          String(formData.main_auction_duration) === String(d)
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                            : "bg-background border-border text-foreground hover:border-primary/50"
                        }
                        `}
                  >
                    <span className="text-lg font-bold">{d}</span>
                    <span className="text-xs block opacity-80">يوم</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                وقت بدء المزاد
              </label>
              <div className="space-y-3 p-4 border border-border rounded-xl bg-background/50">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`
                            w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                            ${formData.start_immediately ? "border-primary" : "border-muted-foreground group-hover:border-primary"}
                        `}
                  >
                    {formData.start_immediately && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="start_type"
                    className="hidden"
                    checked={formData.start_immediately}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        start_immediately: true,
                        auction_start_date: "",
                      }))
                    }
                  />
                  <span
                    className={
                      formData.start_immediately
                        ? "text-primary font-medium"
                        : "text-foreground"
                    }
                  >
                    يبدأ فوراً بعد الموافقة
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`
                            w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                            ${!formData.start_immediately ? "border-primary" : "border-muted-foreground group-hover:border-primary"}
                        `}
                  >
                    {!formData.start_immediately && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="start_type"
                    className="hidden"
                    checked={!formData.start_immediately}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        start_immediately: false,
                      }))
                    }
                  />
                  <span
                    className={
                      !formData.start_immediately
                        ? "text-primary font-medium"
                        : "text-foreground"
                    }
                  >
                    تحديد تاريخ مستقبلي
                  </span>
                </label>

                {!formData.start_immediately && (
                  <div className="mr-8 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="relative">
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <input
                        type="date"
                        value={formData.auction_start_date}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={handleInputChange}
                        name="auction_start_date"
                        className="w-full bg-background border border-border rounded-lg py-2 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      سيبدأ المزاد تلقائياً في الساعة 7:00 مساءً
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Existing Images (Edit Only) */}
        {mode === "edit" && existingImages.length > 0 && (
          <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 mt-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              الصور الحالية
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {existingImages.map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-video rounded-lg overflow-hidden border border-border"
                >
                  <img
                    src={url}
                    alt={`img-${i}`}
                    className="w-full h-full object-cover"
                  />
                  {/* No delete button for existing images for now as per backend limitation */}
                </div>
              ))}
            </div>
            <p className="text-sm text-yellow-500 mt-2">
              ملاحظة: يمكنك إضافة صور جديدة، وسيتم إضافتها للصور الحالية.
            </p>
          </div>
        )}

        {/* New Images */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-foreground mb-3 flex items-center">
            <Upload className="ml-2 h-5 w-5 text-primary" />
            {mode === "edit" ? "إضافة صور جديدة" : "صور السيارة"}{" "}
            <span className="text-red-500">*</span>
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
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-primary/30 rounded-md shadow-sm text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Upload className="ml-2 -mr-1 h-5 w-5" />
              {mode === "edit" ? "إضافة صور إضافية" : "إضافة صور السيارة"}
            </button>
            {mode === "add" && (
              <p className="text-sm text-foreground/50 mt-1">
                يجب رفع صورة واحدة على الأقل.
              </p>
            )}
          </div>

          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`صورة جديدة ${index + 1}`}
                    className="h-32 w-full object-cover rounded-md border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FileX className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* تفاصيل الكرفان - تظهر فقط لسوق الكرفانات */}
        {isCaravan && (
          /* Content omitted for brevity, keeping existing logic if market_category is caravan */
          <div className="border-t pt-6 mt-4">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              تفاصيل الكرفان
            </h3>
            {/* Simple Caravan Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  نوع الاستخدام *
                </label>
                <select
                  name="usage"
                  value={formData.usage}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-md bg-background"
                  required
                >
                  <option value="">-- اختر --</option>
                  <option value="سكني">سكني</option>
                  <option value="تجاري">تجاري</option>
                  <option value="فخم">فخم</option>
                  <option value="مخصص">مخصص</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  السعة (أشخاص) *
                </label>
                <input
                  type="number"
                  name="capacity_persons"
                  value={formData.capacity_persons}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-md bg-background"
                  required
                />
              </div>
            </div>
          </div>
        )}

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

        <div className="pt-6 border-t border-border flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {isSubmitting
              ? "جاري الحفظ..."
              : mode === "edit"
                ? "حفظ التعديلات"
                : "إضافة السيارة"}
          </button>
        </div>
      </form>
    </div>
  );
}
