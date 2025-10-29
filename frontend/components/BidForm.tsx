"use client";

import React, { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { AlertCircle, CheckCircle2, TrendingUp, Loader2 } from "lucide-react";

interface BidFormProps {
  auction_id: number;
  bid_amount: number; // السعر الحالي
  onSuccess?: () => void;
}

export default function BidForm({ auction_id, bid_amount, onSuccess }: BidFormProps) {
  // حافظ على القيمة المبدئية، وتزامَن لو اتغيرت من الأب
  const [baseBid, setBaseBid] = useState<number>(bid_amount || 0);
  const [bidAmount, setBidAmount] = useState<number | string>(bid_amount || 0);
  const [customAmount, setCustomAmount] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { isLoggedIn, user } = useAuth();

  // لو السعر الحالي اتحدّث من الأب (Realtime/Pusher)، نسحب التحديث
  useEffect(() => {
    setBaseBid(bid_amount || 0);
    // ما نكسر إدخال المستخدم: ما نلمس customAmount لو بيكتب
    if (!customAmount) {
      setBidAmount(bid_amount || 0);
    }
  }, [bid_amount]); // eslint-disable-line react-hooks/exhaustive-deps

  //increments الثابتة
  const increments = [100, 200, 300, 400, 500, 1000];

  const roundToNearest5 = (num: number): number => Math.round(num / 5) * 5;

  const selectQuickBid = (inc: number) => {
    const newBid = roundToNearest5((baseBid || 0) + inc);
    setBidAmount(newBid);
    setCustomAmount(String(newBid));
    setError(null);
    setSuccess(null);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setCustomAmount("");
      setBidAmount("");
      return;
    }
    const digits = value.replace(/[^0-9]/g, "");
    if (digits) {
      const n = parseInt(digits, 10);
      setCustomAmount(String(n));
      setBidAmount(n);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      toast.error("يرجى تسجيل الدخول أولاً للمزايدة");
      return;
    }

    const numericBid = typeof bidAmount === "string" ? parseInt(bidAmount.replace(/,/g, ""), 10) : bidAmount;

    if (!numericBid || isNaN(numericBid)) {
      setError("الرجاء إدخال مبلغ صحيح");
      return;
    }

    if (numericBid <= baseBid) {
      setError(`يجب أن يكون المبلغ أكبر من ${formatCurrency(baseBid)}`);
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const client_ts = new Date().toISOString();
      const response = await api.post("/api/auctions/bid", {
        auction_id,
        user_id: user?.id,
        bid_amount: numericBid,
        client_ts,
      });

      if (response?.data?.status === "success") {
        setSuccess("تم تقديم العرض بنجاح!");
        toast.success("تم تقديم العرض بنجاح!");
        setCustomAmount("");
        setBidAmount(baseBid); // نرجّع الإدخال لآخر سعر معروف (هيتحدث تاني عبر Pusher/الأب)
        if (onSuccess) onSuccess();
        // لو حابب تسيب السطر الجاي زي ما هو عشان تحديث فوري للواجهة:
        setTimeout(() => window.location.reload(), 1200);
      } else {
        throw new Error(response?.data?.message || "حدث خطأ أثناء تقديم العرض");
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        "حدث خطأ في الاتصال بالخادم - يرجى المحاولة مرة أخرى لاحقًا";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 p-5 shadow-2xl">
      {/* رأس المكوّن */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600/15 to-fuchsia-600/15 px-4 py-2 rounded-xl mb-3 border border-violet-500/20">
          <TrendingUp className="w-5 h-5 text-fuchsia-400" />
          <h3 className="font-bold text-slate-100">قدّم عرضك الآن</h3>
        </div>
        <p className="text-sm text-slate-400">
          السعر الحالي:{" "}
          <span className="font-semibold text-fuchsia-300">{formatCurrency(baseBid)}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* أزرار المزايدة السريعة */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {increments.map((inc) => (
            <button
              key={inc}
              type="button"
              onClick={() => selectQuickBid(inc)}
              className="bg-slate-950/60 hover:bg-slate-900 text-slate-200 text-sm py-2.5 px-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors duration-150"
              title={`المجموع: ${formatCurrency((baseBid || 0) + inc)}`}
            >
              + {formatCurrency(inc)}
            </button>
          ))}
        </div>

        {/* إدخال مبلغ مخصص */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">أو أدخل مبلغًا مخصصًا</label>
          <div className="relative">
            <input
              type="text"
              value={customAmount}
              onChange={handleCustomAmountChange}
              placeholder={`أدخل مبلغًا أعلى من ${formatCurrency(baseBid)}`}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 focus:border-fuchsia-500/40"
              inputMode="numeric"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              ر.س
            </div>
          </div>
        </div>

        {/* زر الإرسال */}
        <button
          type="submit"
          disabled={
            isSubmitting ||
            !bidAmount ||
            Number(bidAmount) <= baseBid
          }
          className={`w-full py-3.5 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
            isSubmitting ||
            !bidAmount ||
            Number(bidAmount) <= baseBid
              ? "bg-slate-800 text-slate-300 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg hover:shadow-xl border border-fuchsia-500/30"
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
          <div className="p-3 bg-rose-500/10 border border-rose-400/30 text-rose-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-fuchsia-500/10 border border-fuchsia-400/30 text-fuchsia-200 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* ملاحظة للمستخدم */}
        <div className="text-xs text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
          <p className="text-center">
            ⚠️ تأكد أن عرضك أعلى من السعر الحالي. قد يتم تحديث السعر تلقائيًا أثناء البث المباشر.
          </p>
        </div>
      </form>
    </div>
  );
}
