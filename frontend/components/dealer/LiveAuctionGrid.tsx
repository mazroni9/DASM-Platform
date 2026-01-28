// components/dealer/LiveAuctionGrid.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, TrendingUp, Gavel, Flame, SaudiRiyal } from "lucide-react";
import { useDealerStore, Auction } from "@/store/dealerStore";
import { cn } from "@/lib/utils";

export default function LiveAuctionGrid() {
  const { activeAuctions } = useDealerStore();

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return "انتهى";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) return `${hours}س ${minutes}د`;
    if (minutes > 0) return `${minutes}د ${seconds}ث`;
    return `${seconds}ث`;
  };

  const isEndingSoon = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    return end - now < 60000; // Less than 1 minute
  };

  if (activeAuctions.length === 0) {
    return (
      <div className="text-center py-12 text-foreground/50">
        <Gavel className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>لا توجد مزادات نشطة حالياً</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {activeAuctions.map((auction, index) => (
        <motion.div
          key={auction.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            "relative rounded-xl border overflow-hidden transition-all duration-300",
            isEndingSoon(auction.end_time)
              ? "bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30"
              : "bg-card border-border hover:border-primary/30",
          )}
        >
          {/* Hot indicator */}
          {isEndingSoon(auction.end_time) && (
            <div className="absolute top-2 left-2 z-10">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="flex items-center gap-1 px-2 py-1 bg-red-500 rounded-full"
              >
                <Flame className="w-3 h-3 text-white" />
                <span className="text-xs text-white font-bold">حار</span>
              </motion.div>
            </div>
          )}

          {/* Car Image */}
          <div className="relative h-32 bg-gradient-to-b from-transparent to-black/50">
            {auction.car?.images ? (
              <img
                src={auction.car.images[0]}
                alt={`${auction.car.brand} ${auction.car.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-foreground/5 flex items-center justify-center">
                <Gavel className="w-8 h-8 text-foreground/20" />
              </div>
            )}
            {/* Timer overlay */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/70 rounded-lg">
              <Clock className="w-3 h-3 text-white" />
              <span className="text-xs text-white font-mono">
                {getTimeRemaining(auction.end_time)}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-bold text-foreground mb-1">
              {auction.car?.brand} {auction.car?.model} {auction.car?.year}
            </h3>

            <div className="flex items-center justify-between mt-3">
              {/* Current Price */}
              <div>
                <p className="text-xs text-foreground/50">السعر الحالي</p>
                <motion.p
                  key={auction.current_bid}
                  initial={{ scale: 1.1, color: "#22c55e" }}
                  animate={{ scale: 1, color: "inherit" }}
                  className="text-lg font-bold text-primary"
                >
                  {auction.current_bid?.toLocaleString() || 0} <SaudiRiyal />
                </motion.p>
              </div>

              {/* Details Link */}
              <Link
                href={`/carDetails/${auction.car?.id || auction.car_id}`}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                <TrendingUp className="w-4 h-4" />
                <span>عرض التفاصيل</span>
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
