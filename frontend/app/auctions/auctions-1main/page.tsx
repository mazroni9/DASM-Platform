"use client";

import LoadingLink from "@/components/LoadingLink";
import Link from "next/link";
import {
  Timer,
  BellOff,
  Tv,
  Settings,
  ExternalLink,
  ChevronRight,
  Shield,
  Users,
  Clock,
  Tag,
  Radio,
  SignalHigh,
  ArrowRight,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuctionsFinished from "@/components/AuctionsFinished";

import type { LucideIcon } from "lucide-react";

type AuctionId = "live_auction" | "instant_auction" | "late_auction" | "fixed_auction";

type AuctionMain = {
  id: AuctionId;
  name: string;
  slug: "live-market" | "instant" | "silent" | "fixed";
  href: string;
  description: string;
  time: string;
  icon: LucideIcon;
  theme: {
    primary: string;
    from: string;
    to: string;
    ring: string;
    iconBg: string;
    glow: string;
  };
  overlayImg?: string;
  overlayOpacity?: string;
  overlayGradient?: string;
};

const AUCTIONS_MAIN: AuctionMain[] = [
  {
    id: "live_auction",
    name: "الحراج المباشر",
    slug: "live-market",
    href: "/auctions/auctions-1main/live-market",
    description: "بث تفاعلي مباشر تجربة مزايدة فورية وشفافية كاملة.",
    time: "٤:٠٠ م - ٧:٠٠ م",
    icon: Radio,
    theme: {
      primary: "text-rose-500",
      from: "from-rose-500/10",
      to: "to-rose-900/5",
      ring: "group-hover:border-rose-500/50",
      iconBg: "bg-rose-500/10",
      glow: "shadow-rose-500/20",
    },
    overlayImg:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000&auto=format&fit=crop",
    overlayOpacity: "opacity-80",
    overlayGradient: "bg-gradient-to-t from-black/80 via-black/20 to-transparent",
  },
  {
    id: "instant_auction",
    name: "السوق الفوري",
    slug: "instant",
    href: "/auctions/auctions-1main/instant",
    description: "مزادات تنافسية بأسعار تصاعدية تبدأ من سعر الافتتاح.",
    time: "٧:٠٠ م - ١٠:٠٠ م",
    icon: Timer,
    theme: {
      primary: "text-blue-500",
      from: "from-blue-500/10",
      to: "to-blue-900/5",
      ring: "group-hover:border-blue-500/50",
      iconBg: "bg-blue-500/10",
      glow: "shadow-blue-500/20",
    },
    overlayImg: "/grok auctioneer.jpg",
    overlayOpacity: "opacity-80",
    overlayGradient: "bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent",
  },
  {
    id: "late_auction",
    name: "السوق المتأخر",
    slug: "silent",
    href: "/auctions/auctions-1main/silent",
    description: "مزاد هادئ وسرّي دون بث، قدم عرضك وانتظر النتيجة.",
    time: "١٠:٠٠ م - ٤:٠٠ م",
    icon: BellOff,
    theme: {
      primary: "text-violet-500",
      from: "from-violet-500/10",
      to: "to-violet-900/5",
      ring: "group-hover:border-violet-500/50",
      iconBg: "bg-violet-500/10",
      glow: "shadow-violet-500/20",
    },
    overlayImg: "/late_auction.webp",
    overlayOpacity: "opacity-80",
    overlayGradient: "bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent",
  },
  {
    id: "fixed_auction",
    name: "المزاد الثابت",
    slug: "fixed",
    href: "/auctions/auctions-1main/fixed",
    description: "فرصة ثانية للسيارات التي لم تباع بأسعار محددة.",
    time: "السبت (٤ ساعات)",
    icon: Tag,
    theme: {
      primary: "text-emerald-500",
      from: "from-emerald-500/10",
      to: "to-emerald-900/5",
      ring: "group-hover:border-emerald-500/50",
      iconBg: "bg-emerald-500/10",
      glow: "shadow-emerald-500/20",
    },
    overlayImg: "/fixed_auction.jpg",
    overlayOpacity: "opacity-80",
    overlayGradient: "bg-gradient-to-t from-emerald-950/80 via-emerald-900/20 to-transparent",
  },
];

// =====================
// Components
// =====================

const StatChip = ({ icon: Icon, label }: { icon: LucideIcon; label: string }) => (
  <div
    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm
    bg-black/5 border border-black/10 text-slate-700
    dark:bg-white/5 dark:border-white/10 dark:text-slate-300"
  >
    <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
    <span className="text-xs font-bold tracking-wide">{label}</span>
  </div>
);

const PresenterPanel = ({
  current,
  onClose,
  onSelect,
}: {
  current: string;
  onClose: () => void;
  onSelect: (slug: string) => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -20 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{ opacity: 0, height: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="mb-10 w-full overflow-hidden"
    >
      <div className="bg-white/80 dark:bg-[#0f172a]/90 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-black/10 dark:border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                <Tv className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  مركز التحكم (المعلق)
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  إدارة وتوجيه البث المباشر
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors
                text-slate-600 hover:text-slate-900 hover:bg-black/5
                dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/5 rounded-2xl p-5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 block">
                القناة الحالية
              </label>

              <select
                value={current}
                onChange={(e) => onSelect(e.target.value)}
                className="w-full rounded-xl p-3 transition-all appearance-none cursor-pointer
                  bg-white/80 hover:bg-white
                  border border-black/10 text-slate-900
                  focus:ring-2 focus:ring-primary focus:outline-none
                  dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white"
              >
                <option value="" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                  اختر المزاد...
                </option>
                {AUCTIONS_MAIN.map((a) => (
                  <option
                    key={a.slug}
                    value={a.slug}
                    className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white"
                  >
                    {a.name}
                  </option>
                ))}
              </select>

              {current && (
                <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/5">
                  <LoadingLink
                    href={`/auctions/auctions-1main/${current}`}
                    target="_blank"
                    className="flex items-center justify-center w-full gap-2 p-2.5 bg-primary hover:bg-primary/90 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-primary/25"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>فتح البث</span>
                  </LoadingLink>
                </div>
              )}
            </div>

            <div className="md:col-span-8 bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/5 rounded-2xl p-1 relative aspect-video md:aspect-auto overflow-hidden flex items-center justify-center">
              {current ? (
                <iframe
                  className="w-full h-full rounded-xl border border-black/10 dark:border-white/5"
                  src="https://www.youtube.com/embed/live_stream?channel=UCxiLyu5z-T0FanDNotwTJcg&autoplay=0&controls=0"
                  title="معاينة البث"
                  allowFullScreen
                />
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 border border-black/10 dark:border-white/10">
                    <SignalHigh className="h-6 w-6 text-slate-500" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-500 text-sm">
                    بانتظار اختيار القناة...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// =====================
// Auction Card (FIXED TEXT ALWAYS WHITE)
// =====================

const AuctionCard = ({ auction, index }: { auction: AuctionMain; index: number }) => {
  const Icon = auction.icon;
  const hasOverlay = Boolean(auction.overlayImg);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 50 }}
      className="group relative h-full w-full"
    >
      <LoadingLink href={auction.href} className="block h-full w-full" aria-label={`الدخول إلى ${auction.name}`}>
        <div
          className="relative h-[550px] w-full rounded-[2rem] overflow-hidden transition-all duration-500
            bg-white dark:bg-[#0f172a]
            border border-black/10 dark:border-white/5
            hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/10"
        >
          <div className={`absolute inset-0 bg-gradient-to-b ${auction.theme.from} ${auction.theme.to} transition-all duration-500`} />

          {hasOverlay && (
            <>
              <div
                className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-110 ${auction.overlayOpacity}`}
                style={{ backgroundImage: `url('${auction.overlayImg}')` }}
              />
              <div className={`absolute inset-0 ${auction.overlayGradient}`} />
            </>
          )}

          {/* ✅ هنا الإصلاح: نخلي النصوص داخل الكارد أبيض دايمًا */}
          <div className="relative z-10 flex flex-col h-full p-6 md:p-7 text-white">
            <div className="mb-auto">
              <div
                className="inline-flex p-3 rounded-2xl backdrop-blur-md mb-5 transition-colors shadow-lg
                  bg-white/10 border border-white/15
                  group-hover:bg-white/20"
              >
                <Icon className={`h-6 w-6 ${auction.theme.primary}`} strokeWidth={2.5} />
              </div>

              <h3 className="text-xl md:text-2xl font-black mb-3 leading-tight drop-shadow-md text-white">
                {auction.name}
              </h3>

              <p className="text-sm leading-relaxed font-medium mb-4 line-clamp-3 text-slate-100 drop-shadow-sm">
                {auction.description}
              </p>

              <div className="flex items-center gap-2 text-slate-200 text-xs font-bold uppercase tracking-wider mb-4 bg-black/40 w-fit px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                <Clock className="w-3.5 h-3.5" />
                <span>{auction.time}</span>
              </div>
            </div>

            <div className="mt-auto">
              <div
                className={`flex items-center justify-between w-full text-sm font-bold rounded-xl px-4 py-3.5 transition-all duration-300 backdrop-blur-md
                  bg-white/10 text-white border border-white/20
                  group-hover:bg-white group-hover:text-black
                  ${auction.theme.ring}`}
              >
                <span>ابدأ المزايدة</span>
                <ChevronRight className="w-5 h-5 rtl:rotate-180 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-black/10 dark:ring-white/10 pointer-events-none" />
        </div>
      </LoadingLink>
    </motion.div>
  );
};

// =====================
// Page
// =====================

export default function AuctionsMainPage() {
  const [showPresenter, setShowPresenter] = useState(false);
  const [currentAuction, setCurrentAuction] = useState<string>("");

  const cards = useMemo(() => AUCTIONS_MAIN, []);
  const handlePrevToggle = useCallback(() => setShowPresenter((s) => !s), []);

  return (
    <main
      className="min-h-screen relative overflow-x-hidden selection:bg-primary selection:text-white
        bg-slate-50 text-slate-900
        dark:bg-[#050b14] dark:text-white"
      dir="rtl"
    >
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        <div className="flex justify-start mb-6">
          <Link
            href="/#auctions"
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-sm transition-all text-sm font-medium
              bg-black/5 hover:bg-black/10 border border-black/10 text-slate-700 hover:text-slate-900
              dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-slate-300 dark:hover:text-white"
          >
            <ArrowRight className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>عودة للرئيسية</span>
          </Link>
        </div>

        <div className="relative mb-12 md:mb-16">
          <div
            className="bg-gradient-to-br backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden
              from-black/5 to-black/[0.02] border border-black/10
              dark:from-white/5 dark:to-white/[0.02] dark:border-white/10"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary opacity-50" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
              <div className="md:w-2/3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                  <Shield className="w-3 h-3" />
                  نظام مزايدات آمن
                </div>

                <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
                  محرك المزادات{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    الرباعي
                  </span>
                </h1>

                <p className="text-lg md:text-xl leading-relaxed max-w-2xl font-light text-slate-600 dark:text-slate-400">
                  تجربة مزايدة عادلة وشفافة. منصة متكاملة تربط البائعين بالمشترين في بيئة تنافسية آمنة وموثوقة.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:w-1/3 justify-end">
                <button
                  onClick={handlePrevToggle}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300
                    ${
                      showPresenter
                        ? "bg-slate-900 text-white dark:bg-white dark:text-black"
                        : "bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                    }`}
                >
                  <Tv className="h-5 w-5" />
                  شاشة المعلق
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-black/10 dark:border-white/5">
              <StatChip icon={Shield} label="تشفير كامل للبيانات" />
              <StatChip icon={Users} label="أكثر من 50,000 مشتري" />
              <StatChip icon={Clock} label="بث مباشر 24/7" />
            </div>
          </div>
        </div>

        <div className="w-full">
          <AnimatePresence>
            {showPresenter && (
              <PresenterPanel
                current={currentAuction}
                onClose={() => setShowPresenter(false)}
                onSelect={(slug) => setCurrentAuction(slug)}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {cards.map((a, i) => (
            <AuctionCard key={a.slug} auction={a} index={i} />
          ))}
        </div>

        <div
          className="backdrop-blur-md rounded-3xl p-6 md:p-8 relative
          bg-white/70 border border-black/10
          dark:bg-[#0f172a]/50 dark:border-white/5"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-white">
            <span className="w-1.5 h-6 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
            أرشيف المزادات المنتهية
          </h2>
          <div className="w-full">
            <AuctionsFinished />
          </div>
        </div>
      </div>
    </main>
  );
}
