// components/dealer/FinancialHUDEnhanced.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  CreditCard,
  Lock,
  RefreshCw,
  FileText,
  Plus,
} from "lucide-react";
import { useDealerStore } from "@/store/dealerStore";
import SettlementModal from "./SettlementModal";
import { cn } from "@/lib/utils";

interface FinancialHUDEnhancedProps {
  authToken: string;
}

export default function FinancialHUDEnhanced({
  authToken,
}: FinancialHUDEnhancedProps) {
  const { wallet } = useDealerStore();
  const [showSettlement, setShowSettlement] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh - in real app, refetch wallet data
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const cards = [
    {
      label: "الرصيد المتاح",
      value: wallet.availableBalance,
      icon: Wallet,
      color: "emerald",
      gradient: "from-emerald-500/10 to-emerald-600/5",
      border: "border-emerald-500/20",
    },
    {
      label: "الائتمان",
      value: wallet.creditLimit,
      icon: CreditCard,
      color: "blue",
      gradient: "from-blue-500/10 to-blue-600/5",
      border: "border-blue-500/20",
    },
    {
      label: "محجوز",
      value: wallet.onHold,
      icon: Lock,
      color: "amber",
      gradient: "from-amber-500/10 to-amber-600/5",
      border: "border-amber-500/20",
    },
  ];

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">المحفظة المالية</h3>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-foreground/5 transition-colors"
          >
            <RefreshCw
              className={cn(
                "w-4 h-4 text-foreground/50",
                isRefreshing && "animate-spin"
              )}
            />
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {cards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-3 rounded-xl bg-gradient-to-br border",
                card.gradient,
                card.border
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <card.icon
                  className={cn("w-4 h-4", `text-${card.color}-400`)}
                />
                <span className="text-xs text-foreground/60">{card.label}</span>
              </div>
              <motion.p
                key={card.value}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                className={cn("text-lg font-bold", `text-${card.color}-400`)}
              >
                {card.value.toLocaleString()}
                <span className="text-xs font-normal mr-1">ر.س</span>
              </motion.p>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettlement(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">محرك التسويات</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">إيداع</span>
          </button>
        </div>
      </div>

      {/* Settlement Modal */}
      <SettlementModal
        isOpen={showSettlement}
        onClose={() => setShowSettlement(false)}
        authToken={authToken}
      />
    </>
  );
}
