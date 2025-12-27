/**
 * 📝 صفحة تفاصيل السيارة - التصميم الجديد
 * 📁 المسار: Frontend-local/app/carDetails/[id]/page.tsx
 *
 * ✅ الوظيفة:
 * - عرض تفاصيل السيارة مع تصميم ثنائي الأعمدة (RTL)
 * - العمود الأيمن: المحتوى الرئيسي (الصور، المعلومات، المواصفات)
 * - العمود الأيسر: بطاقة المزايدة اللاصقة
 */

"use client";

import { useEffect, useState } from "react";
import LoadingLink from "@/components/LoadingLink";
import {
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Car,
  Fuel,
  Gauge,
  Palette,
  CreditCard,
  DollarSign,
  TrendingUp,
  Users,
  Award,
  Calendar,
  Tag,
  X,
  Download,
  Eye,
  Loader2,
  Flag,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownWideNarrow,
  Moon,
  Clock,
  Zap,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PriceWithIcon } from "@/components/ui/priceWithIcon";
import api from "@/lib/axios";
import { useParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import toast from "react-hot-toast";
import Pusher from "pusher-js";
import BidForm from "@/components/BidForm";
import { motion } from "framer-motion";
import AddToWatchlistButton from "@/components/dealer/AddToWatchlistButton";

// ========== أنواع مراحل السوق ==========
type MarketPhase = "live" | "instant" | "late" | "fixed";

interface MarketPhaseConfig {
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  gradient: string;
  timerBg: string;
  countdownTarget: number; // Target hour in Saudi time (24h format)
}

const MARKET_PHASES: Record<MarketPhase, MarketPhaseConfig> = {
  live: {
    title: "السوق المباشر",
    subtitle: "يغلق السوق في:",
    icon: Zap,
    gradient: "from-red-600 via-red-700 to-rose-800",
    timerBg: "bg-red-800/40",
    countdownTarget: 19, // Ends at 19:00
  },
  instant: {
    title: "السوق الفوري",
    subtitle: "يغلق المزاد في:",
    icon: Clock,
    gradient: "from-amber-500 via-orange-500 to-orange-600",
    timerBg: "bg-orange-700/40",
    countdownTarget: 22, // Ends at 22:00
  },
  late: {
    title: "السوق المتأخر",
    subtitle: "يغلق المزاد في:",
    icon: Moon,
    gradient: "from-purple-600 via-purple-700 to-indigo-800",
    timerBg: "bg-purple-900/40",
    countdownTarget: 16, // Ends at 16:00 (next day)
  },
  fixed: {
    title: "السوق الثابت",
    subtitle: "لا يوجد حد زمني",
    icon: Lock,
    gradient: "from-slate-600 via-slate-700 to-gray-800",
    timerBg: "bg-slate-800/40",
    countdownTarget: -1, // No countdown
  },
};

// ========== مكون بانر حالة السوق ==========
const MarketStatusBanner = ({
  isFixedMarket = false,
}: {
  isFixedMarket?: boolean;
}) => {
  const [currentPhase, setCurrentPhase] = useState<MarketPhase>("late");
  const [countdown, setCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Function to get current Saudi Arabia time
  const getSaudiTime = (): Date => {
    const now = new Date();
    // Create a formatter for Saudi Arabia timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) =>
      parts.find((p) => p.type === type)?.value || "0";

    return new Date(
      parseInt(getPart("year")),
      parseInt(getPart("month")) - 1,
      parseInt(getPart("day")),
      parseInt(getPart("hour")),
      parseInt(getPart("minute")),
      parseInt(getPart("second"))
    );
  };

  // Function to determine current market phase based on Saudi time
  const getMarketPhase = (saudiTime: Date): MarketPhase => {
    if (isFixedMarket) return "fixed";

    const hour = saudiTime.getHours();

    // Live: 16:00 - 18:59
    if (hour >= 16 && hour < 19) return "live";
    // Instant: 19:00 - 21:59
    if (hour >= 19 && hour < 22) return "instant";
    // Late: 22:00 - 15:59 (next day)
    return "late";
  };

  // Function to calculate countdown to next phase
  const calculateCountdown = (saudiTime: Date, phase: MarketPhase) => {
    if (phase === "fixed") {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const config = MARKET_PHASES[phase];
    const targetHour = config.countdownTarget;

    let targetTime = new Date(saudiTime);
    targetTime.setHours(targetHour, 0, 0, 0);

    // If target is in the past or we've crossed the target, move to next day
    if (targetTime <= saudiTime) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    const diff = targetTime.getTime() - saudiTime.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  useEffect(() => {
    const updateTimer = () => {
      const saudiTime = getSaudiTime();
      const phase = getMarketPhase(saudiTime);
      setCurrentPhase(phase);
      setCountdown(calculateCountdown(saudiTime, phase));
    };

    // Initial update
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isFixedMarket]);

  const config = MARKET_PHASES[currentPhase];
  const Icon = config.icon;

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${config.gradient} p-5 shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-white text-right">
          <h3 className="text-lg font-bold mb-0.5">{config.title}</h3>
          <p className="text-white/70 text-sm">{config.subtitle}</p>
        </div>
        <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-full">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Countdown Timer - Only show if not Fixed Market */}
      {currentPhase !== "fixed" && (
        <div className={`${config.timerBg} backdrop-blur-sm rounded-xl p-4`}>
          <div className="grid grid-cols-3 gap-3 text-center text-white">
            {/* Seconds */}
            <div>
              <div className="text-3xl font-bold tracking-wider mb-1">
                {formatNumber(countdown.seconds)}
              </div>
              <div className="text-xs text-white/60">ثانية</div>
            </div>
            {/* Minutes */}
            <div className="border-x border-white/20">
              <div className="text-3xl font-bold tracking-wider mb-1">
                {formatNumber(countdown.minutes)}
              </div>
              <div className="text-xs text-white/60">دقيقة</div>
            </div>
            {/* Hours */}
            <div>
              <div className="text-3xl font-bold tracking-wider mb-1">
                {formatNumber(countdown.hours)}
              </div>
              <div className="text-xs text-white/60">ساعة</div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Market Message */}
      {currentPhase === "fixed" && (
        <div
          className={`${config.timerBg} backdrop-blur-sm rounded-xl p-4 text-center`}
        >
          <p className="text-white/80 text-sm">
            هذه السيارة متاحة للشراء في أي وقت
          </p>
        </div>
      )}
    </motion.div>
  );
};

// ========== قسم السيارات المشابهة ==========
const FeaturedCars = ({ cars }: { cars: any[] }) => {
  if (!cars || cars.length === 0) return null;

  return (
    <section className="bg-background py-16 mt-8 border-t border-border/40">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-right text-2xl sm:text-3xl font-bold text-foreground mb-10 flex items-center gap-3"
        >
          <Car className="w-8 h-8 text-primary" />
          سيارات مشابهة
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {cars.map((car, index) => (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-card border border-border/50 hover:border-primary/20"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={car.images?.[0] || "/placeholder-car.jpg"}
                  alt={`${car.make} ${car.model} ${car.year}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-1 group-hover:text-primary transition-colors">
                  {car.make} {car.model} {car.year}
                </h3>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-primary font-bold text-lg bg-primary/5 px-3 py-1 rounded-lg">
                    <PriceWithIcon
                      price={car.active_auction?.current_bid || 0}
                    />
                  </span>
                  <span className="text-foreground/60 text-sm flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {car.total_bids || 0} مزايدة
                  </span>
                </div>
                <LoadingLink href={`/carDetails/${car.id}`} className="w-full">
                  <button className="w-full bg-secondary text-white py-3 rounded-xl font-medium hover:bg-secondary/90 hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300 transform active:scale-[0.98]">
                    شارك في المزاد
                  </button>
                </LoadingLink>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== مكون Lightbox للصور ==========
const ImageLightbox = ({
  isOpen,
  onClose,
  imageSrc,
  alt,
}: {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  alt: string;
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:text-red-400 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur-md transition-all duration-300"
      >
        <X className="w-8 h-8" />
      </button>
      <motion.img
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        src={imageSrc}
        alt={alt}
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

// ========== مكون بطاقة المواصفات ==========
const SpecCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number | undefined;
}) => (
  <div className="group bg-card hover:bg-card/80 border border-border/50 hover:border-primary/20 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 shadow-sm hover:shadow-md">
    <div className="bg-primary/5 group-hover:bg-primary/10 p-3 rounded-xl transition-colors">
      <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
    </div>
    <div>
      <p className="text-foreground/50 text-xs mb-1 font-medium">{label}</p>
      <p className="font-bold text-foreground text-sm sm:text-base">
        {value || "-"}
      </p>
    </div>
  </div>
);

// ========== مكون بانر معلومات المزاد ==========
const AuctionInfoBanner = ({
  openingPrice,
  minPrice,
  highestBid,
}: {
  openingPrice: number;
  minPrice: number;
  highestBid: number;
}) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-border/60 shadow-sm mb-8 relative overflow-hidden">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-border/50">
      {/* Opening Price */}
      <div className="flex items-center justify-between sm:justify-end gap-4 sm:pl-6">
        <div className="text-left sm:text-right">
          <p className="text-foreground/50 text-xs font-medium mb-1">
            سعر الافتتاح
          </p>
          <p className="font-bold text-foreground text-lg tracking-tight">
            <PriceWithIcon price={openingPrice} />
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-full shadow-sm">
          <Flag className="w-6 h-6 text-slate-500" />
        </div>
      </div>

      {/* Minimum Price */}
      <div className="flex items-center justify-between sm:justify-end gap-4 sm:px-6">
        <div className="text-left sm:text-right">
          <p className="text-foreground/50 text-xs font-medium mb-1">
            أقل سعر للمزايدة
          </p>
          <p className="font-bold text-foreground text-lg tracking-tight">
            <PriceWithIcon price={minPrice} />
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-full shadow-sm">
          <ArrowDownWideNarrow className="w-6 h-6 text-slate-500" />
        </div>
      </div>

      {/* Highest Bid */}
      <div className="flex items-center justify-between sm:justify-end gap-4 sm:pr-6">
        <div className="text-left sm:text-right">
          <p className="text-foreground/50 text-xs font-medium mb-1">
            أعلى سعر وصل
          </p>
          <p className="font-bold text-primary text-xl tracking-tight">
            <PriceWithIcon price={highestBid} />
          </p>
        </div>
        <div className="bg-primary/5 dark:bg-primary/20 p-3 rounded-full shadow-sm">
          <ArrowUpRight className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  </div>
);

// ========== مكون بطاقة المزايدة اللاصقة ==========
const StickyBidCard = ({
  item,
  isOwner,
  isLoggedIn,
  onConfirmSale,
}: {
  item: any;
  isOwner: boolean;
  isLoggedIn: boolean;
  onConfirmSale: () => void;
}) => {
  const auction = item?.active_auction;
  const currentBid = auction?.current_bid || 0;
  const totalBids = item?.total_bids || 0;
  const bids = auction?.bids || [];

  if (!auction) {
    return (
      <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-8">
        <div className="text-center">
          <div className="bg-amber-50 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center animate-pulse">
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">
            المزاد غير نشط
          </h3>
          <p className="text-foreground/60 leading-relaxed">
            عذراً، هذه السيارة غير متاحة للمزايدة في الوقت الحالي. يرجى التحقق
            لاحقاً.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-border/60 overflow-hidden transition-all duration-300">
      {/* Header - السعر الحالي */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent p-8 pb-6 border-b border-border/30">
        <p className="text-foreground/60 text-sm font-medium mb-2 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          السعر الحالي
        </p>
        <div className="text-5xl font-extrabold text-primary mb-3 tracking-tight">
          <PriceWithIcon price={currentBid} />
        </div>
        <div className="flex items-center gap-2 text-foreground/70 text-sm font-medium bg-background/50 w-fit px-3 py-1.5 rounded-full border border-border/50">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="flex items-center gap-1">
            عدد المزايدات: {totalBids}
          </span>
        </div>
      </div>

      {/* Body - نموذج المزايدة */}
      <div className="p-6 pt-6">
        {isOwner ? (
          <div className="text-center py-4">
            <div className="bg-primary/5 rounded-2xl p-6 mb-6">
              <p className="text-foreground/80 font-medium mb-2">
                أنت مالك هذه السيارة
              </p>
              <p className="text-sm text-foreground/50">
                يمكنك متابعة المزاد أو إنهاؤه بالبيع
              </p>
            </div>
            <button
              onClick={onConfirmSale}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg shadow-emerald-600/20 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-6 h-6" />
              تأكيد البيع
            </button>
          </div>
        ) : (
          <BidForm
            auction_id={parseInt(auction.id)}
            auction_type={auction.auction_type}
            bid_amount={parseInt(
              (currentBid === 0 ? auction.opening_price || 0 : currentBid)
                .toString()
                .replace(/,/g, "")
            )}
            onSuccess={() => {
              toast.success("تم تقديم العرض بنجاح", {
                icon: "👏",
                style: {
                  borderRadius: "10px",
                  background: "#333",
                  color: "#fff",
                },
              });
            }}
          />
        )}
      </div>

      {/* Footer - Social Proof / Last Bidders */}
      {bids.length > 0 && (
        <div className="bg-background/50 p-6 border-t border-border/30">
          <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            آخر المزايدين النشطين
          </h4>
          <div className="space-y-3">
            {bids.slice(0, 3).map((bid: any, idx: number) => (
              <div
                key={bid.id}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-transform group-hover:scale-110 ${
                      idx === 0
                        ? "bg-secondary text-white shadow-secondary/30"
                        : "bg-white border border-border text-foreground/60"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-semibold">
                      مزايد #{bid.user_id.toString().slice(-4)}
                    </span>
                    <span className="text-[10px] text-foreground/40">
                      {new Date(bid.created_at).toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <span
                  className={`font-bold text-sm ${
                    idx === 0 ? "text-secondary" : "text-foreground/70"
                  }`}
                >
                  <PriceWithIcon price={bid.bid_amount} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function CarDetailPage() {
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showRegistrationCard, setShowRegistrationCard] = useState(false);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useLoadingRouter();
  const params = useParams<{ id: string }>();
  const carId = params["id"];
  const [isOwner, setIsOwner] = useState(false);

  // جلب بيانات السيارة
  useEffect(() => {
    setLoading(true);
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
    });

    async function fetchAuctions() {
      try {
        const response = await api.get(`/api/car/${carId}`);
        if (response.data.data) {
          const carsData = response.data.data.data || response.data.data;
          setItem(carsData);

          const car_user_id = carsData.car?.user_id;
          const current_user_id = user?.id || null;
          let dealer_user_id = carsData.car?.dealer?.user_id;

          if (
            current_user_id &&
            (current_user_id === car_user_id ||
              current_user_id === dealer_user_id)
          ) {
            setIsOwner(true);
          }

          const auctionId = carsData.id;
          const channel = pusher.subscribe(`auction.${auctionId}`);

          channel.bind("NewBidEvent", (event: any) => {
            setItem((prevItem: any) => ({
              ...prevItem,
              active_auction: event.data.active_auction,
              total_bids: event.data.total_bids,
            }));
          });
        }
      } catch (error) {
        console.error("فشل تحميل بيانات المزاد", error);
        setItem(null);
        setError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.");
      } finally {
        setLoading(false);
      }
    }
    fetchAuctions();

    return () => {
      pusher.disconnect();
    };
  }, [authLoading, isLoggedIn, carId, user]);

  const images =
    item?.car?.images?.length > 0 ? item.car.images : ["/placeholder-car.jpg"];
  const currentImage = images[selectedImageIndex];

  const goToNextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const goToPreviousImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  // حالة التحميل
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground/70 font-medium">
            جاري تحميل تفاصيل السيارة...
          </p>
        </div>
      </div>
    );
  }

  // حالة الخطأ
  if (error || !item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">حدث خطأ</h2>
          <p className="text-foreground/60 mb-8 leading-relaxed">
            {error ||
              "لم يتم العثور على السيارة المطلوبة. قد تكون حذفت أو انتهى المزاد."}
          </p>
          <LoadingLink href="/auctions">
            <button className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30">
              العودة للأسواق
            </button>
          </LoadingLink>
        </div>
      </div>
    );
  }

  const car = item.car;
  const auction = item.active_auction;

  return (
    <>
      <ImageLightbox
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        imageSrc={currentImage}
        alt={`${car?.make} ${car?.model}`}
      />

      <ImageLightbox
        isOpen={showRegistrationCard}
        onClose={() => setShowRegistrationCard(false)}
        imageSrc={car?.registration_card_image || ""}
        alt="كرت التسجيل"
      />

      <div className="min-h-screen bg-background pb-20" dir="rtl">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          {/* Breadcrumb / Back Navigation */}
          <nav className="flex items-center gap-2 text-sm text-foreground/50 mb-8 overflow-x-auto whitespace-nowrap pb-2">
            <LoadingLink
              href="/"
              className="hover:text-primary transition-colors"
            >
              الرئيسية
            </LoadingLink>
            <ChevronRight className="w-4 h-4" />
            <LoadingLink
              href="/auctions"
              className="hover:text-primary transition-colors"
            >
              المزادات
            </LoadingLink>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">
              {car?.make} {car?.model} {car?.year}
            </span>
          </nav>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* RIGHT COLUMN (Content) - 65% ~ 8 cols */}
            <div className="lg:col-span-8 order-2 lg:order-1 space-y-8">
              {/* Header Title Area */}
              <div className="border-b border-border/40 pb-6">
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                    {car?.make} {car?.model} {car?.year}
                  </h1>
                  <div className="flex items-center gap-2">
                    {car?.plate && (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-1.5 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-700">
                        {car.plate}
                      </span>
                    )}
                    {car?.condition && (
                      <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-lg text-sm font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {car.condition}
                      </span>
                    )}
                    {/* Watchlist Button */}
                    {car?.id && (
                      <AddToWatchlistButton carId={car.id} size="md" />
                    )}
                  </div>
                </div>
                <p className="text-foreground/50 text-base flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary/60"></span>
                  لوت #{item.id}
                  <span className="mx-2 text-border">|</span>
                  جدة، ساحة المزادات الرئيسية
                </p>
              </div>

              {/* Image Gallery */}
              <div className="space-y-4">
                <div
                  className="relative bg-black/5 dark:bg-white/5 rounded-3xl overflow-hidden cursor-zoom-in group border border-border/50 shadow-sm aspect-[16/10]"
                  onClick={() => setShowImageModal(true)}
                >
                  <img
                    src={currentImage}
                    alt={`${car?.make} ${car?.model}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/placeholder-car.jpg";
                    }}
                  />

                  {/* Overlay Controls */}
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-lg text-sm font-medium">
                      اضغط للتكبير
                    </span>
                    <div className="bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-bold">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  </div>

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goToPreviousImage();
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 active:scale-95 z-20"
                      >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goToNextImage();
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 active:scale-95 z-20"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        className={`flex-shrink-0 w-24 aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                          idx === selectedImageIndex
                            ? "border-primary ring-2 ring-primary/20 scale-105 opacity-100"
                            : "border-transparent hover:border-border opacity-70 hover:opacity-100"
                        }`}
                        onClick={() => setSelectedImageIndex(idx)}
                      >
                        <img
                          src={img}
                          alt={`thumbnail ${idx}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Auction Info Banner */}
              {auction && (
                <AuctionInfoBanner
                  openingPrice={
                    auction.opening_price || auction.minimum_bid || 0
                  }
                  minPrice={auction.minimum_bid || 0}
                  highestBid={auction.current_bid || 0}
                />
              )}

              {/* Car Specifications */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-xl font-bold text-foreground">
                    مواصفات السيارة
                  </h2>
                  <div className="h-px bg-border flex-grow"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <SpecCard icon={Car} label="الماركة" value={car?.make} />
                  <SpecCard icon={Car} label="الموديل" value={car?.model} />
                  <SpecCard
                    icon={Calendar}
                    label="سنة الصنع"
                    value={car?.year}
                  />
                  <SpecCard
                    icon={Fuel}
                    label="نوع الوقود"
                    value={car?.engine}
                  />
                  <SpecCard
                    icon={Gauge}
                    label="الممشى"
                    value={
                      car?.odometer
                        ? `${car.odometer.toLocaleString()} كم`
                        : undefined
                    }
                  />
                  <SpecCard icon={Palette} label="اللون" value={car?.color} />
                </div>
              </div>

              {/* Documents Buttons */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-xl font-bold text-foreground">
                    الوثائق والتقارير
                  </h2>
                  <div className="h-px bg-border flex-grow"></div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href={car?.report_images?.[0]?.image_path || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-500 hover:bg-gray-50 transition-all duration-300 group"
                  >
                    <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">تحميل تقرير الفحص</span>
                  </a>

                  {car?.registration_card_image && (
                    <button
                      onClick={() => setShowRegistrationCard(true)}
                      className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/50 text-indigo-700 bg-indigo-50 hover:bg-indigo-100/50 transition-all duration-300 group"
                    >
                      <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">عرض كرت التسجيل</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-white dark:bg-card p-8 rounded-2xl border border-border/50 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4 text-right">
                  وصف إضافي
                </h3>
                <p className="text-foreground/70 leading-relaxed text-right text-base whitespace-pre-line">
                  {car?.description ||
                    "سيارة بحالة ممتازة. جميع الصيانات تمت في الوكالة. يوجد خدش بسيط في الصدام الخلفي وتم إصلاحه."}
                </p>
              </div>
            </div>

            {/* LEFT COLUMN (Sidebar) - 35% ~ 4 cols */}
            <div className="lg:col-span-4 order-1 lg:order-2">
              <div className="sticky top-28 space-y-4">
                {/* Market Status Banner */}
                <MarketStatusBanner isFixedMarket={car?.is_fixed_market} />

                {/* Bidding Card */}
                <StickyBidCard
                  item={item}
                  isOwner={isOwner}
                  isLoggedIn={isLoggedIn}
                  onConfirmSale={() => router.push(`/sales/confirm/${carId}`)}
                />
              </div>
            </div>
          </div>

          {/* Similar Cars - Outside the grid, full width */}
          <FeaturedCars cars={item?.similar_cars} />
        </div>
      </div>
    </>
  );
}
