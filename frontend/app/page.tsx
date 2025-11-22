// =============================================================
// 🏗️ الصفحة الرئيسية – DASMe | Digital Auctions Specialists Markets
// ✨ تصميم احترافي عالمي – معالجة أخطاء runtime + حماية الهيدرِيشِن + قسم البث الاحترافي
// =============================================================

"use client";

import React, { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ar";
import {
  Clock,
  Car,
  Shield,
  TrendingUp,
  Users,
  Award,
  CheckCircle,
  ArrowRight,
  Radio,
  PlayCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import Footer from "@/components/shared/Footer";
import MarketTypeNav from "@/components/shared/MarketTypeNav";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";

// ========== Utilities ==========
function toEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    // YouTube
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}?rel=0`; // clean
      if (u.pathname.startsWith("/embed/")) return url;
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}?rel=0`;
    }
    // Vimeo (basic)
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (host === "player.vimeo.com") return url;
    return url; // assume embeddable
  } catch {
    return null;
  }
}

// ========== typing effect للعنوان الرئيسي (مرة واحدة) ==========
const TypingMainTitle = ({
  text,
  speed = 60,
  onDone,
}: {
  text: string;
  speed?: number;
  onDone: () => void;
}) => {
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (charIndex < text.length) {
      const id = setTimeout(() => setCharIndex((i) => i + 1), speed);
      return () => clearTimeout(id);
    } else {
      onDone?.();
    }
  }, [charIndex, text, speed, onDone]);

  const displayed = text.slice(0, charIndex);

  return (
    <h1
      className="text-3xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight"
      suppressHydrationWarning
    >
      {displayed}
      {charIndex < text.length ? (
        <span className="inline-block w-[2px] h-[0.9em] align-[-0.12em] ml-1 animate-pulse bg-primary" />
      ) : null}
    </h1>
  );
};

// ========== typing & deleting loop للجمل الدوّارة ==========
const RotatingSentences = ({
  start,
  sentences = [
    "اخترنا لك نخبة من الأسواق الرقمية التي تلبي احتياجاتك.",
    "نمنحك فرصًا لا تجدها في مكان آخر.",
    "كل ما تبحث عنه من أصول ومنتجات مستعملة ومجددة.",
  ],
}: {
  start: boolean;
  sentences?: string[];
}) => {
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!start) return;
    setSentenceIndex(0);
    setCharIndex(0);
    setIsDeleting(false);
  }, [start]);

  useEffect(() => {
    if (!start) return;

    const current = sentences[sentenceIndex];
    const typingSpeed = 50;
    const deletingSpeed = 40;
    const pauseAtEnd = 1400;

    let delay = isDeleting ? deletingSpeed : typingSpeed;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < current.length) setCharIndex((i) => i + 1);
        else setTimeout(() => setIsDeleting(true), pauseAtEnd);
      } else {
        if (charIndex > 0) setCharIndex((i) => i - 1);
        else {
          setIsDeleting(false);
          setSentenceIndex((i) => (i + 1) % sentences.length);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [start, charIndex, isDeleting, sentenceIndex, sentences]);

  if (!start) return null;

  const current = sentences[sentenceIndex];
  const text = current.slice(0, charIndex);

  return (
    <p
      className="text-foreground text-lg md:text-xl max-w-3xl mx-auto mt-6 leading-relaxed"
      suppressHydrationWarning
    >
      {text}
      {!isDeleting && charIndex === current.length ? (
        <span className="inline-block w-[2px] h-[0.9em] align-[-0.12em] ml-1 animate-pulse bg-primary" />
      ) : null}
    </p>
  );
};

// ========== العد التنازلي (تصميم فاخر) ==========
const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-14 h-14 md:w-18 md:h-18 lg:w-20 lg:h-20">
      <motion.div
        key={value}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="absolute inset-0 bg-secondary rounded-xl flex items-center justify-center shadow-lg"
      >
        <span
          className="text-white text-xl md:text-2xl lg:text-3xl font-bold"
          suppressHydrationWarning
        >
          {value}
        </span>
      </motion.div>
    </div>
    <span className="mt-2 text-xs md:text-sm text-foreground font-medium">
      {label}
    </span>
  </div>
);

const AuctionCountdown = ({ endTime }: { endTime?: string }) => {
  dayjs.extend(relativeTime);
  dayjs.locale("ar");
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!endTime) {
      setTimeLeft("");
      return;
    }
    const updateCountdown = () => {
      const now = dayjs();
      const end = dayjs(endTime);
      if (!end.isValid()) return setTimeLeft("");
      const diff = end.diff(now);
      if (diff <= 0) return setTimeLeft("انتهى المزاد");
      setTimeLeft(end.fromNow(true));
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 60 * 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <span suppressHydrationWarning>
      {timeLeft ? `ينتهي خلال ${timeLeft}` : "—"}
    </span>
  );
};

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{
    أيام: number;
    ساعات: number;
    دقائق: number;
    ثواني: number;
  } | null>(null);
  useEffect(() => {
    const calculate = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return null;
      return {
        أيام: Math.floor(diff / (1000 * 60 * 60 * 24)),
        ساعات: Math.floor((diff / (1000 * 60 * 60)) % 24),
        دقائق: Math.floor((diff / 1000 / 60) % 60),
        ثواني: Math.floor((diff / 1000) % 60),
      };
    };
    setTimeLeft(calculate());
    const id = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  if (!timeLeft)
    return (
      <div
        className="text-secondary font-bold text-sm md:text-base"
        suppressHydrationWarning
      >
        الانطلاقة قريبة!
      </div>
    );
  return (
    <div
      className="flex items-center gap-2 md:gap-4 lg:gap-6"
      suppressHydrationWarning
    >
      <CountdownUnit value={timeLeft.أيام} label="أيام" />
      <span className="text-foreground text-sm md:text-base">:</span>
      <CountdownUnit value={timeLeft.ساعات} label="ساعات" />
      <span className="text-foreground text-sm md:text-base">:</span>
      <CountdownUnit value={timeLeft.دقائق} label="دقائق" />
      <span className="text-foreground text-sm md:text-base">:</span>
      <CountdownUnit value={timeLeft.ثواني} label="ثواني" />
    </div>
  );
};

// ========== قسم البث الاحترافي ==========
type Broadcast = {
  title?: string | null;
  description?: string | null;
  youtube_embed_url?: string | null;
  thumbnail?: string | null;
  is_live?: boolean | null;
  started_at?: string | null;
};

const LiveBadge = ({ label = "مباشر" }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/90 text-white shadow-lg">
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
    </span>
    <span className="text-xs font-bold tracking-wide">{label}</span>
  </div>
);

const LiveBroadcastSection = () => {
  const [data, setData] = useState<Broadcast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const res = await api.get("/api/broadcast");
        const b = res?.data?.data ?? null;
        if (mounted) setData(b);
      } catch (e) {
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const embedSrc = useMemo(
    () => toEmbedUrl(data?.youtube_embed_url || undefined),
    [data?.youtube_embed_url]
  );

  return (
    <section className="py-14 md:py-20 relative overflow-hidden border-y border-border bg-gradient-to-b from-background via-background to-background">
      <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)]">
        <div className="absolute -top-40 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-20 h-72 w-72 rounded-full bg-secondary/10 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 md:mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Radio className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground">
                القناة الرئيسية – بث مباشر
              </h2>
              <p className="text-sm md:text-base text-foreground/70 mt-1">
                ترفيه + بزنس جاد + مزادات رقمية لحظية
              </p>
            </div>
          </div>
          {data?.is_live ? <LiveBadge /> : null}
        </div>

        {/* Player card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-card/60 backdrop-blur border border-border rounded-2xl overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border">
            <div className="flex items_center gap-2">
              <PlayCircle className="w-5 h-5 text-primary" />
              <span className="text-foreground font-semibold text-sm md:text-base line-clamp-1">
                {data?.title || "البث المباشر من DASM"}
              </span>
            </div>
            {data?.is_live ? <LiveBadge /> : null}
          </div>

          {/* Video area */}
          <div className="relative aspect-video bg-black">
            {loading ? (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
            ) : embedSrc ? (
              <iframe
                key={embedSrc}
                src={embedSrc}
                title={data?.title || "DASM Live"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                <div>
                  <p className="text-lg md:text-xl font-bold text-foreground">
                    لا يوجد بث مباشر حاليًا
                  </p>
                  <p className="text-foreground/70 mt-1">
                    تحقّق لاحقًا أو تابع قنواتنا الاجتماعية
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-foreground/80 text-sm md:text-base max-w-3xl">
              {data?.description ||
                "في قناتنا خيط رفيع يفصل بين الترفيه والمتعة... وبين البزنس الجاد والمزادات الرقمية الدقيقة."}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="/broadcast"
                className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-border/60 transition"
              >
                أرشيف البثوث
              </a>
              {embedSrc ? (
                <a
                  href={embedSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-bold hover:bg-primary/90 transition"
                >
                  <PlayCircle className="w-4 h-4" />
                  فتح في نافذة جديدة
                </a>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ========== قسم السيارات المميزة ==========
type CarType = {
  id: string | number;
  make?: string;
  model?: string;
  year?: string | number;
  images?: string[] | null;
  active_auction?: {
    end_time?: string | null;
    current_bid?: number | string | null;
  } | null;
  total_bids?: number | string | null;
};

const FeaturedCars = () => {
  const [cars, setCars] = useState<CarType[]>([]);
  useEffect(() => {
    let mounted = true;
    const fetchFeaturedCars = async () => {
      try {
        const response = await api.get("/api/featured-cars");
        const data = response?.data?.data ?? [];
        if (mounted) setCars(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setCars([]);
      }
    };
    fetchFeaturedCars();
    return () => {
      mounted = false;
    };
  }, []);

  return cars && cars.length > 0 ? (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-3 md:mb-4"
          >
            سيارات مميزة في المزاد
          </motion.h2>
          <p className="text-foreground max-w-2xl mx-auto text-base md:text-lg px-4">
            اكتشف مجموعة مختارة من أفضل السيارات المتاحة للمزاد الآن
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {cars.map((car, index) => {
            const title = [car.make, car.model, car.year]
              .filter(Boolean)
              .join(" ");
            const imageSrc =
              Array.isArray(car.images) && car.images.length > 0 && car.images[0]
                ? car.images[0]
                : "/placeholder-car.jpg";
            const currentBid = car?.active_auction?.current_bid ?? "—";
            const totalBids = car?.total_bids ?? 0;
            const endTime = car?.active_auction?.end_time ?? undefined;

            return (
              <motion.div
                key={car.id ?? index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="relative h-40 sm:h-48 overflow-hidden">
                  <img
                    src={imageSrc}
                    alt={title || "Car"}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div
                    className="absolute top-3 right-3 bg-secondary text-white px-2 py-1 rounded-full text-xs sm:text-sm font-bold"
                    suppressHydrationWarning
                  >
                    <AuctionCountdown endTime={endTime} />
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 line-clamp-2">
                    {title || "سيارة"}
                  </h3>
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <span
                      className="text-secondary font-bold text-base sm:text-lg"
                      suppressHydrationWarning
                    >
                      {currentBid} ر.س
                    </span>
                    <span
                      className="text-foreground text-xs sm:text-sm"
                      suppressHydrationWarning
                    >
                      {totalBids} مزايدة
                    </span>
                  </div>
                  <LoadingLink href={`/carDetails/${car.id}`}>
                    <button className="w-full bg-primary hover:bg-opacity-90 text-white py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base">
                      شارك في المزاد
                    </button>
                  </LoadingLink>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-10 md:mt-12">
          <motion.a
            href="/auctions"
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 bg-card text-primary font-bold py-3 px-6 rounded-xl border border-border hover:bg-border transition-all duration-300 text-sm md:text-base"
          >
            عرض جميع المزادات
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </motion.a>
        </div>
      </div>
    </section>
  ) : (
    <></>
  );
};

// ========== قسم خطوات المزاد (Timeline) ==========
const AuctionTimeline = () => {
  const steps = [
    {
      step: 1,
      title: "التسجيل في المنصة",
      description: "أنشئ حسابك في داسم بخطوات بسيطة وسريعة",
      icon: <Users className="w-5 h-5 md:w-6 md:h-6" />,
    },
    {
      step: 2,
      title: "اختر السيارة المناسبة",
      description: "تصفح آلاف السيارات واختر ما يناسب احتياجاتك",
      icon: <Car className="w-5 h-5 md:w-6 md:h-6" />,
    },
    {
      step: 3,
      title: "شارك في المزاد",
      description: "ضع مزايدتك وتابع المنافسة حتى نهاية المزاد",
      icon: <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />,
    },
    {
      step: 4,
      title: "احصل على سيارتك",
      description: "استلم سيارتك الجديدة بعد فوزك في المزاد",
      icon: <Award className="w-5 h-5 md:w-6 md:h-6" />,
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-3 md:mb-4"
          >
            كيف تشارك في المزاد؟
          </motion.h2>
          <p className="text-foreground max-w-2xl mx-auto text-base md:text-lg px-4">
            خطوات بسيطة تفصلك عن امتلاك السيارة التي تحلم بها
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`flex ${
                index % 2 === 0 ? "flex-row" : "flex-row-reverse"
              } items-center mb-8 md:mb-12`}
            >
              <div className="flex-1">
                <div
                  className={`bg-card p-4 sm:p-6 rounded-2xl border border-border ${
                    index % 2 === 0
                      ? "mr-4 md:mr-8"
                      : "ml-4 md:ml-8"
                  }`}
                >
                  <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center text-white">
                      {step.icon}
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-foreground text-sm md:text-base">
                    {step.description}
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-lg md:text-xl z-10 relative">
                  {step.step}
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute top-12 md:top-16 left-1/2 transform -translate-x-1/2 w-1 h-8 md:h-12 bg-secondary"></div>
                )}
              </div>
              <div className="flex-1"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== قسم الإحصائيات ==========
const StatsSection = () => {
  const stats = [
    {
      value: "10,000+",
      label: "سيارة مباعة",
      icon: <Car className="w-6 h-6 md:w-8 md:h-8" />,
      color: "bg-primary",
    },
    {
      value: "50,000+",
      label: "مستخدم نشط",
      icon: <Users className="w-6 h-6 md:w-8 md:h-8" />,
      color: "bg-primary",
    },
    {
      value: "95%",
      label: "رضا العملاء",
      icon: <Award className="w-6 h-6 md:w-8 md:h-8" />,
      color: "bg-secondary",
    },
    {
      value: "2.5B+",
      label: "قيمة الصفقات",
      icon: <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />,
      color: "bg-secondary",
    },
  ];
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4"
          >
            أرقام تُحدث الفرق
          </motion.h2>
          <p className="text-foreground max-w-2xl mx-auto text-base md:text-lg px-4">
            إحصائيات حقيقية تثبت جودة خدماتنا وثقة عملائنا
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div
                className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl ${stat.color} flex items-center justify-center text-white mx-auto mb-4 md:mb-6 shadow-lg`}
              >
                {stat.icon}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">
                {stat.value}
              </h3>
              <p className="text-foreground text-sm md:text-base">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== قسم المزايا ==========
const BenefitsSection = () => {
  const benefits = [
    {
      title: "ضمان الجودة",
      description: "جميع السيارات تخضع لفحص دقيق قبل العرض",
      icon: <Shield className="w-6 h-6 md:w-8 md:h-8" />,
    },
    {
      title: "أسعار تنافسية",
      description: "احصل على أفضل الأسعار من خلال نظام المزادات",
      icon: <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />,
    },
    {
      title: "شفافية كاملة",
      description: "جميع المعلومات متاحة وواضحة للجميع",
      icon: <CheckCircle className="w-6 h-6 md:w-8 md:h-8" />,
    },
    {
      title: "دعم متكامل",
      description: "فريق دعم فني وإداري على مدار الساعة",
      icon: <Users className="w-6 h-6 md:w-8 md:h-8" />,
    },
  ];
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-3 md:mb-4"
          >
لماذا تختار داسم-اي؟          </motion.h2>
          <p className="text-foreground max-w-2xl mx-auto text-base md:text-lg px-4">
           نقدم لك تجربة مزادات استثنائية بمعايير عالية من الجودة والموثوقية
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-2xl p-4 sm:p-6 border border-border hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-primary flex items-center justify-center text-white mb-3 md:mb-4">
                {benefit.icon}
              </div>
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-foreground text-sm md:text-base">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== قسم الأسئلة الشائعة ==========
const FAQSection = () => {
  const faqs = [
    {
      question: "كيف يمكنني المشاركة في المزاد؟",
      answer:
        "يمكنك المشاركة بالتسجيل في المنصة، ثم اختيار السيارة المناسبة ووضع مزايدتك خلال فترة المزاد.",
    },
    {
      question: "هل يمكنني استرجاع السيارة بعد الشراء؟",
      answer:
        "نعم، يوجد سياسة استرجاع محددة توضح شروط وإجراءات استرجاع السيارة في حال وجود عيوب خفية.",
    },
    {
      question: "ما هي طرق الدفع المتاحة؟",
      answer:
        "نوفر طرق دفع متعددة تشمل التحويل البنكي وبطاقات الائتمان والدفع الإلكتروني عبر منصات آمنة.",
    },
    {
      question: "كيف يتم فحص السيارات قبل المزاد؟",
      answer:
        "جميع السيارات تخضع لفحص فني دقيق يشمل المحرك، الهيكل، النظام الكهربائي، والتأكد من عدم وجود عيوب هيكلية.",
    },
  ];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const toggleFAQ = (index: number) =>
    setActiveIndex(activeIndex === index ? null : index);
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-3 md:mb-4"
          >
            الأسئلة الشائعة
          </motion.h2>
          <p className="text-foreground max-w-2xl mx-auto text-base md:text-lg px-4">
            إجابات على أكثر الأسئلة شيوعًا حول منصة داسم للمزادات
          </p>
        </div>
        <div className="space-y-3 md:space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-xl md:rounded-2xl overflow-hidden border border-border hover:border-border transition-colors duration-300"
            >
              <button
                className="w-full text-right p-4 md:p-6 flex justify-between items-center text-foreground font-medium text-base md:text-lg hover:bg-border transition-colors duration-200"
                onClick={() => toggleFAQ(index)}
                aria-expanded={activeIndex === index}
                aria-controls={`faq-panel-${index}`}
              >
                <span className="flex-1 text-right pr-3 md:pr-4">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: activeIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              </button>
              <motion.div
                id={`faq-panel-${index}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: activeIndex === index ? "auto" : 0,
                  opacity: activeIndex === index ? 1 : 0,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-4 md:p-6 pt-0 text-foreground border-t border-border text-sm md:text-base leading-relaxed">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== الصفحة الرئيسية ==========
export default function Page() {
  const targetDate = "July 1, 2025 01:00:00";
  const [titleDone, setTitleDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* Hero Section – فاخر وغامر */}
      <section className="relative overflow-hidden bg-secondary dark:bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-20 md:py-24 lg:py-32 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <TypingMainTitle
              text="Digital Auctions Specialists Markets"
              speed={60}
              onDone={() => setTitleDone(true)}
            />
            <RotatingSentences start={mounted && titleDone} />
            <p className="text-foreground text-base md:text-lg lg:text-xl max-w-3xl mx-auto mt-4 md:mt-6 leading-relaxed px-4">
              منصة وطنية رقمية شاملة تُعيد تعريف تجربة المزادات عبر تقنيات
              ذكية، شفافية مطلقة، ووصول عالمي.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 md:mt-12 flex justify-center"
          >
            <div className="bg-card px-4 md:px-6 py-3 md:py-4 rounded-2xl border border-border shadow-xl">
              <div className="flex items-center gap-2 md:gap-3 justify-center">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
                <span className="text-foreground font-medium text-sm md:text-base">
                  الانطلاقة في:
                </span>
              </div>
              <div className="mt-2 md:mt-3" suppressHydrationWarning>
                <CountdownTimer targetDate={targetDate} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* أنواع الأسواق */}
      <section className="py-8 md:py-12 bg-background border-y border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <MarketTypeNav />
        </div>
      </section>

      {/* قسم البث الاحترافي */}
      <LiveBroadcastSection />

      {/* الأقسام الجديدة لصفحة مزادات السيارات */}
      <FeaturedCars />
      <AuctionTimeline />
      <StatsSection />
      {/* تم حذف CarTypes هنا */}
      <BenefitsSection />
      <FAQSection />

      <Footer />
    </>
  );
}
