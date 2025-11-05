"use client";
import React, { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { AlertCircle, CheckCircle2, TrendingUp, Loader2, SaudiRiyal } from "lucide-react";
interface BidFormProps {
  auction_id: number;
  bid_amount: number; // السعر الحالي
  onSuccess?: () => void;
}
export default function BidForm({
  auction_id,
  bid_amount,
  onSuccess,
}: BidFormProps) {
  const [bidAmount, setBidAmount] = useState<number | string>(bid_amount);
  const [customAmount, setCustomAmount] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { isLoggedIn, user } = useAuth(); // حساب خيارات المزايدة السريعة 
  const quickBidOptions = [100, 200, 300, 400, 500, 1000].map(increment => ({ value: increment, label: formatCurrency(bid_amount + increment) })); const roundToNearest5 = (number: number): number => { return Math.round(number / 5) * 5; }; const selectQuickBid = (increment: number) => { const newBid = roundToNearest5(bid_amount + increment); setBidAmount(newBid); setCustomAmount(newBid.toString()); }; const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => { const value = e.target.value; if (value === "") { setCustomAmount(""); setBidAmount(""); return; } const cleanValue = value.replace(/[^0-9]/g, ""); if (cleanValue) { const numValue = parseInt(cleanValue); setCustomAmount(numValue.toString()); setBidAmount(numValue); } }; const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!isLoggedIn) { toast.error("يرجى تسجيل الدخول أولاً للمزايدة"); return; } const numericBid = typeof bidAmount === "string" ? parseInt(bidAmount.replace(/,/g, "")) : bidAmount; if (!numericBid || isNaN(numericBid)) { setError("الرجاء إدخال مبلغ صحيح"); return; } if (numericBid <= bid_amount) { setError(`يجب أن يكون المبلغ أكبر من ${formatCurrency(bid_amount)}`); return; } setError(null); setIsSubmitting(true); const client_ts = new Date().toISOString(); try { const response = await api.post("/api/auctions/bid", { auction_id, user_id: user?.id, bid_amount: numericBid, client_ts }); if (response.data.status === "success") { setSuccess("تم تقديم العرض بنجاح!"); toast.success("تم تقديم العرض بنجاح!"); setBidAmount(bid_amount); setCustomAmount(""); setTimeout(() => window.location.reload(), 1500); if (onSuccess) onSuccess(); } else { throw new Error(response.data.message || "حدث خطأ أثناء تقديم العرض"); } } catch (err: any) { const errorMessage = err.response?.data?.message || "حدث خطأ في الاتصال بالخادم - يرجى المحاولة مرة أخرى لاحقًا"; setError(errorMessage); toast.error(errorMessage); } finally { setIsSubmitting(false); } };
  return (
    <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 p-5 shadow-2xl">
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl mb-3 border border-border">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-primary">قدم عرضك الآن</h3>
        </div>
        <p className="text-sm text-foreground/80">
          السعر الحالي:{" "}
          <span className="font-semibold text-secondary">
            {formatCurrency(bid_amount)}
          </span>
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* أزرار المزايدة السريعة */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {increments.map((inc) => (
            <button
              key={inc}
              type="button"
              onClick={() => selectQuickBid(option.value)}
              className="bg-card/60 hover:bg-card/70 text-foreground/70 text-sm py-2.5 px-3 rounded-xl border border-border/50 hover:border-border transition-colors duration-200"
            >
              +{option.value}
            </button>
          ))}
        </div>
        {/* مربع إدخال المبلغ */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground/50">
            أو أدخل مبلغًا مخصصًا
          </label>
          <div className="relative">
            <input
              type="text"
              value={customAmount}
              onChange={handleCustomAmountChange}
              placeholder={`أدخل مبلغًا أعلى من ${bid_amount.toLocaleString()} ريال`}
              className="w-full bg-card/70 border border-border rounded-xl px-4 py-3.5 text-foreground/80 placeholder-foreground/50 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none backdrop-blur-sm"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/80 text-sm">
              <SaudiRiyal />
            </div>
          </div>
        </div>
        {/* زر الإرسال */}
        <button
          type="submit"
          disabled={
            isSubmitting || !bidAmount || Number(bidAmount) <= bid_amount
          }
          className={`w-full py-3.5 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
            isSubmitting || !bidAmount || Number(bidAmount) <= bid_amount
              ? "bg-card cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl border border-primary/30"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              إرسال العرض
            </>
          )}
        </button>
        {/* رسائل الحالة */}
        {error && (
          <div className="p-3 bg-destructive/20 border border-destructive/40 text-destructive rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 bg-secondary/20 border border-secondary/40 text-secondary rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}
        {/* ملاحظة للمستخدم */}
        <div className="text-xs text-foreground/70 bg-card/30 p-3 rounded-xl border border-border/30">
          <p className="text-center">
            ⚠️ تأكد من أن المبلغ الذي تقدمه أعلى من السعر الحالي. سيتم خصم
            المبلغ من رصيدك فور قبول العرض.
          </p>
        </div>
      </form>
    </div>
  );
}
