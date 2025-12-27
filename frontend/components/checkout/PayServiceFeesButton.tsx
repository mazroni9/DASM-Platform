"use client";

import { useState } from "react";
import { CreditCard, Loader2, ExternalLink, ShieldCheck } from "lucide-react";
import api from "@/lib/axios";

interface PayServiceFeesButtonProps {
  settlementId: number;
  totalAmount: number;
  onPaymentInitiated?: () => void;
  onError?: (error: string) => void;
}

export default function PayServiceFeesButton({
  settlementId,
  totalAmount,
  onPaymentInitiated,
  onError,
}: PayServiceFeesButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/api/payment/initiate", {
        settlement_id: settlementId,
      });

      if (response.data.redirect_url) {
        // Notify parent component
        onPaymentInitiated?.();

        // CRITICAL: Redirect the user to ClickPay hosted payment page
        window.location.href = response.data.redirect_url;
      } else {
        throw new Error(response.data.message || "Failed to initiate payment");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "حدث خطأ أثناء بدء عملية الدفع";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-bold text-lg text-slate-800">دفع رسوم الخدمة</h2>
        <div className="flex gap-2 items-center">
          {/* Payment Network Icons */}
          <div className="flex gap-1">
            <img
              src="/assets/images/Mada-01.svg"
              alt="Mada"
              className="h-6 w-auto"
            />
            <img
              src="/assets/images/Visa-01.svg"
              alt="Visa"
              className="h-6 w-auto"
            />
            <img
              src="/assets/images/Mastercard-01.svg"
              alt="Mastercard"
              className="h-6 w-auto"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        {/* Amount Display */}
        <div className="text-center mb-6">
          <p className="text-sm text-slate-500 mb-1">المبلغ المطلوب</p>
          <p className="text-3xl font-bold text-slate-800">
            {totalAmount.toLocaleString("ar-SA")}{" "}
            <span className="text-lg">ر.س</span>
          </p>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">
                بوابة دفع آمنة
              </p>
              <p className="text-xs text-blue-600 mt-1">
                سيتم تحويلك إلى صفحة الدفع الآمنة لإتمام عملية الدفع ببطاقتك
                البنكية
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-xl font-bold text-white text-lg
            bg-gradient-to-l from-blue-600 to-blue-700 
            hover:from-blue-700 hover:to-blue-800
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-all duration-200 shadow-lg hover:shadow-xl
            flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري تحويلك للدفع...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              ادفع الآن
            </>
          )}
        </button>

        {/* Security Note */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-center text-xs text-slate-400 flex justify-center items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            معالجة آمنة ومشفرة بواسطة <strong>ClickPay</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
