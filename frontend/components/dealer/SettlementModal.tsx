// components/dealer/SettlementModal.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

interface WalletSummary {
  available_balance: number;
  funded_balance: number;
}

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  authToken: string;
}

export default function SettlementModal({
  isOpen,
  onClose,
  authToken,
}: SettlementModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dealer/wallet/transactions?limit=5", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      if (data.status === "success") {
        setTransactions(data.data.transactions);
        setWalletSummary(data.data.wallet_summary);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "DEPOSIT":
        return <ArrowDownCircle className="w-5 h-5 text-emerald-400" />;
      case "WITHDRAW":
        return <ArrowUpCircle className="w-5 h-5 text-red-400" />;
      case "HOLD":
        return <Clock className="w-5 h-5 text-amber-400" />;
      default:
        return <CheckCircle className="w-5 h-5 text-primary" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-l from-primary/10 to-transparent">
              <h2 className="text-lg font-bold text-foreground">
                محرك التسويات
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-foreground/10 transition-colors"
              >
                <X className="w-5 h-5 text-foreground/60" />
              </button>
            </div>

            {/* Wallet Summary */}
            {walletSummary && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-background/50">
                <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-foreground/60">الرصيد المتاح</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {walletSummary.available_balance.toLocaleString()} ر.س
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-foreground/60">محجوز</p>
                  <p className="text-lg font-bold text-amber-400">
                    {walletSummary.funded_balance.toLocaleString()} ر.س
                  </p>
                </div>
              </div>
            )}

            {/* Transactions List */}
            <div className="p-4 max-h-80 overflow-y-auto">
              <h3 className="text-sm font-semibold text-foreground/70 mb-3">
                آخر المعاملات
              </h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-center text-foreground/50 py-8">
                  لا توجد معاملات
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                        "bg-background/50 border-border hover:bg-background"
                      )}
                    >
                      {getTransactionIcon(tx.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {tx.description || tx.type}
                        </p>
                        <p className="text-xs text-foreground/50">
                          {formatDate(tx.created_at)}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "font-bold text-sm",
                          tx.type.toUpperCase() === "DEPOSIT"
                            ? "text-emerald-400"
                            : "text-red-400"
                        )}
                      >
                        {tx.type.toUpperCase() === "DEPOSIT" ? "+" : "-"}
                        {Math.abs(tx.amount).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-background/50">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
