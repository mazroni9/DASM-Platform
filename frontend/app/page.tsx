// =============================================================
// 🏗️ الصفحة الرئيسية – DASMe | Digital Auctions Specialists Markets
// =============================================================

"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ar";
import {
  Car,
  Shield,
  TrendingUp,
  Users,
  Award,
  Radio,
  PlayCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import { motion } from "framer-motion";
import Footer from "@/components/shared/Footer";
import MarketTypeNav from "@/components/shared/MarketTypeNav";
import api from "@/lib/axios";

// ========== Utilities ==========

function toEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}?rel=0`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}?rel=0`;
    }

    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (host === "player.vimeo.com") return url;

    return url;
  } catch {
    return null;
  }
}

// ========== CountUp (أنيميشن عداد) ==========

const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);

const CountUp = ({
  value,
  duration = 1200,
}: {
  value: number;
  duration?: number;
}) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    // ✅ reduce motion support
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (prefersReduced) {
      setDisplay(value);
      return;
    }

    const from = fromRef.current;
    const to = value;

    startRef.current = null;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      const eased = easeOutCubic(p);

      const next = Math.round(from + (to - from) * eased);
      setDisplay(next);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <span suppressHydrationWarning>{formatNumber(display)}</span>;
};

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

    const delay = isDeleting ? deletingSpeed : typingSpeed;

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
      className="text-foreground text-lg md:text-xl max-w-3xl mx-auto mt-5 md:mt-6 leading-relaxed"
      suppressHydrationWarning
    >
      {text}
      {!isDeleting && charIndex === current.length ? (
        <span className="inline-block w-[2px] h-[0.9em] align-[-0.12em] ml-1 animate-pulse bg-primary" />
      ) : null}
    </p>
  );
};

// ========== عدّ تنازلي بسيط للمزادات ==========

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
  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/90 text-white shadow-lg animate-pulse">
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
    </span>
    <span className="text-xs font-bold tracking-wide">{label}</span>
  </div>
);

const LiveBroadcastSection = () => {
  const [data, setData] = useState<Broadcast | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const res = await api.get("/api/broadcast");
        const b = res?.data?.data ?? null;
        if (mounted) setData(b);
      } catch {
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
        <div className="absolute -top-40 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="flex flex-col items-center gap-4 mb-8 md:mb-10 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Radio className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground">
                القناة الرئيسية – بث مباشر
              </h2>
              <p className="text-sm md:text-base mt-1 font-medium text-emerald-700 dark:text-emerald-300">
                ترفيه + بزنس جاد + مزادات رقمية لحظية + بودكاست أعمال
              </p>
            </div>
          </div>
          {data?.is_live ? <LiveBadge /> : null}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`bg-card/60 backdrop-blur border border-border rounded-2xl overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)] mx-auto w-full transition-all duration-300 ${
            expanded ? "max-w-5xl" : "max-w-3xl"
          }`}
        >
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-primary" />
              <span className="text-foreground font-semibold text-sm md:text-base line-clamp-1">
                {data?.title || "البث المباشر من DASM"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {data?.is_live ? <LiveBadge /> : null}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="hidden sm:inline-flex items-center justify-center rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-border/60 transition"
              >
                {expanded ? "تصغير البث" : "تكبير مساحة البث"}
              </button>
            </div>
          </div>

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

// ========== قسم الإحصائيات (Dynamic from Backend) ==========

type HomeStats = {
  cars_count: number;
  active_users_count: number;
};

const StatsSection = () => {
  const [statsData, setStatsData] = useState<HomeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const res = await api.get("/api/home-stats");
        const data = res?.data?.data ?? null;
        if (mounted) setStatsData(data);
      } catch {
        if (mounted) setStatsData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  const cards = [
    {
      value: statsData?.cars_count ?? 0,
      label: "السيارات",
      icon: <Car className="w-6 h-6 md:w-8 md:h-8" />,
      color: "bg-primary",
    },
    {
      value: statsData?.active_users_count ?? 0,
      label: "المستخدمين النشطين",
      icon: <Users className="w-6 h-6 md:w-8 md:h-8" />,
      color: "bg-primary",
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 max-w-3xl mx-auto">
          {cards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="text-center"
            >
              <div
                className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl ${stat.color} flex items-center justify-center text-white mx-auto mb-4 md:mb-6 shadow-lg`}
              >
                {stat.icon}
              </div>

              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">
                {loading ? (
                  <span className="inline-block h-8 w-28 rounded-lg bg-border/60 animate-pulse" />
                ) : (
                  <CountUp value={stat.value} />
                )}
              </h3>

              <p className="text-foreground text-sm md:text-base">{stat.label}</p>
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
    { title: "مزادات متطورة على مدار الساعة", description: "نظام مزادات حديث، ومتاح 24/7 لراحتك", icon: <Shield className="w-7 h-7 md:w-8 md:h-8" /> },
    { title: "فحص في ورش معتمدة", description: "جميع السيارات تخضع لفحص دقيق في ورش معتمدة", icon: <DollarSign className="w-7 h-7 md:w-8 md:h-8" /> },
    { title: "شحن متميز ومتابعة مباشرة لحين الوصول", description: "خدمة شحن موثوقة مع تتبع مباشر لشحنتك", icon: <Clock className="w-7 h-7 md:w-8 md:h-8" /> },
    { title: "أسعار متوازنة لصالح البائع والمشتري", description: "نضمن أفضل الأسعار للطرفين من خلال نظام عادل", icon: <Award className="w-7 h-7 md:w-8 md:h-8" /> },
  ];

  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="text-center mb-10 md:mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-4"
          >
            لماذا تختار داسم-اي؟
          </motion.h2>
          <p className="text-sm md:text-base text-foreground/70 max-w-2xl mx-auto">
            نقدم لك تجربة مزادات استثنائية بمعايير عالية من الجودة والموثوقية
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8" dir="ltr">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="bg-card rounded-[24px] border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center px-6 py-8 md:px-7 md:py-9"
            >
              <div className="mb-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary flex items-center justify-center text-white">
                  {benefit.icon}
                </div>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 leading-snug">
                {benefit.title}
              </h3>
              <p className="text-xs md:text-sm text-foreground/70 leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== الصفحة الرئيسية ==========

export default function Page() {
  const [titleDone, setTitleDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-secondary dark:bg-background">
        <div
          className="
            container mx-auto px-4 sm:px-6
            py-14 md:py-18 lg:py-22
            relative z-10 text-center
          "
        >
          <motion.div
            initial={{ opacity: 0, y: 26 }}
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
        </div>
      </section>

      {/* ✅ اختر السوق المتخصص */}
      <section className="py-8 md:py-12 bg-background border-y border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <MarketTypeNav />
        </div>
      </section>

      {/* قسم البث الاحترافي */}
      <LiveBroadcastSection />

      {/* ✅ Stats (Dynamic) */}
      <StatsSection />

      <BenefitsSection />

      <Footer />
    </>
  );
}
