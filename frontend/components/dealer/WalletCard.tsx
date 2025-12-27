// components/dealer/WalletCard.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, Lock, Zap, ChevronLeft, Car } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: number;
  carName: string;
  price: number;
  status: "sold" | "pending" | "completed";
  date: string;
}

interface WalletCardProps {
  balance?: number;
  credit?: number;
  reserved?: number;
  purchases?: Transaction[];
  sales?: Transaction[];
}

export default function WalletCard({
  balance = 500000,
  credit = 200000,
  reserved = 0,
  purchases = [
    {
      id: 1,
      carName: "Toyota Camry 2023",
      price: 85000,
      status: "sold",
      date: "2024-12-01",
    },
    {
      id: 2,
      carName: "Hyundai Tucson 2022",
      price: 72500,
      status: "pending",
      date: "2023-11-05",
    },
    {
      id: 3,
      carName: "Kia K5 2023",
      price: 90000,
      status: "pending",
      date: "2023-11-10",
    },
  ],
  sales = [
    {
      id: 1,
      carName: "BMW X5 2022",
      price: 185000,
      status: "completed",
      date: "2024-11-28",
    },
    {
      id: 2,
      carName: "Mercedes C200 2023",
      price: 145000,
      status: "sold",
      date: "2024-11-15",
    },
  ],
}: WalletCardProps) {
  const [activeTab, setActiveTab] = useState<"purchases" | "sales">(
    "purchases"
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sold":
        return "تم البيع";
      case "pending":
        return "بانتظار الدفع";
      case "completed":
        return "مكتمل";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sold":
        return "text-green-400 bg-green-500/10";
      case "pending":
        return "text-amber-400 bg-amber-500/10";
      case "completed":
        return "text-blue-400 bg-blue-500/10";
      default:
        return "text-gray-400 bg-gray-500/10";
    }
  };

  const currentTransactions = activeTab === "purchases" ? purchases : sales;

  return (
    <div className="bg-card backdrop-blur-xl border border-border rounded-2xl overflow-hidden">
      {/* رأس المحفظة - الرصيد المتاح */}
      <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-sm text-foreground/70">الرصيد المتاح</span>
          <span className="text-lg mr-auto">🪙</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-emerald-400">
            {balance.toLocaleString()}
          </span>
          <span className="text-sm text-foreground/50">ريال سعودي (SAR)</span>
        </div>
      </div>

      {/* الائتمان والمبلغ المحجوز */}
      <div className="p-4 border-b border-border grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-foreground/50">الائتمان المتاح</p>
            <p className="text-lg font-bold text-blue-400">
              +{credit.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <Lock className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-foreground/50">المبلغ المحجوز</p>
            <p className="text-lg font-bold text-red-400">
              {reserved.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* زر طلب التمويل */}
      <div className="p-4 border-b border-border">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-gradient-to-l from-amber-500 via-amber-400 to-yellow-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-shadow"
        >
          <Zap className="w-5 h-5" />
          طلب تمويل لحظي
        </motion.button>
      </div>

      {/* تبويبات المشتريات/المبيعات */}
      <div className="border-b border-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab("purchases")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-all duration-300 border-b-2",
              activeTab === "purchases"
                ? "text-primary border-primary bg-primary/5"
                : "text-foreground/50 border-transparent hover:text-foreground"
            )}
          >
            مشترياتي ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-all duration-300 border-b-2",
              activeTab === "sales"
                ? "text-primary border-primary bg-primary/5"
                : "text-foreground/50 border-transparent hover:text-foreground"
            )}
          >
            مبيعاتي ({sales.length})
          </button>
        </div>
      </div>

      {/* قائمة المعاملات */}
      <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
        {currentTransactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 bg-background/50 rounded-xl border border-border hover:border-primary/30 transition-all duration-300 group"
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              <Car className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {transaction.carName}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded",
                    getStatusColor(transaction.status)
                  )}
                >
                  {getStatusLabel(transaction.status)}
                </span>
                <span className="text-xs text-foreground/40">
                  {transaction.date}
                </span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">
                {transaction.price.toLocaleString()}
              </p>
              <p className="text-xs text-foreground/40">ر.س</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* رابط عرض السجل الكامل */}
      <div className="p-4 border-t border-border">
        <button className="w-full text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1">
          عرض السجل الكامل
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
