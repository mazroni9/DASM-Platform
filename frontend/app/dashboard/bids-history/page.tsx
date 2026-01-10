"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
} from "lucide-react";
import api from "@/lib/axios";
import { PriceWithIcon } from "@/components/ui/priceWithIcon";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import relativeTime from "dayjs/plugin/relativeTime";
import Skeleton from "@mui/material/Skeleton";

dayjs.extend(relativeTime);

type BidLog = {
  id?: number | string;
  bid_id?: number;
  auction_id?: number;

  event_type?: string;
  event?: string;

  bid_amount?: number;
  amount?: number;

  channel?: string;
  reason_code?: string;

  client_ts?: string;
  server_ts_utc?: string;
  created_at?: string;

  auction?: { id?: number };
};

type PaginationInfo = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
};

type BidHistoryResponse = {
  status: string;
  data?: any; // ممكن تكون array أو Resource Collection object
  pagination?: PaginationInfo;
  stats?: {
    total: number;
    bid_placed: number;
    outbid: number;
  };
  auctions_ids?: number[] | Record<string, number>;
};

const BidLogsTimeline = () => {
  const [logs, setLogs] = useState<BidLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [auctionIds, setAuctionIds] = useState<number[]>([]);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string>("");
  const [stats, setStats] = useState({
    total: 0,
    bid_placed: 0,
    outbid: 0,
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const extractLogsArray = (payload: any): BidLog[] => {
    // الحالات المحتملة:
    // 1) payload.data = [...]
    // 2) payload.data = { data: [...] }  (ResourceCollection)
    // 3) payload.data.data = [...]
    if (!payload) return [];

    const d = payload.data;

    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;

    return [];
  };

  const normalizeAuctionIds = (auctions_ids: any): number[] => {
    if (!auctions_ids) return [];
    if (Array.isArray(auctions_ids)) return auctions_ids.filter(Boolean);
    // لو جاي object
    return Object.values(auctions_ids).filter(Boolean) as number[];
  };

  const getEventIcon = (eventType: string) => {
    const iconClasses = "w-6 h-6";
    switch (eventType) {
      case "bid_placed":
        return <CheckCircle className={`${iconClasses} text-secondary`} />;
      case "outbid":
        return <TrendingDown className={`${iconClasses} text-orange-500`} />;
      case "autobid_fired":
        return <Zap className={`${iconClasses} text-primary`} />;
      case "bid_rejected":
        return <XCircle className={`${iconClasses} text-red-500`} />;
      case "bid_withdrawn":
        return <AlertCircle className={`${iconClasses} text-orange-500`} />;
      default:
        return <TrendingUp className={`${iconClasses} text-gray-500`} />;
    }
  };

  const getEventStyle = (eventType: string) => {
    switch (eventType) {
      case "bid_placed":
        return {
          bgColor: "bg-secondary",
          textColor: "text-white",
          borderColor: "border-secondary",
          cardBg: "bg-card",
          cardBorder: "border-border",
          cardText: "text-foreground",
          badgeBg: "bg-secondary/20",
          badgeText: "text-secondary",
          pulse: true,
        };
      case "outbid":
        return {
          bgColor: "bg-orange-500",
          textColor: "text-white",
          borderColor: "border-orange-500",
          cardBg: "bg-card",
          cardBorder: "border-border",
          cardText: "text-foreground",
          badgeBg: "bg-orange-500/20",
          badgeText: "text-orange-500",
          pulse: false,
        };
      case "autobid_fired":
        return {
          bgColor: "bg-primary",
          textColor: "text-white",
          borderColor: "border-primary",
          cardBg: "bg-card",
          cardBorder: "border-border",
          cardText: "text-foreground",
          badgeBg: "bg-primary/20",
          badgeText: "text-primary",
          pulse: false,
        };
      case "bid_rejected":
        return {
          bgColor: "bg-red-500",
          textColor: "text-white",
          borderColor: "border-red-500",
          cardBg: "bg-card",
          cardBorder: "border-border",
          cardText: "text-foreground",
          badgeBg: "bg-red-500/20",
          badgeText: "text-red-500",
          pulse: false,
        };
      default:
        return {
          bgColor: "bg-gray-500",
          textColor: "text-white",
          borderColor: "border-gray-500",
          cardBg: "bg-card",
          cardBorder: "border-border",
          cardText: "text-foreground",
          badgeBg: "bg-gray-500/20",
          badgeText: "text-gray-500",
          pulse: false,
        };
    }
  };

  const getEventBadge = (eventType: string) => {
    const badges: Record<string, string> = {
      bid_placed: "تمت المزايدة",
      outbid: "تم التجاوز",
      autobid_fired: "مزايدة تلقائية",
      bid_rejected: "مرفوضة",
      bid_withdrawn: "ملغية",
    };
    return badges[eventType] || eventType;
  };

  const getChannelText = (channel: string) => {
    const channels: Record<string, string> = {
      web: "موقع الويب",
      app: "التطبيق",
      onsite: "في الموقع",
      agent: "عبر وكيل",
      api: "API",
    };
    return channels[channel] || channel;
  };

  const getBestTimestamp = (log: BidLog) => {
    return log.client_ts || log.server_ts_utc || log.created_at || "";
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "—";
    return dayjs(timestamp).locale("ar").fromNow();
  };

  const fetchBidLogs = async (pageNum: number, isNewFilter = false) => {
    if (isNewFilter) setLoading(true);
    else setLoadingMore(true);

    try {
      let url = `/api/bids-history?filter=${filter}&page=${pageNum}`;
      if (selectedAuctionId) url += `&auction_id=${selectedAuctionId}`;

      const res = await api.get<BidHistoryResponse>(url);
      const payload = res.data;

      if (payload.status !== "success") {
        console.error("Unexpected response:", payload);
        return;
      }

      const newLogs = extractLogsArray(payload);

      setLogs((prev) => (isNewFilter ? newLogs : [...prev, ...newLogs]));
      setPagination(payload.pagination || null);

      if (isNewFilter) {
        setAuctionIds(normalizeAuctionIds(payload.auctions_ids));
        setStats(payload.stats || { total: 0, bid_placed: 0, outbid: 0 });
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      if (isNewFilter) setLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLogs([]);
    setPage(1);
    fetchBidLogs(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAuctionId, filter]);

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop <
        document.documentElement.offsetHeight - 100 ||
      loading ||
      loadingMore
    ) {
      return;
    }
    if (pagination && pagination.current_page < pagination.last_page) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    if (page > 1) fetchBidLogs(page, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loadingMore, pagination]);

  const SkeletonCard = () => (
    <div className="relative pr-16 mb-8">
      <div className="absolute right-0 top-0">
        <Skeleton variant="circular" width={48} height={48} />
      </div>
      <div className="absolute right-6 top-12 bottom-0 w-0.5 bg-gray-200" />
      <div className="bg-white rounded-lg shadow-sm p-5 border-r-4 border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div>
            <Skeleton variant="text" width={150} sx={{ fontSize: "1rem" }} />
            <Skeleton variant="text" width={100} sx={{ fontSize: "0.75rem" }} />
          </div>
          <Skeleton variant="rectangular" width={80} height={24} className="rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton variant="text" width={120} sx={{ fontSize: "1.5rem" }} />
          </div>
          <div className="text-left">
            <Skeleton variant="text" width={80} sx={{ fontSize: "0.875rem" }} />
            <Skeleton variant="text" width={60} sx={{ fontSize: "0.75rem" }} />
          </div>
        </div>
        <Skeleton variant="text" width={100} sx={{ fontSize: "0.875rem" }} className="mt-1" />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto mt-4" dir="rtl">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-sm mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">سجل المزايدات</h1>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-foreground/70">إجمالي المزايدات</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.bid_placed}</div>
            <div className="text-sm text-foreground/70">مزايدات تمت</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground/50">{stats.outbid}</div>
            <div className="text-sm text-foreground/70">تم تجاوزها</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm mb-6 p-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm ${
              filter === "all"
                ? "bg-primary text-white"
                : "bg-border text-foreground hover:bg-border/80"
            }`}
          >
            الكل
          </button>

          <button
            onClick={() => setFilter("bid_placed")}
            className={`px-4 py-2 rounded-lg text-sm ${
              filter === "bid_placed"
                ? "bg-primary text-white"
                : "bg-border text-foreground hover:bg-border/80"
            }`}
          >
            مزايدات تمت
          </button>

          <button
            onClick={() => setFilter("outbid")}
            className={`px-4 py-2 rounded-lg text-sm ${
              filter === "outbid"
                ? "bg-primary text-white"
                : "bg-border text-foreground hover:bg-border/80"
            }`}
          >
            متجاوزة
          </button>

          <select
            value={selectedAuctionId}
            onChange={(e) => setSelectedAuctionId(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm bg-border text-foreground hover:bg-border/80"
          >
            <option value="">كل المزادات</option>
            {auctionIds.map((id) => (
              <option key={id} value={String(id)}>
                مزاد #{id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {loading ? (
          Array.from(new Array(5)).map((_, index) => <SkeletonCard key={index} />)
        ) : (
          logs.map((log, i) => {
            const eventType = (log.event_type || "unknown").toString();
            const style = getEventStyle(eventType);

            const auctionId = log.auction_id ?? log.auction?.id ?? 0;
            const bidAmount = log.bid_amount ?? log.amount ?? 0;

            const ts = getBestTimestamp(log);

            const key =
              log.bid_id ??
              log.id ??
              `${auctionId}-${ts}-${i}`;

            return (
              <div key={key} className="relative pr-16 mb-8">
                {/* Timeline Icon */}
                <div
                  className={`absolute right-0 top-0 w-12 h-12 bg-gradient-to-br ${
                    style.badgeBg
                  } rounded-full flex items-center justify-center shadow-lg ${
                    style.pulse ? "animate-pulse" : ""
                  }`}
                >
                  {getEventIcon(eventType)}
                </div>

                {/* Timeline Line */}
                {i < logs.length - 1 && (
                  <div className="absolute right-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-primary to-border"></div>
                )}

                {/* Card */}
                <div
                  className={`${style.cardBg} rounded-lg shadow-sm p-5 border-r-4 ${style.borderColor} transition-all hover:-translate-x-1 hover:shadow-md`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-foreground mb-1">
                        {log.event || getEventBadge(eventType)}
                      </div>
                      <div className="text-xs text-foreground/70 flex items-center gap-2">
                        <span>{getChannelText(log.channel || "web")}</span>
                        {log.reason_code && (
                          <>
                            <span>•</span>
                            <span>{log.reason_code}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 ${style.badgeBg} ${style.badgeText} text-xs rounded-full font-semibold whitespace-nowrap`}
                    >
                      {getEventBadge(eventType)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div
                        className={`text-2xl font-bold ${
                          eventType === "outbid"
                            ? "text-foreground/70"
                            : "text-foreground"
                        }`}
                      >
                        <PriceWithIcon price={bidAmount} />
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="text-sm text-foreground/80 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(ts)}
                      </div>
                      <div className="text-xs text-foreground/50 mt-1">
                        {ts
                          ? new Date(ts).toLocaleString("ar-SA", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <p className="text-foreground/80 mt-1">
                    رقم المزاد #{auctionId || "—"}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {loadingMore &&
          Array.from(new Array(2)).map((_, index) => <SkeletonCard key={index} />)}
      </div>

      {logs.length === 0 && !loading && (
        <div className="bg-card rounded-lg shadow-sm p-8 text-center">
          <div className="text-foreground/50 mb-2">
            <TrendingUp className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-foreground/70">لا توجد مزايدات بعد</p>
        </div>
      )}
    </div>
  );
};

export default BidLogsTimeline;
