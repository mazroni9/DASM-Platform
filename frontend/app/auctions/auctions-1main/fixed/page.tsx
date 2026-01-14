"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import FixedAuctionCard from "@/components/auctions/FixedAuctionCard";
import { usePusher } from "@/contexts/PusherContext";
import LoadingLink from "@/components/LoadingLink";
import { ChevronRight } from "lucide-react";

type CarInfo = {
  id: number;
  make?: string;
  model?: string;
  year?: number;
  images?: string[];
};

type FixedAuction = {
  id: number;
  car_id: number;
  end_time?: string | null;
  opening_price?: number | string | null;
  starting_bid?: number | string | null;
  current_bid?: number | string | null;
  car?: CarInfo | null;
  bids?: any[];
};

type Paginator<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

function normalizeFixedAuction(raw: any): FixedAuction {
  const car = raw?.car ?? null;

  return {
    id: raw?.id ?? 0,
    car_id: raw?.car_id ?? car?.id ?? 0,
    end_time: raw?.end_time ?? null,
    opening_price: raw?.opening_price ?? null,
    starting_bid: raw?.starting_bid ?? null,
    current_bid: raw?.current_bid ?? null,
    car,
    bids: Array.isArray(raw?.bids) ? raw.bids : [],
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isPaginator<T = any>(v: unknown): v is Paginator<T> {
  if (!isObject(v)) return false;
  return (
    Array.isArray((v as any).data) &&
    typeof (v as any).current_page === "number" &&
    typeof (v as any).last_page === "number" &&
    typeof (v as any).total === "number"
  );
}

/**
 * الباك بيرجع غالبًا:
 * { status: "success", data: paginator }
 * وأحيانًا ممكن يرجع array مباشر (احتياطي)
 */
function extractPagination(responseData: any): {
  list: FixedAuction[];
  currentPage: number;
  lastPage: number;
  total: number;
} {
  const container = responseData?.data;

  if (isPaginator(container)) {
    const list = container.data
      .map(normalizeFixedAuction)
      .filter((a) => a.id && a.car_id);

    return {
      list,
      currentPage: container.current_page ?? 1,
      lastPage: container.last_page ?? 1,
      total: container.total ?? list.length,
    };
  }

  if (Array.isArray(container)) {
    const list = container
      .map(normalizeFixedAuction)
      .filter((a) => a.id && a.car_id);

    return {
      list,
      currentPage: 1,
      lastPage: 1,
      total: list.length,
    };
  }

  return { list: [], currentPage: 1, lastPage: 1, total: 0 };
}

const FixedAuctionPage = () => {
  const [auctions, setAuctions] = useState<FixedAuction[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const isMountedRef = useRef(true);
  const requestSeqRef = useRef(0);

  const { subscribe, unsubscribe, isConnected } = usePusher();

  const fetchFixedAuctions = useCallback(async (pageToLoad: number) => {
    const seq = ++requestSeqRef.current;

    try {
      if (pageToLoad === 1) setLoadingInitial(true);
      else setLoadingMore(true);

      setError(null);

      const response = await api.get("/api/auctions/fixed", {
        headers: { Accept: "application/json; charset=UTF-8" },
        params: { page: pageToLoad },
      });

      const { list, currentPage, lastPage: lp, total: t } =
        extractPagination(response.data);

      if (!isMountedRef.current) return;
      if (seq !== requestSeqRef.current) return;

      setPage(currentPage);
      setLastPage(lp);
      setTotal(t);

      setAuctions((prev) => {
        if (pageToLoad === 1) return list;

        // append مع منع التكرار
        const map = new Map<number, FixedAuction>();
        for (const a of prev) map.set(a.id, a);
        for (const a of list) map.set(a.id, { ...map.get(a.id), ...a });
        return Array.from(map.values());
      });
    } catch (err) {
      console.error(err);
      if (!isMountedRef.current) return;

      setError("Failed to fetch fixed auctions.");
      if (pageToLoad === 1) setAuctions([]);
    } finally {
      if (!isMountedRef.current) return;
      setLoadingInitial(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchFixedAuctions(1);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchFixedAuctions]);

  useEffect(() => {
    if (!isConnected) return;

    const channel = subscribe("auction.fixed");
    if (!channel) return;

    const onNewBid = (event: any) => {
      const updatedRaw =
        event?.data?.active_auction ??
        event?.active_auction ??
        event?.auction ??
        event?.data?.auction ??
        null;

      if (!updatedRaw) return;

      const updated = normalizeFixedAuction(updatedRaw);

      setAuctions((prev) => {
        const idx = prev.findIndex((a) => a.id === updated.id);
        if (idx === -1) return [updated, ...prev];

        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updated };
        return copy;
      });
    };

    const onMoved = () => {
      fetchFixedAuctions(1);
    };

    channel.bind("NewBidEvent", onNewBid);
    channel.bind("CarMovedBetweenAuctionsEvent", onMoved);

    return () => {
      try {
        channel.unbind("NewBidEvent", onNewBid);
        channel.unbind("CarMovedBetweenAuctionsEvent", onMoved);
      } catch {}
      unsubscribe("auction.fixed");
    };
  }, [isConnected, subscribe, unsubscribe, fetchFixedAuctions]);

  const canLoadMore = page < lastPage;

  const content = useMemo(() => {
    if (loadingInitial) {
      return <p className="text-center text-foreground/70">Loading...</p>;
    }

    if (error) {
      return <p className="text-center text-red-500">{error}</p>;
    }

    if (auctions.length === 0) {
      return (
        <p className="text-center text-foreground/70">
          لا توجد مزادات ثابتة متاحة حالياً
        </p>
      );
    }

    return (
      <>
        <div className="text-center text-foreground/70 mb-6">
          المعروض الآن:{" "}
          <span className="font-semibold">{auctions.length}</span> من{" "}
          <span className="font-semibold">{total}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {auctions.map((auction) => (
            <FixedAuctionCard key={auction.id} auction={auction} />
          ))}
        </div>

        <div className="flex justify-center mt-8">
          {canLoadMore ? (
            <button
              onClick={() => fetchFixedAuctions(page + 1)}
              disabled={loadingMore}
              className="px-6 py-3 rounded-xl border border-border bg-card hover:bg-border transition-colors disabled:opacity-50"
            >
              {loadingMore ? "جارٍ التحميل..." : "تحميل المزيد"}
            </button>
          ) : (
            <p className="text-foreground/50 text-sm">تم عرض جميع المزادات</p>
          )}
        </div>
      </>
    );
  }, [
    loadingInitial,
    error,
    auctions,
    total,
    canLoadMore,
    loadingMore,
    page,
    fetchFixedAuctions,
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 md:px-6 py-4">
      <div className="max-w-7xl mx-auto">
        {/* زر العودة */}
        <div className="flex justify-end lg:justify-start mb-4">
          <LoadingLink
            href="/auctions"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors px-4 py-2.5 text-sm rounded-xl border border-border hover:border-primary/50 bg-card/50 hover:bg-card backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            العودة
          </LoadingLink>
        </div>

        <h1 className="text-3xl text-foreground font-bold text-center my-6">
          المزاد الثابت
        </h1>

        <p className="text-foreground/70 text-center my-4 max-w-4xl mx-auto">
          هذا هو المكان الذي تحصل فيه السيارات الرائعة على فرصة ثانية. السيارات
          المعروضة هنا لم يتم بيعها في المزادات الأخرى، وتُعرض الآن في مزاد تقليدي
          بسيط ومحدد بوقت. عندما ينتهي العداد، يفوز صاحب أعلى سعر بالمزاد تلقائياً.
          إنها فرصتك لاقتناص سيارة أحلامك بسعر رائع.
        </p>

        <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border p-5 shadow-2xl">
          {content}
        </div>
      </div>
    </div>
  );
};

export default FixedAuctionPage;
