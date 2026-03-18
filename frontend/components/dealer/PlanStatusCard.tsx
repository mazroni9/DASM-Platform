// components/dealer/PlanStatusCard.tsx
"use client";

import { motion } from "framer-motion";
import { Crown, Calendar, RefreshCw } from "lucide-react";

interface PlanStatusCardProps {
  planName?: string;
  planType?: "pro" | "basic" | "enterprise";
  expiryYear?: number;
  autoRenew?: boolean;
}

export default function PlanStatusCard({
  planName = "التاجر المحترف",
  planType = "pro",
  expiryYear = 2025,
  autoRenew = true,
}: PlanStatusCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-50 via-amber-100/50 to-yellow-50 dark:from-amber-900/30 dark:via-amber-800/20 dark:to-yellow-900/20 border border-amber-300/50 dark:border-amber-500/20 rounded-2xl overflow-hidden relative"
    >
      {/* خلفية زخرفية */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-400 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-yellow-400 rounded-full blur-2xl" />
      </div>

      <div className="relative p-5">
        {/* الرأس */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-amber-700 dark:text-amber-400/70 font-medium uppercase tracking-wider">
              PLAN STATUS
            </span>
          </div>
        </div>

        {/* اسم الخطة */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-foreground mb-1">{planName}</h3>
          <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-bold rounded-lg border border-amber-500/30">
            (PRO)
          </span>
        </div>

        {/* تفاصيل الاشتراك */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-foreground/50" />
            <span className="text-foreground/70">نشط حتى:</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {expiryYear}
            </span>
          </div>

          {autoRenew && (
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400">
                التجديد تلقائي
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
