// app/dealer/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Radio,
  FileText,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Activity,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDealerSocket } from "@/hooks/useDealerSocket";
import { useDealerStore } from "@/store/dealerStore";
import { cn } from "@/lib/utils";

// Import dealer components
import ConnectionStatus from "@/components/dealer/ConnectionStatus";
import FinancialHUDEnhanced from "@/components/dealer/FinancialHUDEnhanced";
import SniperZoneEnhanced from "@/components/dealer/SniperZoneEnhanced";
import LiveAuctionGrid from "@/components/dealer/LiveAuctionGrid";
import PlanStatusCard from "@/components/dealer/PlanStatusCard";
import WatchlistTable from "@/components/dealer/WatchlistTable";
import AnalyticsCharts from "@/components/dealer/AnalyticsCharts";

export default function DealerDashboardPage() {
  const { user, token } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    isConnected,
    aiEnabled,
    userName,
    setUser,
    setWallet,
    setActiveAuctions,
    toggleAi,
    setConnectionStatus,
  } = useDealerStore();

  // Initialize WebSocket connection
  const { initPusher, subscribeToChannels, startLatencyPing } = useDealerSocket(
    {
      userId: user?.id || 0,
      authToken: token || "",
      aiEnabled,
    }
  );

  // Fetch initial dashboard data
  const fetchDashboardInit = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/dealer/dashboard/init", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.status === "success") {
        const { wallet, active_auctions, user: userData } = data.data;

        setWallet({
          availableBalance: wallet.available_balance,
          fundedBalance: wallet.funded_balance,
          onHold: wallet.funded_balance,
          creditLimit: wallet.credit_limit,
        });

        setActiveAuctions(active_auctions);

        setUser(
          userData.id,
          userData.name,
          userData.plan_type,
          userData.ai_enabled
        );

        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard init:", error);
    }
  }, [token, setWallet, setActiveAuctions, setUser]);

  // Initialize on mount
  useEffect(() => {
    if (user?.id && token) {
      fetchDashboardInit();
      initPusher();
      subscribeToChannels();
      startLatencyPing();
    }
  }, [
    user?.id,
    token,
    fetchDashboardInit,
    initPusher,
    subscribeToChannels,
    startLatencyPing,
  ]);

  // Handle AI toggle
  const handleAiToggle = async () => {
    const newState = !aiEnabled;
    toggleAi(newState);

    // Persist to backend
    try {
      await fetch("/api/dealer/ai/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: newState }),
      });
    } catch (error) {
      console.error("Failed to toggle AI:", error);
      toggleAi(!newState); // Revert on error
    }
  };

  // Handle bid placement
  const handleBid = async (auctionId: number, amount: number) => {
    try {
      const response = await fetch("/api/dealer/bid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          auction_id: auctionId,
          amount,
        }),
      });

      const data = await response.json();

      if (data.status !== "success") {
        alert(data.message || "فشل في تقديم المزايدة");
        // Refresh to get correct state
        fetchDashboardInit();
      }
    } catch (error) {
      console.error("Bid failed:", error);
      alert("حدث خطأ أثناء تقديم المزايدة");
      fetchDashboardInit();
    }
  };

  const displayName =
    userName ||
    (user
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
      : "التاجر");

  return (
    <div className="space-y-6">
      {/* الشريط العلوي - Top Ribbon */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-l from-primary/5 via-card to-primary/5 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-border rounded-2xl p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Live Indicator */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">
              لوحة التاجر المحترف
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-2 h-2 bg-emerald-400 rounded-full"
              />
              <span className="text-xs text-emerald-400 font-medium">
                نظام حي (Live)
              </span>
            </div>
          </div>

          {/* Control Panel */}
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <ConnectionStatus />

            {/* AI Engine Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-background/50 border border-border rounded-lg">
              <Radio
                className={cn(
                  "w-4 h-4",
                  aiEnabled ? "text-primary" : "text-foreground/40"
                )}
              />
              <span className="text-sm text-foreground/70">
                محرك الذكاء الاصطناعي
              </span>
              <button onClick={handleAiToggle} className="focus:outline-none">
                {aiEnabled ? (
                  <ToggleRight className="w-8 h-8 text-primary" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-foreground/40" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center py-6"
      >
        <h2 className="text-2xl font-bold text-foreground mb-3">
          مرحبا بك تاجرنا الذكي:{" "}
          <span className="text-primary">{displayName}</span>
        </h2>
      </motion.div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Zone 3: Analytics (Left) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 order-3 lg:order-1"
        >
          <div className="sticky top-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground/70 mb-1">
                3. التحليلات والخدمات
              </h3>
              <p className="text-xs text-foreground/40">بيانات الأداء</p>
            </div>
            <AnalyticsCharts
              isConnected={isConnected}
              authToken={token || ""}
            />
          </div>
        </motion.div>

        {/* Zone 2: Operations (Center) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-5 order-2"
        >
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground/70 mb-1">
              2. منطقة العمليات
            </h3>
            <p className="text-xs text-foreground/40">
              الذكاء الاصطناعي والمزادات الحية
            </p>
          </div>

          <div className="space-y-6">
            {/* AI Sniper Zone */}
            <SniperZoneEnhanced />

            {/* Live Auction Grid */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">المزادات الحية</h3>
              </div>
              <LiveAuctionGrid onBid={handleBid} />
            </div>
          </div>
        </motion.div>

        {/* Zone 1: Wallet (Right) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-4 order-1 lg:order-3"
        >
          <div className="sticky top-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground/70 mb-1">
                  1. المحفظة
                </h3>
                <p className="text-xs text-foreground/40">
                  الإدارة المالية الموسعة
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-foreground/40">
                <span>Wallet:</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
            </div>

            <div className="space-y-4">
              <FinancialHUDEnhanced authToken={token || ""} />
              <PlanStatusCard />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Watchlists */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <WatchlistTable />
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center py-6 border-t border-border"
      >
        <p className="text-sm text-foreground/40">
          DASM-e Platform v2.0 | نظام آمن ومشفر | Real-time WebSocket
        </p>
        <p className="text-xs text-foreground/30 mt-1">
          Pro Dealer Dashboard - Powered by Pusher
        </p>
      </motion.div>
    </div>
  );
}
