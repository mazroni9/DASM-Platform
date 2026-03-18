"use client";
import React, { useState } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { PriceWithIcon } from "@/components/ui/priceWithIcon";
import {
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Loader2,
  AlertTriangle,
  Gavel,
  Plus,
  SaudiRiyal,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface BidFormProps {
  auction_id: number;
  bid_amount: number; // السعر الحالي
  auction_type: string;
  onSuccess?: () => void;
}

export default function BidForm({
  auction_id,
  bid_amount,
  auction_type,
  onSuccess,
}: BidFormProps) {
  const [bidAmount, setBidAmount] = useState<number | string>(bid_amount);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { isLoggedIn, user } = useAuth();

  // خيارات المزايدة السريعة
  let BidOptions = [];
  if (bid_amount > 100000) {
    BidOptions = [100, 300, 1000];
  } else {
    BidOptions = [100, 300, 500];
  }
  const quickBidOptions = BidOptions.map((increment) => ({
    value: increment,
    label: `+${increment}`,
  }));

  const roundToNearest5 = (number: number): number => {
    return Math.round(number / 5) * 5;
  };

  const selectQuickBid = (increment: number) => {
    const newBid = roundToNearest5(bid_amount + increment);
    setBidAmount(newBid);
    setCustomAmount(newBid.toString());
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setCustomAmount("");
      setBidAmount("");
      return;
    }
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (cleanValue) {
      const numValue = parseInt(cleanValue);
      setCustomAmount(numValue.toString());
      setBidAmount(numValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("يرجى تسجيل الدخول أولاً للمزايدة");
      return;
    }

    const numericBid =
      typeof bidAmount === "string"
        ? parseInt(bidAmount.replace(/,/g, ""))
        : bidAmount;

    if (!numericBid || isNaN(numericBid)) {
      setError("الرجاء إدخال مبلغ صحيح");
      return;
    }

    if (auction_type !== "silent_instant") {
      if (numericBid <= bid_amount) {
        setError("يجب أن يكون المبلغ أعلى من السعر الحالي");
        return;
      }
    }

    setError(null);
    setIsSubmitting(true);
    const client_ts = new Date().toISOString();

    try {
      const response = await api.post("/api/auctions/bid", {
        auction_id,
        user_id: user?.id,
        bid_amount: numericBid,
        client_ts,
      });

      if (response.data.status === "success") {
        setSuccess("تم تقديم العرض بنجاح!");
        toast.success("تم تقديم العرض بنجاح!");
        setBidAmount(bid_amount);
        setCustomAmount("");
        if (onSuccess) onSuccess();
      } else if (response.data.status === "success_sold") {
        setSuccess(response.data.message);
        toast.success(response.data.message);
        setTimeout(() => window.location.reload(), 1500);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(response.data.message || "حدث خطأ أثناء تقديم العرض");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "حدث خطأ في الاتصال بالخادم - يرجى المحاولة مرة أخرى لاحقًا";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // حالة عدم تسجيل الدخول
  if (!isLoggedIn) {
    return (
      <div className="text-center py-6 bg-primary/5 rounded-2xl border border-primary/10">
        <div className="bg-white p-3 rounded-full w-14 h-14 mx-auto mb-4 shadow-sm flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          ترغب في المزايدة؟
        </h3>
        <p className="text-foreground/60 text-sm mb-5 px-4">
          قم بتسجيل الدخول للبدء في المزايدة على هذه السيارة
        </p>
        <button
          type="button"
          onClick={() => useAuthStore.getState().openAuthModal("login")}
          className="w-[90%] mx-auto py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          تسجيل الدخول
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* أزرار المزايدة السريعة */}
        <div className="grid grid-cols-3 gap-3">
          {quickBidOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => selectQuickBid(option.value)}
              className="group relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border border-border/60 bg-background dark:bg-slate-800 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 active:scale-95"
            >
              <span className="text-xs text-foreground/50 mb-0.5 group-hover:text-primary/70">
                زيادة
              </span>
              <span className="font-bold text-foreground text-lg group-hover:text-primary flex items-center gap-0.5">
                {option.value}+
              </span>
            </button>
          ))}
        </div>

        {/* مربع إدخال المبلغ المخصص */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground/50 pr-1">
            أو أدخل مبلغاً مخصصاً
          </label>
          <div className="relative">
            <input
              type="text"
              value={customAmount}
              onChange={handleCustomAmountChange}
              placeholder={bid_amount.toLocaleString()}
              className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-4 pl-16 text-foreground text-lg font-bold placeholder-foreground/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary">
              <span className="text-sm font-bold bg-primary/10 px-2 py-1 rounded-md">
                ر.س
              </span>
            </div>
          </div>
        </div>

        {/* رسائل التنبيه والخطأ */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 text-green-600 rounded-xl flex items-center gap-3 border border-green-100 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-bold">{success}</span>
          </div>
        )}

        {/* التحذير الإلزامي */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100/50">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-700">
                تنبيه قبل التأكيد
              </p>
              <p className="text-xs text-amber-600/80 leading-relaxed">
                تأكد من أن المبلغ المدخل أعلى من السعر الحالي بحد أدنى 100 ريال.
                المزايدة ملزمة قانونياً.
              </p>
            </div>
          </div>
        </div>

        {/* زر الإرسال */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 text-lg shadow-lg ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/30 hover:-translate-y-0.5"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري التنفيذ...
            </>
          ) : (
            <>
              <Gavel className="w-5 h-5" />
              إرسال العرض
            </>
          )}
        </button>
      </form>
    </div>
  );
}
