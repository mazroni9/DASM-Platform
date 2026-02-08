/**
 * 📝 صفحة تفاصيل السيارة بمعرف محدد
 * 📁 المسار: Frontend-local/app/carDetails/[id]/page.tsx
 *
 * ✅ الوظيفة:
 * - عرض تفاصيل السيارة
 * - تصميم أفضل + دعم Dark Mode (حتى لو مشروعك مش بيحط class="dark")
 * - معالجة images لو جاية JSON (string/array/object)
 * - ✅ تعديل: إزالة الخلفية السوداء من Modal (بدلها Glass أبيض شفاف)
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import LoadingLink from "@/components/LoadingLink";
import {
  ChevronRight,
  AlertCircle,
  Calendar,
  Gauge,
  Paintbrush,
  Fuel,
  Car as CarIcon,
  Wrench,
  Tag,
  ChevronLeft,
  X,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";

type ImgLike = string | { url?: string; path?: string; src?: string };
type LocalizedLabel = string | { ar?: string; en?: string } | null | undefined;

function normalizeLabel(v: LocalizedLabel): string {
  if (!v) return "—";
  if (typeof v === "string") return v.trim() ? v : "—";
  if (typeof v === "object") return (v.ar || v.en || "—").trim() || "—";
  return "—";
}

function normalizeImages(raw: any): string[] {
  if (!raw) return [];

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return normalizeImages(parsed);
    } catch {
      if (raw.startsWith("http") || raw.startsWith("/")) return [raw];
      return [];
    }
  }

  if (Array.isArray(raw)) {
    return raw
      .map((x: ImgLike) => {
        if (!x) return "";
        if (typeof x === "string") return x;
        return x.url || x.path || x.src || "";
      })
      .filter(Boolean);
  }

  if (typeof raw === "object") {
    const maybe = raw.url || raw.path || raw.src;
    return maybe ? [maybe] : [];
  }

  return [];
}

function formatSAR(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("ar-SA")} ريال`;
}

// ✅ Dark mode bridge: يدعم class / data-theme / system
function detectDarkMode(): boolean {
  if (typeof window === "undefined") return false;

  const el = document.documentElement;
  const body = document.body;

  const getThemeAttr = (node: Element) =>
    node.getAttribute("data-theme") || node.getAttribute("data-mode");

  const attr = getThemeAttr(el) || getThemeAttr(body);

  if (attr === "dark") return true;
  if (attr === "light") return false;

  if (el.classList.contains("dark") || body.classList.contains("dark"))
    return true;
  if (el.classList.contains("light") || body.classList.contains("light"))
    return false;

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
}

export default function CarDetailPage() {
  const router = useLoadingRouter();
  const { user, isLoggedIn } = useAuth();
  const params = useParams<{ id: string }>();
  const carId = params?.id ? String(params.id) : "";

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isOwner, setIsOwner] = useState(false);

  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // ✅ Dark mode state
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () => setIsDark(detectDarkMode());
    update();

    const obsOpts: MutationObserverInit = {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-mode"],
    };

    const obs1 = new MutationObserver(update);
    obs1.observe(document.documentElement, obsOpts);

    const obs2 = new MutationObserver(update);
    obs2.observe(document.body, obsOpts);

    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onMq = () => update();
    mq?.addEventListener?.("change", onMq);

    return () => {
      obs1.disconnect();
      obs2.disconnect();
      mq?.removeEventListener?.("change", onMq);
    };
  }, []);

  // ✅ Auth
  useEffect(() => {
    if (!isLoggedIn) router.replace("/auth/login");
  }, [isLoggedIn, router]);

  // ✅ Fetch car
  useEffect(() => {
    let mounted = true;

    async function fetchCar() {
      if (!isLoggedIn || !carId) return;
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/api/admin/cars/${carId}`);
        if (!mounted) return;

        const carData = response?.data?.data ?? null;
        if (!carData) {
          setItem(null);
          setError("لم يتم العثور على بيانات السيارة.");
          return;
        }

        setItem(carData);

        const currentUserId = user?.id;
        const carUserId = carData.user_id;
        const dealerUserId = carData?.dealer?.user_id ?? null;

        setIsOwner(
          Boolean(
            currentUserId &&
            (String(currentUserId) === String(carUserId) ||
              String(currentUserId) === String(dealerUserId)),
          ),
        );
      } catch (e) {
        console.error("error fetching car details", e);
        if (!mounted) return;
        setItem(null);
        setError("حدث خطأ أثناء تحميل تفاصيل السيارة.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    fetchCar();
    return () => {
      mounted = false;
    };
  }, [isLoggedIn, carId, user?.id]);

  // ✅ Images
  const images = useMemo(() => normalizeImages(item?.images), [item?.images]);
  const hasImages = images.length > 0;

  const safeIndex = useMemo(() => {
    if (!hasImages) return 0;
    return Math.min(selectedImageIndex, images.length - 1);
  }, [hasImages, images.length, selectedImageIndex]);

  const currentImage = hasImages ? images[safeIndex] : "/placeholder-car.jpg";

  const carTitle = item
    ? `${(item.make || "—").toString()} ${(item.model || "—").toString()}`
    : "تفاصيل السيارة";

  useEffect(() => {
    if (!hasImages) setSelectedImageIndex(0);
    else if (selectedImageIndex > images.length - 1) setSelectedImageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  const goToNextImage = () => {
    if (!hasImages) return;
    setSelectedImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1,
    );
  };

  const goToPreviousImage = () => {
    if (!hasImages) return;
    setSelectedImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1,
    );
  };

  // ✅ Close modal by ESC + arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowImageModal(false);
      if (!showImageModal) return;

      // RTL navigation:
      if (e.key === "ArrowRight") goToPreviousImage();
      if (e.key === "ArrowLeft") goToNextImage();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showImageModal, images.length]);

  // ✅ Loading / Error / Empty
  if (loading) {
    return (
      <div
        className={`${isDark ? "dark" : ""} min-h-screen`}
        dir="rtl"
        lang="ar"
      >
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-40 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="mt-2 h-3 w-56 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            </div>
            <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
              جاري تحميل بيانات السيارة...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${isDark ? "dark" : ""} min-h-screen`}
        dir="rtl"
        lang="ar"
      >
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-4 text-base font-semibold">{error}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => router.replace("/admin/cars")}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 text-sm hover:opacity-90 transition"
              >
                الرجوع للقائمة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div
        className={`${isDark ? "dark" : ""} min-h-screen`}
        dir="rtl"
        lang="ar"
      >
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
            <p className="mt-4 text-base font-semibold">
              لم يتم العثور على بيانات السيارة.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => router.replace("/admin/cars")}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 text-sm hover:opacity-90 transition"
              >
                الرجوع للقائمة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const auctions = Array.isArray(item?.auctions) ? item.auctions : [];
  const firstAuction = auctions[0] ?? null;

  const currentBid = firstAuction?.current_bid ?? null;
  const minimumBid = firstAuction?.minimum_bid ?? null;
  const bidsCount =
    auctions.reduce(
      (acc: number, a: any) =>
        acc + (Array.isArray(a?.bids) ? a.bids.length : 0),
      0,
    ) || 0;

  return (
    <div className={`${isDark ? "dark" : ""} min-h-screen`} dir="rtl" lang="ar">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* ✅ Image Modal (Glass أبيض شفاف بدل الأسود) */}
        {showImageModal && (
          <div
            className="
              fixed inset-0 z-50
              flex items-center justify-center p-4
              bg-white/55 dark:bg-white/10
              backdrop-blur-[2px]
            "
            onClick={() => setShowImageModal(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="relative w-full max-w-5xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-3 left-3 z-10 inline-flex items-center justify-center rounded-xl bg-white/80 hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900 text-slate-900 dark:text-white p-2 transition shadow"
                aria-label="إغلاق"
                title="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>

              <img
                src={currentImage}
                alt={carTitle}
                className="max-w-full max-h-[80vh] mx-auto object-contain rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-900/30"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-car.jpg";
                }}
              />

              {hasImages && images.length > 1 && (
                <>
                  <button
                    onClick={goToPreviousImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900 text-slate-900 dark:text-white p-2 transition shadow"
                    aria-label="الصورة السابقة"
                    title="الصورة السابقة"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>

                  <button
                    onClick={goToNextImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900 text-slate-900 dark:text-white p-2 transition shadow"
                    aria-label="الصورة التالية"
                    title="الصورة التالية"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>

                  <div className="mt-4 flex justify-center gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`h-2.5 w-2.5 rounded-full transition ${
                          idx === safeIndex
                            ? "bg-slate-900 dark:bg-white scale-110"
                            : "bg-slate-900/30 hover:bg-slate-900/50 dark:bg-white/30 dark:hover:bg-white/60"
                        }`}
                        aria-label={`عرض الصورة ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          {/* ✅ Top bar */}
          <div className="flex items-center justify-between mb-6">
            <LoadingLink
              href="/admin/cars"
              className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" />
              <span>العودة إلى قائمة السيارات</span>
            </LoadingLink>

            {isOwner && (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                أنت المالك
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ✅ Left: gallery */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div
                  className="relative cursor-pointer group"
                  onClick={() => setShowImageModal(true)}
                  role="button"
                  aria-label="عرض الصورة بالحجم الكامل"
                >
                  <img
                    src={currentImage}
                    alt={carTitle}
                    className="w-full h-[420px] md:h-[480px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/placeholder-car.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />

                  {hasImages && images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goToPreviousImage();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/40 hover:bg-slate-900/55 dark:bg-white/10 dark:hover:bg-white/20 text-white p-2 rounded-full transition"
                        aria-label="الصورة السابقة"
                        title="الصورة السابقة"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goToNextImage();
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/40 hover:bg-slate-900/55 dark:bg-white/10 dark:hover:bg-white/20 text-white p-2 rounded-full transition"
                        aria-label="الصورة التالية"
                        title="الصورة التالية"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                    </>
                  )}
                </div>

                {/* ✅ thumbnails */}
                <div className="p-4">
                  {hasImages ? (
                    <div className="grid grid-cols-5 gap-3">
                      {images.slice(0, 10).map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`relative rounded-xl overflow-hidden border transition ${
                            idx === safeIndex
                              ? "border-blue-500 ring-2 ring-blue-500/30"
                              : "border-slate-200 dark:border-slate-800 hover:border-blue-400/70"
                          }`}
                          onClick={() => setSelectedImageIndex(idx)}
                          aria-label={`اختيار صورة ${idx + 1}`}
                          title={`صورة ${idx + 1}`}
                        >
                          <img
                            src={img}
                            alt={`صورة ${idx + 1}`}
                            className="w-full h-20 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/placeholder-car.jpg";
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      لا توجد صور لهذه السيارة.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ Right: details */}
            <div className="lg:col-span-1 space-y-6">
              {/* ✅ Auction box */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                {firstAuction ? (
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
                      السعر الحالي
                    </p>
                    <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                      {formatSAR(currentBid)}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                        <p className="text-slate-500 dark:text-slate-400">
                          سعر الإفتتاح
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatSAR(minimumBid)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                        <p className="text-slate-500 dark:text-slate-400">
                          عدد المزايدات
                        </p>
                        <p className="mt-1 font-semibold">
                          {bidsCount.toLocaleString("ar-SA")}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="text-lg font-bold">غير متاح للمزايدة</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                      هذه السيارة غير مدرجة في مزاد حالياً.
                    </p>
                  </div>
                )}
              </div>

              {/* ✅ Car details */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-2xl font-extrabold">{carTitle}</h2>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1 text-xs text-slate-600 dark:text-slate-300">
                    <CarIcon className="h-4 w-4" />#{item.id}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <DetailRow icon={CarIcon} label="الماركة" value={item.make} />
                  <DetailRow icon={Tag} label="الموديل" value={item.model} />
                  <DetailRow
                    icon={Calendar}
                    label="سنة الصنع"
                    value={item.year}
                  />
                  <DetailRow
                    icon={Gauge}
                    label="رقم العداد"
                    value={
                      item.odometer != null
                        ? `${Number(item.odometer).toLocaleString("ar-SA")} كم`
                        : "—"
                    }
                  />
                  <DetailRow
                    icon={Paintbrush}
                    label="اللون"
                    value={item.color}
                  />
                  <DetailRow
                    icon={Fuel}
                    label="نوع الوقود"
                    value={item.engine}
                  />
                  <DetailRow
                    icon={Wrench}
                    label="حالة السيارة"
                    value={normalizeLabel(item.condition)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type DetailRowProps = {
  icon?: any;
  label: string;
  value: any;
};

function DetailRow({ icon, label, value }: DetailRowProps) {
  const Icon = icon;
  const display =
    value === null || value === undefined || String(value).trim() === ""
      ? "—"
      : String(value);

  return (
    <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center text-slate-600 dark:text-slate-300">
        {Icon && (
          <Icon className="h-4 w-4 ml-2 text-slate-400 dark:text-slate-500" />
        )}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 text-left">
        {display}
      </p>
    </div>
  );
}
