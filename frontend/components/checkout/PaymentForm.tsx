"use client";

import { useState } from "react";
import { Lock, CircleHelp, CreditCard, ShieldCheck } from "lucide-react";

interface PaymentFormProps {
  totalAmount: number;
  onSubmit: (cardData: CardData) => void;
  isProcessing?: boolean;
}

interface CardData {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
}

export default function PaymentForm({
  totalAmount,
  onSubmit,
  isProcessing = false,
}: PaymentFormProps) {
  const [cardData, setCardData] = useState<CardData>({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvc: "",
  });

  const handleInputChange = (field: keyof CardData, value: string) => {
    setCardData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const numbersOnly = value.replace(/\D/g, "");
    const groups = numbersOnly.match(/.{1,4}/g);
    return groups ? groups.join(" ") : "";
  };

  const formatExpiryDate = (value: string) => {
    const numbersOnly = value.replace(/\D/g, "");
    if (numbersOnly.length >= 2) {
      return numbersOnly.slice(0, 2) + " / " + numbersOnly.slice(2, 4);
    }
    return numbersOnly;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(cardData);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-bold text-lg text-slate-800">
          بيانات البطاقة البنكية
        </h2>
        <div className="flex gap-2">
          <CreditCard className="w-6 h-6 text-blue-900" />
          <CreditCard className="w-6 h-6 text-red-600" />
          <CreditCard className="w-6 h-6 text-slate-400" />
        </div>
      </div>

      {/* Form */}
      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cardholder Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              اسم حامل البطاقة
            </label>
            <input
              type="text"
              value={cardData.cardholderName}
              onChange={(e) =>
                handleInputChange("cardholderName", e.target.value)
              }
              placeholder="مثال: MOHAMMED ALSAUD"
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              required
            />
          </div>

          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              رقم البطاقة
            </label>
            <div className="relative">
              <input
                type="text"
                value={cardData.cardNumber}
                onChange={(e) =>
                  handleInputChange(
                    "cardNumber",
                    formatCardNumber(e.target.value)
                  )
                }
                placeholder="0000 0000 0000 0000"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                dir="ltr"
                maxLength={19}
                required
              />
              <div className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Expiry & CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                تاريخ الانتهاء
              </label>
              <input
                type="text"
                value={cardData.expiryDate}
                onChange={(e) =>
                  handleInputChange(
                    "expiryDate",
                    formatExpiryDate(e.target.value)
                  )
                }
                placeholder="MM / YY"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-center"
                dir="ltr"
                maxLength={7}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                رمز التحقق (CVC)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardData.cvc}
                  onChange={(e) =>
                    handleInputChange("cvc", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="123"
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-center"
                  dir="ltr"
                  maxLength={3}
                  required
                />
                <div
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 cursor-help"
                  title="الرقم خلف البطاقة"
                >
                  <CircleHelp className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              دفع مبلغ {totalAmount.toLocaleString()} ر.س
            </button>
            <p className="text-center text-xs text-slate-400 mt-3 flex justify-center items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              معالجة آمنة ومشفرة بواسطة <strong>Moyasar</strong>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
