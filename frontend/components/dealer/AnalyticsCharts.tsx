// components/dealer/AnalyticsCharts.tsx
"use client";

import { motion } from "framer-motion";
import { Package, FileSearch, Wifi } from "lucide-react";
import LiquidityChart from "./LiquidityChart";
import BiddingEfficiencyChart from "./BiddingEfficiencyChart";

interface AnalyticsChartsProps {
  isConnected?: boolean;
  authToken?: string;
}

export default function AnalyticsCharts({
  isConnected = true,
  authToken = "",
}: AnalyticsChartsProps) {
  return (
    <div className="space-y-4">
      {/* خدمات مساندة */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4"
      >
        <h3 className="text-sm font-bold text-foreground mb-3">خدمات مساندة</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="p-4 bg-background/50 rounded-xl border border-border hover:border-primary/30 transition-all duration-300 flex flex-col items-center gap-2 group">
            <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-foreground">الشحن</span>
          </button>
          <button className="p-4 bg-background/50 rounded-xl border border-border hover:border-primary/30 transition-all duration-300 flex flex-col items-center gap-2 group">
            <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
              <FileSearch className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-sm font-medium text-foreground">الفحص</span>
          </button>
        </div>
      </motion.div>

      {/* مخطط السيولة - Real Data */}
      <LiquidityChart authToken={authToken} />

      {/* مخطط كفاءة المزايدة - Real Data */}
      <BiddingEfficiencyChart authToken={authToken} />

      {/* حالة الاتصال */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-2 p-3 bg-card backdrop-blur-xl border border-border rounded-xl"
      >
        <Wifi
          className={
            isConnected ? "w-4 h-4 text-emerald-400" : "w-4 h-4 text-red-400"
          }
        />
        <span className="text-xs">
          Stream:{" "}
          <span className={isConnected ? "text-emerald-400" : "text-red-400"}>
            {isConnected ? "connected" : "disconnected"}
          </span>
        </span>
      </motion.div>
    </div>
  );
}
