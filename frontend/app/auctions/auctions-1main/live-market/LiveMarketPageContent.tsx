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
  if (h >= 16 && h < 19) return { label: "ط§ظ„ط­ط±ط§ط¬ ط§ظ„ظ…ط¨ط§ط´ط±", isLive: true };
  if (h >= 19 && h < 22) return { label: "ط§ظ„ط³ظˆظ‚ ط§ظ„ظپظˆط±ظٹ ط§ظ„ظ…ط¨ط§ط´ط±", isLive: true };
  return { label: "ط§ظ„ط³ظˆظ‚ ط§ظ„ظ…طھط£ط®ط±", isLive: true };
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

  current_bid?: string | number;   // API ط؛ط§ظ„ط¨ط§ظ‹ string "20000.00"
  current_price?: string | number; // ظ…ظˆط¬ظˆط¯ط© ظپظٹ ط§ظ„ظ€ response ط§ظ„ظ„ظٹ ظˆط±ظٹطھظ‡
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

  // resource ط£ط­ظٹط§ظ†ط§ظ‹ ظ…ط§ ط¨ظٹط±ط¬ط¹ط´ car => ظ†ط®ظ„ظٹ placeholder
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
        : await api.get("/api/approved-live-auctions"); // âœ… ظ…ط·ط§ط¨ظ‚ ظ„ظ„ظ€ Route ط§ظ„ظ„ظٹ ط§ظ†طھ ط¨ط§ط¹طھظ‡

      // API: { status: "success", data: {...} }
      const payload = response?.data?.data ?? response?.data;

      // âœ… ط²ظٹ ط§ظ„ظ€ response ط§ظ„ظ„ظٹ ط§ظ†طھ ظˆط±ظٹطھظ‡
      const pendingRaw = ensureArray<any>(payload?.pending_live_auctions);
      const completedRaw = ensureArray<any>(payload?.completed_live_auctions);

      const pending = pendingRaw.map(normalizeAuction);
      const completed = completedRaw.map(normalizeAuction);

      // âœ… ط¨ط¯ظ„ current_live_car (ط؛ظٹط± ظ…ظˆط¬ظˆط¯ ط؛ط§ظ„ط¨ط§ظ‹)
      const current = pickCurrentFromPending(pending);

      // Owner check (ظ‡ظٹط´طھط؛ظ„ ظپظ‚ط· ظ„ظˆ car ظپظٹظ‡ط§ user_id ط£ظˆ dealer)
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

      // ط§ظ‚ظپظ„ ط§ظ„ظپظˆط±ظ… ظ„ظˆ ط§طھط¨ط¯ظ„طھ ط§ظ„ط¹ط±ط¨ظٹط©
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
        toast.success(`طھظ…طھ ط§ظ„ظ…ظˆط§ظپظ‚ط© ط¹ظ„ظ‰ ${data.car_make} ${data.car_model} ظ„ظ„ظ…ط²ط§ط¯ ط§ظ„ظ…ط¨ط§ط´ط±!`);
      } else {
        toast.custom(
          <div
            style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#ffffcc" }}
            className="text-black flex items-center gap-2"
          >
            <CircleAlert className="w-4 h-4" />
            طھظ… ط¥ظٹظ‚ط§ظپ ط§ظ„ظ…ط²ط§ط¯ ط§ظ„ظ…ط¨ط§ط´ط± ط¹ظ„ظ‰ {data.car_make} {data.car_model}!
          </div>,
          { duration: 5000 }
        );
      }
    });

    channel.bind("AuctionStatusChangedEvent", (data: any) => {
      refresh();
      const labels: Record<string, string> = {
        live: "ظ…ط¨ط§ط´ط±",
        ended: "ظ…ظ†طھظ‡ظٹ",
        completed: "ظ…ظƒطھظ…ظ„",
        cancelled: "ظ…ظ„ط؛ظٹ",
        failed: "ظپط§ط´ظ„",
        scheduled: "ظ…ط¬ط¯ظˆظ„",
      };
      toast(
        `طھظ… طھط؛ظٹظٹط± ط­ط§ظ„ط© ظ…ط²ط§ط¯ ${data.car_make} ${data.car_model} ظ…ظ† ${
          labels[data.old_status] ?? data.old_status
        } ط¥ظ„ظ‰ ${labels[data.new_status] ?? data.new_status}`
      );
    });

    channel.bind("LiveMarketBidEvent", (data: any) => {
      if (user && data.bidder_id !== user.id) {
        toast.success(
          `ظ…ط²ط§ظٹط¯ط© ط¬ط¯ظٹط¯ط©: ${data.car_make} ${data.car_model} - ${Number(
            data.bid_amount
          ).toLocaleString()} ط±ظٹط§ظ„`,
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
      const res = await api.get("/api/market/explorer/cars", {
        params: { q: plate, per_page: 1 },
      });

      const payload = res?.data?.data ?? res?.data;
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      const first = list[0] ?? null;

      if (first) {
        setCurrentCar(normalizeAuction(first));
        setStatusMsg("âœ… طھظ… ط§ظ„ط¨ط­ط« ط¨ظ†ط¬ط§ط­");
      } else {
        setStatusMsg("â‌Œ ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ظ†طھط§ط¦ط¬");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || "ظپط´ظ„ ط§ظ„ط§طھطµط§ظ„ ط¨ط§ظ„ط®ط§ط¯ظ…";
      setStatusMsg(`â‌Œ ${msg}`);
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
              href="/auctions/auctions-1main"
              className="inline-flex items-center text-primary hover:text-primary/80 transition-colors px-3 py-1 text-sm rounded-full border border-primary/20 hover:border-primary/30 bg-primary/10 hover:bg-primary/20"
            >
              <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
              <span>ط§ظ„ط¹ظˆط¯ط©</span>
            </LoadingLink>
          )}
        </div>

        {/* Header */}
        <div className="grid grid-cols-12 items-center mb-6 gap-4">
          <div className="col-span-3 flex justify-start">
            <div className="bg-card border-r-4 border-secondary rounded-lg shadow-sm px-3 py-1.5 flex items-center justify-between">
              <div className="text-sm font-medium text-foreground ml-2">
                <div>{auctionType} - ط¬ط§ط±ظچ ط§ظ„ط¢ظ†</div>
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
              {sessionId ? "ط¬ظ„ط³ط© ط§ظ„ظ…ط²ط§ط¯ ط§ظ„ظ…ط¨ط§ط´ط±" : "ط§ظ„ط­ط±ط§ط¬ ط§ظ„ظ…ط¨ط§ط´ط±"}
            </h1>
            <div className="text-sm text-primary/80 mt-1">
              {sessionId ? "ط£ظ‡ظ„ط§ظ‹ ط¨ظƒ ظپظٹ ط¬ظ„ط³ط© ط§ظ„ظ…ط²ط§ط¯" : "ظˆظ‚طھ ط§ظ„ط³ظˆظ‚ ظ…ظ† 4 ط¹طµط±ط§ظ‹ ط¥ظ„ظ‰ 7 ظ…ط³ط§ط،ظ‹ ظƒظ„ ظٹظˆظ…"}
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
                    title="ط¨ط« ظ…ط¨ط§ط´ط± - ط§ظ„ط­ط±ط§ط¬ ط§ظ„ظ…ط¨ط§ط´ط±"
                    autoplay={true}
                    muted={false}
                    showControls={true}
                    posterImage="/showroom.jpg"
                  />
                </div>

                <div className="absolute top-4 right-4 bg-card bg-opacity-80 rounded-full p-1.5 z-20">
                  <img
                    src="/grok auctioneer.jpg"
                    alt="ظ…ط¹ظ„ظ‚ ط§ظ„ظ…ط²ط§ط¯"
                    className="w-10 h-10 rounded-full object-cover border-2 border-secondary"
                  />
                </div>
              </div>

              {/* Current session cars table */}
              <div className="bg-card rounded-xl shadow-md p-4">
                <h2 className="text-lg font-bold mb-3 text-primary">ط³ظٹط§ط±ط§طھ ط¬ظ„ط³ط© ط§ظ„ط­ط±ط§ط¬ ط§ظ„ط­ط§ظ„ظٹط©</h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full border border-border divide-y divide-border">
                    <thead className="bg-background/50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">ط§ظ„ظ…ط§ط±ظƒط©</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">ط§ظ„ظ…ظˆط¯ظٹظ„</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">ط§ظ„ط³ظ†ط©</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">ط£ظ‚ظ„ ط³ط¹ط±</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">ط£ط¹ظ„ظ‰ ط³ط¹ط±</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">ط¢ط®ط± ط³ط¹ط±</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">ظ…ط´ط§ظ‡ط¯ط©</th>
                      </tr>
                    </thead>

                    <tbody className="bg-card divide-y divide-border">
                      {marketCars.length > 0 ? (
                        marketCars.map((auction, index) => {
                          const isCurrent = currentCar?.id === auction.id;

                          // car ظ…ظ…ظƒظ† ظ…ط´ ظ…ظˆط¬ظˆط¯ط© ظ…ظ† ط§ظ„ظ€ resource
                          const make = auction?.car?.make ?? `ط³ظٹط§ط±ط© #${auction.car_id}`;
                          const model = auction?.car?.model ?? "â€”";
                          const year = auction?.car?.year ?? "â€”";

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
                                  ط¹ط±ط¶
                                </LoadingLink>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-4 text-center text-sm text-foreground/50">
                            {loading ? "ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„..." : "ظ„ط§ طھظˆط¬ط¯ ط³ظٹط§ط±ط§طھ ظ…طھط§ط­ط© ط­ط§ظ„ظٹظ‹ط§ ظپظٹ ط§ظ„ط­ط±ط§ط¬ ط§ظ„ظ…ط¨ط§ط´ط±"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Completed table */}
              <div className="bg-card rounded-xl shadow-md p-4">
                <h2 className="text-lg font-bold mb-3 text-primary">ط³ظٹط§ط±ط§طھ ط¬ظ„ط³ط© ط§ظ„ط­ط±ط§ط¬ ط§ظ„ط­ط§ظ„ظٹط© ط§ظ„ظ…ظ†طھظ‡ظٹط©</h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full border border-border divide-y divide-border">
                    <thead className="bg-background/50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">ط§ظ„ظ…ط§ط±ظƒط©</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">ط§ظ„ظ…ظˆط¯ظٹظ„</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">ط§ظ„ط³ظ†ط©</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">ط£ظ‚ظ„ ط³ط¹ط±</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">ط£ط¹ظ„ظ‰ ط³ط¹ط±</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">ط¢ط®ط± ط³ط¹ط±</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">ظ…ط´ط§ظ‡ط¯ط©</th>
                      </tr>
                    </thead>

                    <tbody className="bg-card divide-y divide-border">
                      {marketCarsCompleted.length > 0 ? (
                        marketCarsCompleted.map((auction, index) => {
                          const make = auction?.car?.make ?? `ط³ظٹط§ط±ط© #${auction.car_id}`;
                          const model = auction?.car?.model ?? "â€”";
                          const year = auction?.car?.year ?? "â€”";
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
                                  ط¹ط±ط¶
                                </LoadingLink>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-4 text-center text-sm text-foreground/50">
                            ظ„ط§ طھظˆط¬ط¯ ط³ظٹط§ط±ط§طھ ظ…ظƒطھظ…ظ„ط© ظپظٹ ط§ظ„ط­ط±ط§ط¬ ط§ظ„ظ…ط¨ط§ط´ط±
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
                  ط§ظ„ط³ظٹط§ط±ط© ط§ظ„ط­ط§ظ„ظٹط© ظپظٹ ط§ظ„ط­ط±ط§ط¬
                </h2>

                {currentCar ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div>
                        <span className="font-semibold">ط§ظ„ظ…ط§ط±ظƒط©:</span>{" "}
                        {currentCar.car?.make ?? `ط³ظٹط§ط±ط© #${currentCar.car_id}`}
                      </div>
                      <div>
                        <span className="font-semibold">ط§ظ„ظ…ظˆط¯ظٹظ„:</span>{" "}
                        {currentCar.car?.model ?? "â€”"}
                      </div>
                      <div>
                        <span className="font-semibold">ط§ظ„ط³ظ†ط©:</span>{" "}
                        {currentCar.car?.year ?? "â€”"}
                      </div>
                      <div>
                        <span className="font-semibold">ط§ظ„ط¹ط¯ط§ط¯:</span>{" "}
                        {currentCar.car?.odometer ?? "â€”"} ظƒظ…
                      </div>
                      <div>
                        <span className="font-semibold">ط§ظ„ط­ط§ظ„ط©:</span>{" "}
                        {currentCar.car?.condition ?? "â€”"}
                      </div>
                      <div>
                        <span className="font-semibold">ط±ظ‚ظ… ط§ظ„ط´ط§طµظٹ:</span>{" "}
                        {currentCar.car?.vin ?? "â€”"}
                      </div>
                    </div>

                    <div className="mt-3 border rounded-lg bg-background p-3">
                      <div className="text-center text-foreground/70 mb-2 text-xs">
                        <span>ظ…ط´ط§ظ‡ط¯ظˆظ†: {currentCar.viewers ?? 0} | </span>
                        <span>ظ…ط²ط§ظٹط¯ظˆظ†: {currentCar.bids?.length ?? 0} (طھظ‚ط±ظٹط¨ط§ظ‹)</span>
                      </div>

                      <div className="text-center mb-3">
                        <h3 className="font-semibold text-base text-primary">ط¢ط®ط± ط³ط¹ط±</h3>
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
                            <span className="mr-1.5">+</span> ظ‚ط¯ظ… ط¹ط±ط¶ظƒ
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
                              setStatusMsg("âœ… طھظ…طھ ط§ظ„ظ…ط²ط§ظٹط¯ط© ط¨ظ†ط¬ط§ط­");
                            }}
                          />
                          {statusMsg && <p className="text-center text-sm mt-2">{statusMsg}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-foreground/50">ظ„ط§ طھظˆط¬ط¯ ط³ظٹط§ط±ط© ظ…ط¹ط±ظˆط¶ط© ط­ط§ظ„ظٹظ‹ط§ ظپظٹ ط§ظ„ط­ط±ط§ط¬ ط§ظ„ظ…ط¨ط§ط´ط±</p>
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
                        placeholder="ط£ط¯ط®ظ„ ط±ظ‚ظ… ط§ظ„ظ„ظˆط­ط© ظ…ط«ظ„ XYZ987"
                        className="p-1.5 text-xs border border-border rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                      />
                      <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="absolute left-0 top-0 h-full bg-primary text-white px-2 rounded-l-lg hover:bg-primary/90 whitespace-nowrap text-xs"
                      >
                        {loading ? "ط¬ط§ط±ظچ..." : "ط¨ط­ط«"}
                      </button>
                    </div>
                    <h3 className="text-xs font-semibold text-primary whitespace-nowrap">ط§ط¨ط­ط« ط¨ط±ظ‚ظ… ط§ظ„ظ„ظˆط­ط©</h3>
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
