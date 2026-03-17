// =============================================================
// 🏗️ الصفحة الرئيسية – DASMe | Digital Auctions Specialists Markets
// =============================================================

"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Car,
  Shield,
  Users,
  Award,
  PlayCircle,
  Clock,
  DollarSign,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
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
        <div className="flex flex-col items-center gap-3 mb-6 md:mb-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            البث المباشر
          </h2>
          <p className="text-sm text-foreground/70 max-w-xl">
            بث مباشر للمزادات والبرامج
          </p>
          {data?.is_live ? <LiveBadge /> : null}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl overflow-hidden shadow-sm mx-auto w-full max-w-3xl"
        >
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
            {data?.description ? (
              <p className="text-foreground/80 text-sm max-w-2xl">
                {data.description}
              </p>
            ) : null}
            <div className="flex items-center gap-3 flex-shrink-0">
              <a
                href="/broadcast"
                className="inline-flex items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 transition"
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
  const { resolvedTheme } = useTheme();

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

  const carsCount = statsData?.cars_count ?? 0;
  const usersCount = statsData?.active_users_count ?? 0;
  const hasMeaningfulData = carsCount > 0 || usersCount > 0;
  const hideInLight =
    resolvedTheme === "light" && !loading && (!statsData || !hasMeaningfulData);
  if (hideInLight) return null;

  const cards = [
    { value: carsCount, label: "السيارات", icon: <Car className="w-6 h-6 md:w-8 md:h-8" />, color: "bg-primary" },
    { value: usersCount, label: "المستخدمين النشطين", icon: <Users className="w-6 h-6 md:w-8 md:h-8" />, color: "bg-primary" },
  ];

  return (
    <section className="py-16 md:py-20 bg-white dark:bg-background border-t border-slate-200 dark:border-border">
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

// ========== قسم مجلس السوق (معاينة المقالات) ==========

type MarketArticlePreview = {
  id: number | string;
  title_ar: string;
  excerpt_ar?: string | null;
  slug: string;
  read_time?: number;
  category?: { name_ar: string } | null;
};

const MarketCouncilPreviewSection = () => {
  const [articles, setArticles] = useState<MarketArticlePreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const res = await api.get("/api/market-council/articles", {
          params: { per_page: 3 },
        });
        const data = res?.data?.data ?? res?.data;
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        if (mounted) setArticles(list.slice(0, 3));
      } catch {
        if (mounted) setArticles([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  if (loading && articles.length === 0) {
    return (
      <section className="py-16 md:py-20 bg-white dark:bg-background border-t border-slate-200 dark:border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">من مجلس السوق</h2>
            <p className="text-foreground/70 max-w-xl mx-auto">ثقافة التاجر المحترف</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 h-48 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-white dark:bg-background border-t border-slate-200 dark:border-border">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 md:mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            من مجلس السوق
          </motion.h2>
          <p className="text-sm md:text-base text-foreground/70 max-w-xl mx-auto">
            ثقافة التاجر المحترف — قصص السوق وعلم المزاد
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {articles.map((art, index) => (
            <motion.div
              key={art.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <a
                href={`/market-council/${art.slug}`}
                className="block bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group h-full"
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                      {art.category?.name_ar || "—"}
                    </span>
                    <span className="text-xs text-foreground/50 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {art.read_time ?? 1} د
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {art.title_ar}
                  </h3>
                  <p className="text-sm text-foreground/70 line-clamp-2 flex-1">
                    {(art.excerpt_ar || "").trim() || "—"}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-primary font-bold text-sm">
                    اقرأ المزيد
                    <ArrowLeft className="w-4 h-4 transition group-hover:-translate-x-0.5" />
                  </span>
                </div>
              </a>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="/market-council"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary px-6 py-3 text-primary font-bold hover:bg-primary/5 transition-all"
          >
            <FileText className="w-5 h-5" />
            عرض كل المقالات
          </a>
        </div>
      </div>
    </section>
  );
};

// ========== قسم المزايا ==========

const BenefitsSection = () => {
  const benefits = [
    { title: "مزادات متاحة 24/7", description: "نظام مزادات يعمل على مدار الساعة", icon: <Shield className="w-7 h-7 md:w-8 md:h-8" /> },
    { title: "فحص في ورش معتمدة", description: "السيارات تخضع لفحص قبل المزاد", icon: <DollarSign className="w-7 h-7 md:w-8 md:h-8" /> },
    { title: "شحن مع تتبع", description: "خدمة شحن مع إمكانية متابعة الشحنة", icon: <Clock className="w-7 h-7 md:w-8 md:h-8" /> },
    { title: "نظام تسعير واضح", description: "شفافية في الأسعار والعمولات", icon: <Award className="w-7 h-7 md:w-8 md:h-8" /> },
  ];

  return (
    <section className="py-16 md:py-20 bg-white dark:bg-background border-t border-slate-200 dark:border-border">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="text-center mb-10 md:mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            ما يميز داسم
          </motion.h2>
          <p className="text-sm md:text-base text-foreground/70 max-w-2xl mx-auto">
            تجربة مزادات واضحة وموثوقة
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
              className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center px-6 py-8 md:px-7 md:py-9"
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
  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAFC] dark:bg-background">
      {/* Hero Section - Arabic-first, honest, focused */}
      <section className="relative overflow-hidden bg-[#F7FAFC] dark:bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-14 md:py-18 lg:py-22 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary leading-tight">
              منصة للأسواق الرقمية المتخصصة
            </h1>
            <p className="text-secondary text-base md:text-lg max-w-2xl mx-auto mt-4 leading-relaxed">
              منصة وطنية رقمية شاملة تعيد تعريف تجربة المزادات عبر تقنيات ذكية
            </p>
          </motion.div>
        </div>
      </section>

      {/* ✅ اختر السوق المتخصص */}
      <section className="py-8 md:py-12 bg-white dark:bg-background border-y border-slate-200 dark:border-border shadow-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <MarketTypeNav />
        </div>
      </section>

      {/* قسم البث الاحترافي */}
      <LiveBroadcastSection />

      {/* ✅ Stats (Dynamic) */}
      <StatsSection />

      <BenefitsSection />

      <MarketCouncilPreviewSection />

      {/* Footer wrapper: extends navy to bottom of viewport in light mode */}
      <div className="mt-auto flex-1 min-h-0 bg-[#06162a] dark:bg-transparent">
        <Footer />
      </div>
    </div>
  );
}
