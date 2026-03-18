"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { PriceWithIcon } from "../ui/priceWithIcon";
import LoadingLink from "../LoadingLink";

type CarInfo = {
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
};

function toNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

// Helper function to format the countdown timer
const formatTime = (seconds: number) => {
  if (seconds <= 0) return "00:00:00";
  const s = Math.floor(seconds);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${ss}`;
};

const FixedAuctionCard = ({ auction }: { auction: FixedAuction }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const car = auction?.car ?? null;

  const openingPrice = useMemo(() => {
    // fallback محترم لو opening_price مش موجود
    return toNumber(auction?.opening_price ?? auction?.starting_bid ?? 0, 0);
  }, [auction?.opening_price, auction?.starting_bid]);

  const currentBid = useMemo(() => {
    return toNumber(auction?.current_bid ?? openingPrice ?? 0, 0);
  }, [auction?.current_bid, openingPrice]);

  useEffect(() => {
    if (!auction?.end_time) {
      setTimeRemaining(0);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const endDate = new Date(auction.end_time as string).getTime();
      const diffSeconds = (endDate - now) / 1000;
      setTimeRemaining(diffSeconds > 0 ? diffSeconds : 0);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [auction?.end_time]);

  if (!car) return null;

  const imgSrc =
    car.images && car.images.length > 0 ? car.images[0] : "/placeholder-icon.png";

  return (
    <div className="bg-card rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
      <div className="relative h-48">
        <Image
          src={imgSrc}
          alt={`${car.make || ""} ${car.model || ""}`.trim() || "Car"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          style={{ objectFit: "cover" }}
          priority={false}
        />
      </div>

      <div className="p-4">
        <h3 className="text-xl font-bold text-foreground">
          {car.make || "—"} {car.model || ""} {car.year ? `- ${car.year}` : ""}
        </h3>

        <div className="mt-4">
          <div className="flex justify-between items-center text-foreground">
            <span>سعر الافتتاح</span>
            <span className="font-bold">
              <PriceWithIcon price={openingPrice} />
            </span>
          </div>

          <div className="flex justify-between items-center text-primary mt-2">
            <span>أعلى سعر حالي</span>
            <span className="font-bold text-lg">
              <PriceWithIcon price={currentBid} />
            </span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="text-2xl font-mono bg-border p-2 rounded-lg">
            {formatTime(timeRemaining)}
          </div>
        </div>

        <div className="mt-4">
          <LoadingLink href={`/carDetails/${auction.car_id}`}>
            <button className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors">
              المزايدة الآن
            </button>
          </LoadingLink>
        </div>
      </div>
    </div>
  );
};

export default FixedAuctionCard;
