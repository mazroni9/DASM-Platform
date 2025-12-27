// components/dealer/LiveAuctionCard.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Clock, MapPin, Gauge, Calendar, Plus, Car } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveAuctionProps {
  auctionId?: string;
  carName?: string;
  carYear?: number;
  mileage?: number;
  location?: string;
  currentPrice?: number;
  timeRemaining?: number; // in seconds
  imageUrl?: string;
  bidIncrements?: number[];
  walletBalance?: number;
  onBid?: (amount: number) => void;
}

export default function LiveAuctionCard({
  auctionId = "12345",
  carName = "Mercedes-Benz S-Class 580",
  carYear = 2023,
  mileage = 12000,
  location = "الرياض",
  currentPrice = 620000,
  timeRemaining = 3,
  imageUrl,
  bidIncrements = [1000, 500],
  walletBalance = 500000,
  onBid,
}: LiveAuctionProps) {
  const [remainingTime, setRemainingTime] = useState(timeRemaining);
  const [price, setPrice] = useState(currentPrice);
  const [isHot, setIsHot] = useState(true);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleBid = (increment: number) => {
    const newPrice = price + increment;
    if (walletBalance >= newPrice) {
      setPrice(newPrice);
      onBid?.(newPrice);
    }
  };

  const canBid = (increment: number) => {
    return walletBalance >= price + increment;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card backdrop-blur-xl border border-red-500/20 rounded-2xl overflow-hidden"
    >
      {/* رأس المزايدة الساخنة */}
      <div className="p-4 bg-gradient-to-l from-red-500/10 via-orange-500/5 to-transparent border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30"
              >
                <Flame className="w-5 h-5 text-white" />
              </motion.div>
            </div>
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2">
                مزايدة ساخنة
                <span className="text-lg">🔥</span>
              </h3>
            </div>
          </div>

          {/* Timer and LIVE badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
              <Clock className="w-4 h-4 text-foreground/50" />
              <span
                className={cn(
                  "font-mono font-bold text-lg",
                  remainingTime <= 10 ? "text-red-400" : "text-foreground"
                )}
              >
                {formatTime(remainingTime)}
              </span>
            </div>
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg"
            >
              LIVE
            </motion.span>
          </div>
        </div>
      </div>

      {/* معلومات السيارة والسعر */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* صورة السيارة */}
          <div className="w-32 h-24 bg-muted rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={carName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Car className="w-12 h-12 text-muted-foreground" />
            )}
          </div>

          {/* تفاصيل السيارة */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-lg font-bold text-foreground">{carName}</h4>
                <div className="flex items-center gap-3 text-xs text-foreground/50 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {carYear}
                  </span>
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    KM {mileage.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {location}
                  </span>
                </div>
              </div>
            </div>

            {/* السعر الحالي */}
            <div className="mt-3">
              <p className="text-xs text-foreground/50 mb-1">السعر الحالي</p>
              <motion.p
                key={price}
                initial={{ scale: 1.1, color: "#22c55e" }}
                animate={{ scale: 1, color: "#ef4444" }}
                className="text-3xl font-bold text-red-400"
              >
                {price.toLocaleString()}
              </motion.p>
            </div>
          </div>
        </div>

        {/* أزرار المزايدة */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {bidIncrements.map((increment, index) => (
            <motion.button
              key={increment}
              whileHover={{ scale: canBid(increment) ? 1.02 : 1 }}
              whileTap={{ scale: canBid(increment) ? 0.98 : 1 }}
              onClick={() => handleBid(increment)}
              disabled={!canBid(increment)}
              className={cn(
                "py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300",
                index === 0
                  ? "bg-gradient-to-l from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
                  : "bg-muted text-foreground border border-border hover:border-primary/30",
                !canBid(increment) && "opacity-50 cursor-not-allowed"
              )}
            >
              <Plus className="w-4 h-4" />
              {increment.toLocaleString()}+
              <span className="text-xs opacity-70 mr-2">مزايدة فورية</span>
            </motion.button>
          ))}
        </div>

        {/* تحذير الرصيد */}
        {walletBalance < price + Math.min(...bidIncrements) && (
          <p className="text-xs text-red-400 text-center mt-3">
            ⚠️ رصيدك غير كافٍ للمزايدة
          </p>
        )}
      </div>
    </motion.div>
  );
}
