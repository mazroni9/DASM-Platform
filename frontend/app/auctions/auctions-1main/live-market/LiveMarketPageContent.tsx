"use client";

import React, { useEffect, useState, useCallback } from "react";
import LoadingLink from "@/components/LoadingLink";
import { ChevronRight, Clock, Radio, CircleAlert, AlertTriangle } from "lucide-react";
import BidTimer from "@/components/BidTimer";
import BidForm from "@/components/BidForm";
import LiveBidding from "@/components/LiveBidding";
import BidNotifications from "@/components/BidNotifications";
import { formatCurrency } from "@/utils/formatCurrency";
import LiveYouTubeEmbed from "@/components/LiveYouTubeEmbed";

import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePusher } from "@/contexts/PusherContext";

// -------- helpers --------
const toNumber = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const ensureArray = <T,>(v: any): T[] => (Array.isArray(v) ? v : []);

function getCurrentAuctionType(time: Date = new Date()): { label: string; isLive: boolean } {
  const h = time.getHours();
  if (h >= 16 && h < 19) return { label: "الحراج المباشر", isLive: true };
  if (h >= 19 && h < 22) return { label: "السوق الفوري المباشر", isLive: true };
  return { label: "السوق المتأخر", isLive: true };
}

// -------- types --------
type CarObj = {
  id?: number;
  make?: string;
  model?: string;
  year?: number | string;
  user_id?: number;
  odometer?: number | string;
  condition?: string;
  vin?: string;
  dealer?: { user_id?: number } | null;
};

type LiveAuction = {
  id: number;
  car_id: number;
  car?: CarObj;

  min_price?: string | number;
  max_price?: string | number;

  current_bid?: string | number;   // API غالباً string "20000.00"
  current_price?: string | number; // موجودة في الـ response اللي وريته
  starting_bid?: string | number;
  opening_price?: string | number;

  status?: string;
  status_label?: string;
  time_remaining?: number | string;

  viewers?: number;
  bids?: any[];
};

interface LiveMarketPageContentProps {
  sessionId?: string;
}

// -------- normalize + pick current --------
const normalizeAuction = (a: any): LiveAuction => {
  const id = toNumber(a?.id);
  const car_id = toNumber(a?.car_id ?? a?.car?.id);

  // resource أحياناً ما بيرجعش car => نخلي placeholder
  const car: CarObj | undefined = a?.car ?? (car_id ? { id: car_id } : undefined);

  return {
    id,
    car_id,
    car,

    min_price: a?.min_price,
    max_price: a?.max_price,

    current_bid: a?.current_bid ?? a?.current_price,
    current_price: a?.current_price,

    starting_bid: a?.starting_bid ?? a?.opening_price,
    opening_price: a?.opening_price,

    status: a?.status,
    status_label: a?.status_label,
    time_remaining: a?.time_remaining,

    viewers: a?.viewers,
    bids: ensureArray(a?.bids),
  };
};

const pickCurrentFromPending = (pending: LiveAuction[]): LiveAuction | null => {
  if (!pending.length) return null;
  return (
    pending.find((x) => String(x.status ?? "").toLowerCase() === "live") ??
    pending[0] ??
    null
  );
};

export default function LiveMarketPageContent({ sessionId }: LiveMarketPageContentProps) {
  const [isAllowed] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  const [marketCars, setMarketCars] = useState<LiveAuction[]>([]);
  const [currentCar, setCurrentCar] = useState<LiveAuction | null>(null);
  const [marketCarsCompleted, setMarketCarsCompleted] = useState<LiveAuction[]>([]);

  const [showBid, setShowBid] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentTime] = useState(new Date());
  const { label: auctionType } = getCurrentAuctionType(currentTime);

  const fetchAuctions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = sessionId
        ? await api.get(`/api/sessions/live/${sessionId}`)
        : await api.get("/api/approved-live-auctions"); // ✅ مطابق للـ Route اللي انت باعته

      // API: { status: "success", data: {...} }
      const payload = response?.data?.data ?? response?.data;

      // ✅ زي الـ response اللي انت وريته
      const pendingRaw = ensureArray<any>(payload?.pending_live_auctions);
      const completedRaw = ensureArray<any>(payload?.completed_live_auctions);

      const pending = pendingRaw.map(normalizeAuction);
      const completed = completedRaw.map(normalizeAuction);

      // ✅ بدل current_live_car (غير موجود غالباً)
      const current = pickCurrentFromPending(pending);

      // Owner check (هيشتغل فقط لو car فيها user_id أو dealer)
      if (current?.car) {
        const car_user_id = current.car.user_id ?? null;
        const dealer_user_id = current.car.dealer?.user_id ?? null;
        const current_user_id = user?.id ?? null;

        setIsOwner(
          Boolean(
            current_user_id &&
              (current_user_id === car_user_id || current_user_id === dealer_user_id)
          )
        );
      } else {
        setIsOwner(false);
      }

      setMarketCars(pending);
      setCurrentCar(current);
      setMarketCarsCompleted(completed);

      // اقفل الفورم لو اتبدلت العربية
      setShowBid(false);
      setStatusMsg("");
    } catch (e) {
      console.error("Failed to load auction data", e);
      setMarketCars([]);
      setCurrentCar(null);
      setMarketCarsCompleted([]);
      setError("Could not connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, user?.id]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // Pusher using shared context
  const { subscribe, unsubscribe, isConnected } = usePusher();

  useEffect(() => {
    if (!isConnected) return;

    const channelName = sessionId ? `session.${sessionId}` : "auction.live";
    const channel = subscribe(channelName);
    if (!channel) return;

    const refresh = () => fetchAuctions();

    channel.bind("UpdateSessionEvent", refresh);
    channel.bind("CarMovedBetweenAuctionsEvent", refresh);

    channel.bind("CarApprovedForLiveEvent", (data: any) => {
      refresh();
      if (data.approved_for_live) {
        toast.success(`تمت الموافقة على ${data.car_make} ${data.car_model} للمزاد المباشر!`);
      } else {
        toast.custom(
          <div
            style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#ffffcc" }}
            className="text-black flex items-center gap-2"
          >
            <CircleAlert className="w-4 h-4" />
            تم إيقاف المزاد المباشر على {data.car_make} {data.car_model}!
          </div>,
          { duration: 5000 }
        );
      }
    });

    channel.bind("AuctionStatusChangedEvent", (data: any) => {
      refresh();
      const labels: Record<string, string> = {
        live: "مباشر",
        ended: "منتهي",
        completed: "مكتمل",
        cancelled: "ملغي",
        failed: "فاشل",
        scheduled: "مجدول",
      };
      toast(
        `تم تغيير حالة مزاد ${data.car_make} ${data.car_model} من ${
          labels[data.old_status] ?? data.old_status
        } إلى ${labels[data.new_status] ?? data.new_status}`
      );
    });

    channel.bind("LiveMarketBidEvent", (data: any) => {
      if (user && data.bidder_id !== user.id) {
        toast.success(
          `مزايدة جديدة: ${data.car_make} ${data.car_model} - ${Number(
            data.bid_amount
          ).toLocaleString()} ريال`,
          { duration: 5000, position: "top-right" }
        );
        refresh();
      }
    });

    return () => {
      unsubscribe(channelName);
    };
  }, [isConnected, sessionId, fetchAuctions, user, subscribe, unsubscribe]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/search-car", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate }),
      });

      const json = await res.json();
      if (res.ok) {
        // عشان ما نعتمدش على شكل ثابت
        const raw = json?.data ?? json;
        const auctionLike = raw?.auction ?? raw;
        setCurrentCar(normalizeAuction(auctionLike));
        setStatusMsg("✅ تم البحث بنجاح");
      } else {
        setStatusMsg(`❌ خطأ: ${json?.error ?? "غير معروف"}`);
      }
    } catch {
      setStatusMsg("❌ فشل الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const currentBid = toNumber(currentCar?.current_bid ?? currentCar?.current_price);
  const openingBid = toNumber((currentCar as any)?.opening_price ?? currentCar?.starting_bid ?? 0);
  const shownPrice = currentBid === 0 ? openingBid : currentBid;

  return (
    <div className="min-h-screen bg-background p-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <BidNotifications />
          </div>

          {!sessionId && (
            <LoadingLink
              href="/auctions"
              className="inline-flex items-center text-primary hover:text-primary/80 transition-colors px-3 py-1 text-sm rounded-full border border-primary/20 hover:border-primary/30 bg-primary/10 hover:bg-primary/20"
            >
              <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
              <span>العودة</span>
            </LoadingLink>
          )}
        </div>

        {/* Header */}
        <div className="grid grid-cols-12 items-center mb-6 gap-4">
          <div className="col-span-3 flex justify-start">
            <div className="bg-card border-r-4 border-secondary rounded-lg shadow-sm px-3 py-1.5 flex items-center justify-between">
              <div className="text-sm font-medium text-foreground ml-2">
                <div>{auctionType} - جارٍ الآن</div>
              </div>
              <div className="flex items-center gap-2 mr-2">
                <Clock className="text-secondary h-4 w-4" />
                <div className="text-base font-mono font-semibold text-secondary">
                  <BidTimer showLabel={false} showProgress={false} />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-6 text-center">
            <h1 className="text-3xl font-bold text-primary">
              {sessionId ? "جلسة المزاد المباشر" : "الحراج المباشر"}
            </h1>
            <div className="text-sm text-primary/80 mt-1">
              {sessionId ? "أهلاً بك في جلسة المزاد" : "وقت السوق من 4 عصراً إلى 7 مساءً كل يوم"}
            </div>
          </div>

          <div className="col-span-3" />
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {isAllowed && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
            {/* Left */}
            <div className="md:col-span-7 flex flex-col space-y-6">
              {/* Stream */}
              <div className="relative w-full pb-[56.25%] bg-black rounded-lg overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full">
                  <LiveYouTubeEmbed
                    rtmpUrl="rtmp://a.rtmp.youtube.com/live2"
                    streamKey="w54k-w336-dmyd-j5b7-dhpq"
                    width="100%"
                    height="100%"
                    title="بث مباشر - الحراج المباشر"
                    autoplay={true}
                    muted={false}
                    showControls={true}
                    posterImage="/showroom.jpg"
                  />
                </div>

                <div className="absolute top-4 right-4 bg-card bg-opacity-80 rounded-full p-1.5 z-20">
                  <img
                    src="/grok auctioneer.jpg"
                    alt="معلق المزاد"
                    className="w-10 h-10 rounded-full object-cover border-2 border-secondary"
                  />
                </div>
              </div>

              {/* Current session cars table */}
              <div className="bg-card rounded-xl shadow-md p-4">
                <h2 className="text-lg font-bold mb-3 text-primary">سيارات جلسة الحراج الحالية</h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full border border-border divide-y divide-border">
                    <thead className="bg-background/50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">الماركة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">الموديل</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">السنة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">أقل سعر</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">أعلى سعر</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">آخر سعر</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">مشاهدة</th>
                      </tr>
                    </thead>

                    <tbody className="bg-card divide-y divide-border">
                      {marketCars.length > 0 ? (
                        marketCars.map((auction, index) => {
                          const isCurrent = currentCar?.id === auction.id;

                          // car ممكن مش موجودة من الـ resource
                          const make = auction?.car?.make ?? `سيارة #${auction.car_id}`;
                          const model = auction?.car?.model ?? "—";
                          const year = auction?.car?.year ?? "—";

                          const rowBid = toNumber(auction.current_bid ?? auction.current_price);

                          return (
                            <tr
                              key={auction.id}
                              className={`hover:bg-background ${isCurrent ? "bg-primary/10" : ""}`}
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">{index + 1}</td>

                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                <div className="flex items-center">
                                  {isCurrent ? <Radio color="red" className="me-2" size={16} /> : null}
                                  {make}
                                </div>
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">{model}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">{year}</td>

                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                {formatCurrency(toNumber(auction.min_price))}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                {formatCurrency(toNumber(auction.max_price))}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary">
                                {formatCurrency(rowBid)}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap text-sm text-primary">
                                <LoadingLink target="_blank" href={`/carDetails/${auction.car_id}`} className="hover:underline">
                                  عرض
                                </LoadingLink>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-4 text-center text-sm text-foreground/50">
                            {loading ? "جاري التحميل..." : "لا توجد سيارات متاحة حاليًا في الحراج المباشر"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Completed table */}
              <div className="bg-card rounded-xl shadow-md p-4">
                <h2 className="text-lg font-bold mb-3 text-primary">سيارات جلسة الحراج الحالية المنتهية</h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full border border-border divide-y divide-border">
                    <thead className="bg-background/50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">الماركة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">الموديل</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">السنة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">أقل سعر</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">أعلى سعر</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">آخر سعر</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">مشاهدة</th>
                      </tr>
                    </thead>

                    <tbody className="bg-card divide-y divide-border">
                      {marketCarsCompleted.length > 0 ? (
                        marketCarsCompleted.map((auction, index) => {
                          const make = auction?.car?.make ?? `سيارة #${auction.car_id}`;
                          const model = auction?.car?.model ?? "—";
                          const year = auction?.car?.year ?? "—";
                          const rowBid = toNumber(auction.current_bid ?? auction.current_price);

                          return (
                            <tr key={auction.id} className="hover:bg-background">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">{index + 1}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">{make}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">{model}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">{year}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                {formatCurrency(toNumber(auction.min_price))}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                {formatCurrency(toNumber(auction.max_price))}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary">
                                {formatCurrency(rowBid)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-primary">
                                <LoadingLink target="_blank" href={`/carDetails/${auction.car_id}`} className="hover:underline">
                                  عرض
                                </LoadingLink>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-4 text-center text-sm text-foreground/50">
                            لا توجد سيارات مكتملة في الحراج المباشر
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live bidding component */}
              {currentCar && <LiveBidding data={currentCar} />}
            </div>

            {/* Right */}
            <div className="md:col-span-5 flex flex-col space-y-4">
              <div className="bg-card p-4 rounded-xl shadow-md">
                <h2 className="text-lg font-bold mb-3 border-b pb-2 text-center text-primary">
                  السيارة الحالية في الحراج
                </h2>

                {currentCar ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div>
                        <span className="font-semibold">الماركة:</span>{" "}
                        {currentCar.car?.make ?? `سيارة #${currentCar.car_id}`}
                      </div>
                      <div>
                        <span className="font-semibold">الموديل:</span>{" "}
                        {currentCar.car?.model ?? "—"}
                      </div>
                      <div>
                        <span className="font-semibold">السنة:</span>{" "}
                        {currentCar.car?.year ?? "—"}
                      </div>
                      <div>
                        <span className="font-semibold">العداد:</span>{" "}
                        {currentCar.car?.odometer ?? "—"} كم
                      </div>
                      <div>
                        <span className="font-semibold">الحالة:</span>{" "}
                        {currentCar.car?.condition ?? "—"}
                      </div>
                      <div>
                        <span className="font-semibold">رقم الشاصي:</span>{" "}
                        {currentCar.car?.vin ?? "—"}
                      </div>
                    </div>

                    <div className="mt-3 border rounded-lg bg-background p-3">
                      <div className="text-center text-foreground/70 mb-2 text-xs">
                        <span>مشاهدون: {currentCar.viewers ?? 0} | </span>
                        <span>مزايدون: {currentCar.bids?.length ?? 0} (تقريباً)</span>
                      </div>

                      <div className="text-center mb-3">
                        <h3 className="font-semibold text-base text-primary">آخر سعر</h3>
                        <div className="text-2xl font-bold text-secondary my-2 py-2 rounded-lg border-2 border-border bg-card">
                          {formatCurrency(shownPrice)}
                        </div>
                      </div>

                      {!showBid ? (
                        <button
                          hidden={isOwner}
                          onClick={() => setShowBid(!isOwner)}
                          className="w-full bg-secondary text-white py-2 rounded-lg hover:bg-secondary/90 font-bold text-xl border-2 border-secondary/80 shadow-lg transform hover:scale-105 transition-all duration-200 animate-pulse"
                          style={{ animation: "pulse 2.5s infinite" }}
                        >
                          <span className="flex items-center justify-center">
                            <span className="mr-1.5">+</span> قدم عرضك
                          </span>
                        </button>
                      ) : (
                        <div>
                          <BidForm
                            auction_id={Number(currentCar.id)}
                            auction_type={"live"}
                            bid_amount={shownPrice}
                            onSuccess={() => {
                              setShowBid(false);
                              setStatusMsg("✅ تمت المزايدة بنجاح");
                            }}
                          />
                          {statusMsg && <p className="text-center text-sm mt-2">{statusMsg}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-foreground/50">لا توجد سيارة معروضة حاليًا في الحراج المباشر</p>
                  </div>
                )}

                {/* Search by plate */}
                <div className="mt-4 pt-3 border-t">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={plate}
                        onChange={(e) => setPlate(e.target.value)}
                        placeholder="أدخل رقم اللوحة مثل XYZ987"
                        className="p-1.5 text-xs border border-border rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                      />
                      <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="absolute left-0 top-0 h-full bg-primary text-white px-2 rounded-l-lg hover:bg-primary/90 whitespace-nowrap text-xs"
                      >
                        {loading ? "جارٍ..." : "بحث"}
                      </button>
                    </div>
                    <h3 className="text-xs font-semibold text-primary whitespace-nowrap">ابحث برقم اللوحة</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
