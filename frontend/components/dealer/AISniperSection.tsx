// components/dealer/AISniperSection.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  Zap,
  Moon,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Car,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIRecommendation {
  vehicleId: string;
  carName: string;
  matchScore: number;
  marketAvgPrice: number;
  suggestedBidPrice: number;
  discountPercentage: string;
  recommendationText: string;
  confidenceScore: number;
  imageUrl?: string;
}

interface AISniperSectionProps {
  isActive?: boolean;
  recommendations?: AIRecommendation[];
  onToggle?: () => void;
}

export default function AISniperSection({
  isActive = false,
  recommendations = [
    {
      vehicleId: "10234",
      carName: "Toyota Land Cruiser",
      matchScore: 98,
      marketAvgPrice: 280000,
      suggestedBidPrice: 246400,
      discountPercentage: "12%",
      recommendationText: "فرصة نادرة: أقل من السوق بـ 12%",
      confidenceScore: 0.98,
    },
    {
      vehicleId: "10235",
      carName: "Lexus LX 600",
      matchScore: 85,
      marketAvgPrice: 450000,
      suggestedBidPrice: 414000,
      discountPercentage: "8%",
      recommendationText: "طلب مراجع: هاشتين بخ متوقع 8%",
      confidenceScore: 0.85,
    },
  ],
  onToggle,
}: AISniperSectionProps) {
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setPulseActive((prev) => !prev);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  const getRecommendationIcon = (text: string) => {
    if (text.includes("فرصة نادرة") || text.includes("لقطة")) {
      return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
    if (text.includes("خصم") || text.includes("فرصة")) {
      return <TrendingDown className="w-4 h-4 text-green-400" />;
    }
    if (text.includes("تنبيه") || text.includes("مراجع")) {
      return <AlertTriangle className="w-4 h-4 text-orange-400" />;
    }
    return <Zap className="w-4 h-4 text-blue-400" />;
  };

  const getMatchColor = (score: number) => {
    if (score >= 90)
      return "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
    if (score >= 75) return "text-blue-400 bg-blue-500/20 border-blue-500/30";
    if (score >= 50)
      return "text-amber-400 bg-amber-500/20 border-amber-500/30";
    return "text-gray-400 bg-gray-500/20 border-gray-500/30";
  };

  // حالة الخمول
  if (!isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card backdrop-blur-xl border border-border rounded-2xl p-8"
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative mb-4">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center">
              <Moon className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 text-2xl">😴</div>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            محرك الذكاء الاصطناعي متوقف
          </h3>
          <p className="text-sm text-foreground/50 mb-4">
            قم بتفعيله من الشريط العلوي
          </p>
          <button
            onClick={onToggle}
            className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors text-sm"
          >
            تفعيل المحرك
          </button>
        </div>
      </motion.div>
    );
  }

  // حالة النشاط
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card backdrop-blur-xl border border-primary/20 rounded-2xl overflow-hidden"
    >
      {/* رأس الرادار */}
      <div className="p-4 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={cn(
                  "w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center transition-all duration-500",
                  pulseActive && "shadow-lg shadow-primary/30"
                )}
              >
                <Radar className="w-5 h-5 text-primary" />
              </div>
              {/* Pulse effect */}
              <div
                className={cn(
                  "absolute inset-0 rounded-xl border-2 border-primary/50 animate-ping",
                  !pulseActive && "opacity-0"
                )}
              />
            </div>
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2">
                رادار القنص (AI Sniper)
                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                  يعمل
                </span>
              </h3>
              <p className="text-xs text-foreground/50">تحليل مستمر للفرص</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 text-foreground/50 hover:text-foreground transition-colors"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* بطاقات التوصيات */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {recommendations.map((rec, index) => (
              <motion.div
                key={rec.vehicleId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
                className="bg-background/50 border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-300 group cursor-pointer"
              >
                {/* نسبة التطابق */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getRecommendationIcon(rec.recommendationText)}
                    <span className="text-sm font-medium text-foreground/70">
                      {rec.recommendationText.split(":")[0]}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-1 rounded-lg border",
                      getMatchColor(rec.matchScore)
                    )}
                  >
                    MATCH: {rec.matchScore}%
                  </span>
                </div>

                {/* معلومات السيارة */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Car className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{rec.carName}</h4>
                    <p className="text-xs text-foreground/50">
                      {rec.recommendationText.includes(":")
                        ? rec.recommendationText.split(":")[1].trim()
                        : `خصم ${rec.discountPercentage}`}
                    </p>
                  </div>
                </div>

                {/* السعر المقترح */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-foreground/50">السعر المقترح</p>
                    <p className="text-lg font-bold text-primary">
                      {rec.suggestedBidPrice.toLocaleString()}{" "}
                      <span className="text-xs">ر.س</span>
                    </p>
                  </div>
                  <button className="p-2 bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
