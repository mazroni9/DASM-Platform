"use client";

import { ArrowLeft } from "lucide-react";

interface OrderSummaryProps {
  subtotal: number;
  totalFees: number;
  totalAmount: number;
  termsAccepted: boolean;
  onTermsChange: (checked: boolean) => void;
  onConfirm: () => void;
}

export default function OrderSummary({
  subtotal,
  totalFees,
  totalAmount,
  termsAccepted,
  onTermsChange,
  onConfirm,
}: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sticky top-24">
      <h3 className="font-bold text-slate-800 mb-4">ملخص الطلب</h3>

      {/* Subtotal */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-500 text-sm">المجموع الفرعي</span>
        <span className="font-semibold">{subtotal.toLocaleString()} ر.س</span>
      </div>

      {/* Fees */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
        <span className="text-slate-500 text-sm">مجموع الرسوم</span>
        <span className="font-semibold text-red-600">
          + {totalFees.toLocaleString()} ر.س
        </span>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center mb-6">
        <span className="font-bold text-slate-800">الإجمالي النهائي</span>
        <span className="font-bold text-xl text-blue-900">
          {totalAmount.toLocaleString()} ر.س
        </span>
      </div>

      {/* Terms Checkbox */}
      <div className="flex gap-3 items-start mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <input
          type="checkbox"
          id="terms"
          checked={termsAccepted}
          onChange={(e) => onTermsChange(e.target.checked)}
          className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label
          htmlFor="terms"
          className="text-xs text-slate-600 cursor-pointer select-none"
        >
          أقر بأني راجعت جميع التفاصيل المالية وأوافق على{" "}
          <a href="#" className="text-blue-600 underline">
            الشروط والأحكام
          </a>{" "}
          الخاصة بالمنصة وعملية الشراء.
        </label>
      </div>

      {/* CTA Button */}
      <button
        onClick={onConfirm}
        disabled={!termsAccepted}
        className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        تأكيد واستمرار للدفع
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Payment Logos */}
      <div className="mt-4 flex justify-center gap-3 grayscale opacity-60">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png"
          alt="Mastercard"
          className="h-6"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png"
          alt="Visa"
          className="h-6"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Mada_Logo.svg"
          alt="Mada"
          className="h-6"
        />
      </div>
    </div>
  );
}
