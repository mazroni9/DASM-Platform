"use client";

import { useState } from "react";
import {
  Building2,
  Copy,
  Check,
  CreditCard,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  BANK_DETAILS,
  formatCurrencyWithUnit,
} from "@/lib/paymentCalculations";

interface BankTransferStepProps {
  carPrice: number;
  verificationCode: string;
  onComplete?: () => void;
}

export default function BankTransferStep({
  carPrice,
  verificationCode,
}: BankTransferStepProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const bankInfo = [
    {
      label: "رقم الآيبان (IBAN)",
      value: BANK_DETAILS.iban,
      fieldName: "iban",
    },
    {
      label: "اسم البنك",
      value: BANK_DETAILS.bankName,
      fieldName: "bank",
    },
    {
      label: "اسم الحساب",
      value: BANK_DETAILS.accountName,
      fieldName: "account",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-l from-emerald-600 to-emerald-700 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">تحويل سعر السيارة</h2>
            <p className="text-emerald-100 text-sm">
              الخطوة الأخيرة - التحويل البنكي
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Amount to Transfer */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
          <p className="text-sm text-emerald-700 mb-2">المبلغ المطلوب تحويله</p>
          <p className="text-4xl font-bold text-emerald-800">
            {formatCurrencyWithUnit(carPrice)}
          </p>
        </div>

        {/* Verification Code - Important */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
              <p className="font-bold text-amber-800 mb-1">
                رمز التحقق (مهم جداً)
              </p>
              <p className="text-sm text-amber-700 mb-3">
                يجب إضافة هذا الرمز في خانة "الملاحظات" أو "الوصف" عند التحويل
              </p>
              <div className="flex items-center gap-3">
                <div className="bg-white border-2 border-amber-400 rounded-lg px-4 py-3 font-mono text-2xl font-bold text-amber-900 tracking-wider">
                  {verificationCode}
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(verificationCode, "verification")
                  }
                  className="flex items-center gap-2 px-4 py-3 bg-amber-200 hover:bg-amber-300 text-amber-800 rounded-lg font-medium transition"
                >
                  {copiedField === "verification" ? (
                    <>
                      <Check className="w-4 h-4" />
                      تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      نسخ
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-500" />
            بيانات الحساب البنكي
          </h3>

          {bankInfo.map((item) => (
            <div
              key={item.fieldName}
              className="flex items-center justify-between bg-slate-50 rounded-lg p-4 group hover:bg-slate-100 transition"
            >
              <div>
                <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                <p
                  className={`font-semibold text-slate-800 ${
                    item.fieldName === "iban" ? "font-mono tracking-wide" : ""
                  }`}
                >
                  {item.value}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(item.value, item.fieldName)}
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                {copiedField === item.fieldName ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">تم</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    نسخ
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            تعليمات التحويل
          </h4>
          <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
            <li>قم بتحويل المبلغ المحدد أعلاه إلى الحساب البنكي المذكور</li>
            <li>
              <strong>تأكد من إضافة رمز التحقق</strong> في خانة الملاحظات
            </li>
            <li>سيتم التحقق من التحويل خلال 24-48 ساعة عمل</li>
            <li>ستصلك رسالة تأكيد عند اكتمال عملية نقل الملكية</li>
          </ol>
        </div>

        {/* Completion Notice */}
        <div className="bg-slate-100 rounded-xl p-4 text-center">
          <p className="text-slate-600 text-sm">
            بعد إتمام التحويل، سيتم التواصل معك لإكمال إجراءات نقل الملكية
          </p>
        </div>
      </div>
    </div>
  );
}
