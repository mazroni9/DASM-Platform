// components/dealer/SniperZoneEnhanced.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, TrendingDown, ExternalLink } from "lucide-react";
import { useDealerStore, AiRecommendation } from "@/store/dealerStore";
import { cn } from "@/lib/utils";

interface SniperZoneEnhancedProps {
  onViewAuction?: (vehicleId: number) => void;
}

export default function SniperZoneEnhanced({
  onViewAuction,
}: SniperZoneEnhancedProps) {
  const { aiRecommendations, aiEnabled } = useDealerStore();

  if (!aiEnabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <Target className="w-10 h-10 mx-auto mb-3 text-foreground/30" />
        <p className="text-foreground/50 text-sm">
          قم بتفعيل محرك الذكاء الاصطناعي لعرض فرص القنص
        </p>
      </div>
    );
  }

  if (aiRecommendations.length === 0) {
    return (
      <div className="bg-card border border-primary/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-bold text-foreground">رادار القنص</h3>
        </div>
        <div className="text-center py-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="w-12 h-12 mx-auto mb-3 border-2 border-primary/30 border-t-primary rounded-full"
          />
          <p className="text-sm text-foreground/50">جاري البحث عن فرص...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-primary/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-l from-primary/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">رادار القنص</h3>
            <p className="text-xs text-foreground/50">
              {aiRecommendations.length} فرص متاحة
            </p>
          </div>
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-full"
        >
          <Zap className="w-3 h-3 text-emerald-400" />
          <span className="text-xs text-emerald-400">نشط</span>
        </motion.div>
      </div>

      {/* Recommendations List */}
      <div className="max-h-80 overflow-y-auto">
        <AnimatePresence>
          {aiRecommendations.map((rec, index) => (
            <motion.div
              key={`${rec.vehicleId}-${rec.timestamp}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-4 border-b border-border last:border-0",
                "hover:bg-primary/5 transition-colors cursor-pointer"
              )}
              onClick={() => onViewAuction?.(rec.vehicleId)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">
                    {rec.name}
                  </h4>
                  <p className="text-xs text-foreground/50 mt-1">
                    {rec.reason}
                  </p>

                  {/* Prices */}
                  <div className="flex items-center gap-3 mt-2">
                    <div>
                      <span className="text-xs text-foreground/40">
                        السعر الحالي
                      </span>
                      <p className="text-sm font-bold text-primary">
                        {rec.currentPrice.toLocaleString()} ر.س
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-foreground/40">
                        سعر السوق
                      </span>
                      <p className="text-sm text-foreground/60 line-through">
                        {rec.marketPrice.toLocaleString()} ر.س
                      </p>
                    </div>
                  </div>
                </div>

                {/* Discount Badge */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-lg">
                    <TrendingDown className="w-3 h-3 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">
                      -{rec.discountPercentage}%
                    </span>
                  </div>

                  {/* Confidence */}
                  <div className="mt-2 text-xs text-foreground/40">
                    ثقة: {Math.round(rec.confidenceScore * 100)}%
                  </div>

                  <ExternalLink className="w-4 h-4 text-foreground/30 mt-2" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
