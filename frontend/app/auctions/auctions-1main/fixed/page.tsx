"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import FixedAuctionCard from "@/components/auctions/FixedAuctionCard";
import Pusher from "pusher-js";

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

function extractAuctionsArray(responseData: any): FixedAuction[] {
  // المتوقع: { status, data: paginator } أو { status, data: [] }
  const container = responseData?.data;

  // paginator: { data: [...] }
  const rows = Array.isArray(container?.data)
    ? container.data
    : Array.isArray(container)
      ? container
      : [];

  return rows.map(normalizeFixedAuction).filter((a) => a.id && a.car_id);
}

const FixedAuctionPage = () => {
  const [auctions, setAuctions] = useState<FixedAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const fetchFixedAuctions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/api/auctions/fixed", {
        headers: { Accept: "application/json; charset=UTF-8" },
      });

      const list = extractAuctionsArray(response.data);

      if (!isMountedRef.current) return;
      setAuctions(list);
    } catch (err) {
      console.error(err);
      if (!isMountedRef.current) return;
      setError("Failed to fetch fixed auctions.");
      setAuctions([]);
    } finally {
      if (!isMountedRef.current) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchFixedAuctions();

    const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    const cluster =
      process.env.NEXT_PUBLIC_PUSHER_CLUSTER ||
      process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER ||
      "ap2";

    // لو env ناقص، من غير ما نكسر الصفحة
    if (!key) {
      console.warn("Pusher key is missing (NEXT_PUBLIC_PUSHER_APP_KEY).");
      return () => {
        isMountedRef.current = false;
      };
    }

    const pusher = new Pusher(key, { cluster });

    const channel = pusher.subscribe("auction.fixed");

    channel.bind("NewBidEvent", (event: any) => {
      // مرونة في شكل الـ payload
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
        if (idx === -1) {
          // لو مزاد جديد ظهر فجأة
          return [updated, ...prev];
        }
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updated };
        return copy;
      });
    });

    channel.bind("CarMovedBetweenAuctionsEvent", () => {
      // الأفضل نعمل reload كامل عشان أي تغييرات في القائمة/الـ status
      fetchFixedAuctions();
    });

    return () => {
      isMountedRef.current = false;
      pusher.unsubscribe("auction.fixed");
      pusher.disconnect();
    };
  }, [fetchFixedAuctions]);

  const content = useMemo(() => {
    if (loading) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {auctions.map((auction) => (
          <FixedAuctionCard key={auction.id} auction={auction} />
        ))}
      </div>
    );
  }, [loading, error, auctions]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl text-foreground font-bold text-center my-8">
        المزاد الثابت
      </h1>

      <p className="text-foreground/70 text-center my-4">
        هذا هو المكان الذي تحصل فيه السيارات الرائعة على فرصة ثانية. السيارات
        المعروضة هنا لم يتم بيعها في المزادات الأخرى، وتُعرض الآن في مزاد تقليدي
        بسيط ومحدد بوقت. عندما ينتهي العداد، يفوز صاحب أعلى سعر بالمزاد تلقائياً.
        إنها فرصتك لاقتناص سيارة أحلامك بسعر رائع.
      </p>

      {content}
    </div>
  );
};

export default FixedAuctionPage;
