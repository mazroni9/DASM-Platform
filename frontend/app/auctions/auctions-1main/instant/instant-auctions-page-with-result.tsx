'use client';

// ✅ صفحة تفاصيل سيارة داخل السوق الفوري (تصميم احترافي)
// المسار المقترح للاستخدام المباشر مع useParams:
// app/auctions/auctions-1main/instant/[id]/page.tsx
// أو يمكن استيراد هذا الملف كـ Component داخل صفحة أخرى وتمرير id يدويًا.

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingLink from '@/components/LoadingLink';
import {
  Car as CarIcon,
  Calendar,
  Gauge,
  Shield,
  Fuel,
  Palette,
  BadgeCheck,
  Video,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
  TrendingUp,
  Plus,
  Minus,
} from 'lucide-react';

// =====================
// الأنواع والمرافق
// =====================
interface Car {
  id: number;
  الماركة: string;
  الموديل: string;
  'سنة الصنع': number;
  'رقم اللوحة': string;
  'رقم العداد': number;
  'حالة السيارة': string;
  'لون السيارة': string;
  'نوع الوقود': string;
  'اخر سعر': number;
  'عدد الصور'?: number;
  'رابط تقرير الفحص'?: string;
  'رابط البث'?: string;
}

const sar = new Intl.NumberFormat('ar-SA', {
  style: 'currency',
  currency: 'SAR',
  maximumFractionDigits: 0,
});

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent';

// =====================
// المكوّن الرئيسي
// =====================
export default function InstantAuctionCarDetailsPage() {
  const params = useParams();
  const idRaw = (params?.id ?? '') as string | string[];
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;

  const [car, setCar] = useState<Car | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // معرض الصور
  const images = useMemo(() => {
    const count = car?.['عدد الصور'] ?? 0;
    const n = Number.isFinite(count) && count! > 0 ? count! : 6; // افتراضيًا 6 صور إن لم يُذكر العدد
    return Array.from({ length: n }, (_, i) => `/auctionsPIC/main-instantPIC/${car?.id ?? id}_${i + 1}.jpg`);
  }, [car, id]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const openLightbox = useCallback((idx: number) => {
    setActiveIndex(idx);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const nextImage = useCallback(() => {
    setActiveIndex((p) => (p + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setActiveIndex((p) => (p - 1 + images.length) % images.length);
  }, [images.length]);

  // المزايدة
  const [bid, setBid] = useState<number | ''>('');
  const lastPrice = car?.['اخر سعر'] ?? 0;
  const minBid = lastPrice + 1;

  const quickSteps = [100, 300, 500, 750, 1000];

  const applyStep = (s: number) => {
    const base = typeof bid === 'number' && bid > lastPrice ? bid : minBid;
    setBid(base + s);
  };

  const decStep = (s: number) => {
    if (typeof bid !== 'number') return;
    const v = Math.max(minBid, bid - s);
    setBid(v);
  };

  const validBid = typeof bid === 'number' && bid > lastPrice;

  const submitBid = () => {
    if (!validBid) return;
    // TODO: اربط الاستدعاء الفعلي API هنا
    alert(`تم تقديم مزايدة بقيمة ${sar.format(bid)} بنجاح`);
  };

  // جلب البيانات
  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/car/${id}`, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error('تعذر تحميل بيانات السيارة');
        return res.json();
      })
      .then((data: Car) => setCar(data))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message || 'حدث خطأ غير متوقع');
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [id]);

  // =====================
  // واجهة المستخدم
  // =====================
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white" dir="rtl">
      {/* Header / breadcrumbs */}
      <div className="border-b border-white/10 bg-gray-900/60 backdrop-blur">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-200">
            <LoadingLink href="/auctions" className="hover:text-white">الأسواق</LoadingLink>
            <span className="text-gray-500">/</span>
            <LoadingLink href="/auctions/auctions-1main/instant" className="hover:text-white">السوق الفوري</LoadingLink>
            <span className="text-gray-500">/</span>
            <span className="text-white font-semibold">تفاصيل السيارة</span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 border border-white/10">
              <Shield className="w-4 h-4" /> بيئة آمنة
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 border border-white/10">
              <TrendingUp className="w-4 h-4" /> مزايدات مباشرة
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* حالات التحميل / الخطأ */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`bg-white/5 border border-white/10 rounded-2xl p-5 h-[420px] ${shimmer}`}></div>
            <div className={`lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 h-[420px] ${shimmer}`}></div>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl p-4">
            <AlertCircle className="w-5 h-5" />
            <p>عذرًا، {error}</p>
          </div>
        )}

        {!loading && car && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* معلومات السيارة */}
            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 lg:order-2"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="p-3 rounded-2xl bg-white/10">
                  <CarIcon className="w-6 h-6 text-white" />
                </span>
                <div>
                  <h2 className="text-xl font-extrabold">{car.الماركة} — {car.الموديل}</h2>
                  <p className="text-gray-300 text-sm">رقم المزاد: #{id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Spec label="سنة الصنع" icon={Calendar} value={String(car['سنة الصنع'])} />
                <Spec label="رقم اللوحة" icon={BadgeCheck} value={car['رقم اللوحة']} />
                <Spec label="قراءة العداد" icon={Gauge} value={`${car['رقم العداد']} كم`} />
                <Spec label="حالة السيارة" icon={Shield} value={car['حالة السيارة']} />
                <Spec label="لون السيارة" icon={Palette} value={car['لون السيارة']} />
                <Spec label="نوع الوقود" icon={Fuel} value={car['نوع الوقود']} />
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-300">آخر سعر</p>
                <p className="text-2xl font-extrabold">{sar.format(car['اخر سعر'] ?? 0)}</p>
              </div>

              {car['رابط تقرير الفحص'] && (
                <LoadingLink
                  href={car['رابط تقرير الفحص']!}
                  target="_blank"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  عرض تقرير الفحص PDF
                </LoadingLink>
              )}
            </motion.aside>

            {/* صور + بث */}
            <section className="lg:col-span-2 grid grid-rows-[auto_auto_auto] gap-4 lg:order-1">
              {/* البث المباشر */}
              {car['رابط البث'] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-3"
                >
                  <div className="flex items-center gap-2 px-2 pb-2 text-gray-200">
                    <Video className="w-4 h-4" />
                    <span className="text-sm">البث المباشر</span>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
                    <iframe
                      src={car['رابط البث']!}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      className="w-full h-full"
                      title="مشغل البث"
                    />
                  </div>
                </motion.div>
              )}

              {/* الصورة الرئيسية */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-3"
              >
                <div className="flex items-center justify-between px-2 pb-2 text-gray-200">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm">معرض الصور</span>
                  </div>
                  <span className="text-xs text-gray-400">{activeIndex + 1} / {images.length}</span>
                </div>
                <div className="relative aspect-[16/10] bg-black/40 rounded-xl overflow-hidden">
                  <img
                    src={images[activeIndex]}
                    alt={`صورة ${activeIndex + 1}`}
                    className="w-full h-full object-contain"
                    onClick={() => openLightbox(activeIndex)}
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />

                  {/* تنقل */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white"
                        aria-label="الصورة السابقة"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white"
                        aria-label="الصورة التالية"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* مصغرات */}
                <div className="mt-3 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      className={`relative aspect-square rounded-lg overflow-hidden border transition ${
                        i === activeIndex ? 'border-blue-500 ring-1 ring-blue-500' : 'border-white/10 hover:border-white/30'
                      }`}
                      aria-label={`عرض صورة ${i + 1}`}
                    >
                      <img
                        src={src}
                        alt={`مُصغّر ${i + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* لوحة المزايدة */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">قدّم مزايدتك الآن</h3>
                  <span className="text-sm text-gray-300">أدنى مزايدة: {sar.format(minBid)}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {quickSteps.map((s) => (
                    <div key={s} className="inline-flex items-center gap-1 bg-white/10 border border-white/10 rounded-xl">
                      <button
                        onClick={() => decStep(s)}
                        className="px-2 py-1 hover:bg-white/10 rounded-l-xl"
                        title={`- ${s}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-2 text-sm">{s}</span>
                      <button
                        onClick={() => applyStep(s)}
                        className="px-2 py-1 hover:bg-white/10 rounded-r-xl"
                        title={`+ ${s}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={bid}
                      onChange={(e) => setBid(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={`أدخل مبلغ أعلى من ${lastPrice}`}
                      className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    disabled={!validBid}
                    onClick={submitBid}
                    className={`px-5 rounded-xl font-semibold transition-colors ${
                      validBid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600/40 cursor-not-allowed'
                    }`}
                  >
                    تأكيد المزايدة
                  </button>
                </div>

                <p className="mt-2 text-sm text-gray-300">
                  آخر سعر حالي: <span className="font-bold">{sar.format(lastPrice)}</span>
                </p>
              </motion.div>
            </section>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="عرض الصورة بالحجم الكامل"
            onClick={closeLightbox}
          >
            <button
              className="absolute top-4 left-4 p-2 rounded-xl bg-white/10 hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
              aria-label="إغلاق"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/10 hover:bg-white/20"
              aria-label="السابق"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <img src={images[activeIndex]} alt="صورة مكبرة" className="max-h-[88vh] max-w-[92vw] object-contain rounded-xl border border-white/10" />
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/10 hover:bg-white/20"
              aria-label="التالي"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// =====================
// مكوّن فرعي لعنصر مواصفة
// =====================
function Spec({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
      <Icon className="w-4 h-4 text-white" />
      <div className="text-gray-200 text-sm">
        <p className="text-gray-400 text-[12px]">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}
