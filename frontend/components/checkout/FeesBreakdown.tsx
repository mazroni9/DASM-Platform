"use client";

import { Server, Receipt, FileText, CreditCard } from "lucide-react";
import { FIXED_ADMIN_FEE } from "@/lib/paymentCalculations";

interface ServiceFeesBreakdownProps {
  commission: number;
  commissionVat: number;
  adminFee?: number;
  gatewayFee: number;
  gatewayFeeVat: number;
  total: number;
}

interface FeesBreakdownProps {
  carPrice: number;
  serviceFees: ServiceFeesBreakdownProps;
}

export default function FeesBreakdown({
  carPrice,
  serviceFees,
}: FeesBreakdownProps) {
  // Fee rows for display - Gateway fees removed (Platform absorbs them)
  const feeRows = [
    {
      icon: Server,
      label: "عمولة المنصة",
      amount: serviceFees.commission,
      highlight: false,
    },
    {
      icon: Receipt,
      label: "ضريبة القيمة المضافة (15%)",
      amount: serviceFees.commissionVat,
      highlight: false,
    },
    {
      icon: FileText,
      label: "رسوم الخدمة ونقل الملكية",
      amount: serviceFees.adminFee || FIXED_ADMIN_FEE,
      highlight: true,
      note: "تشمل: المرور، تم، نقل الملكية",
    },
    // Gateway fees removed - Platform absorbs payment processing fees
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-800">
          تفصيل رسوم الخدمة (الدفع الإلكتروني)
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          المرحلة الأولى - دفع عبر البطاقة البنكية
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {/* Car Price Row - For Reference */}
            <tr className="group">
              <td className="py-3 text-slate-600 font-medium">
                سعر السيارة (يُحوَّل لاحقاً)
              </td>
              <td className="py-3 text-left font-bold text-slate-400 text-base">
                {carPrice.toLocaleString()} ر.س
              </td>
            </tr>

            {/* Separator */}
            <tr>
              <td colSpan={2} className="py-2">
                <div className="text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-2 rounded-lg">
                  رسوم الخدمة (تُدفع الآن):
                </div>
              </td>
            </tr>

            {/* Fee Rows */}
            {feeRows.map((fee, index) => {
              const IconComponent = fee.icon;
              return (
                <tr
                  key={index}
                  className={
                    fee.highlight ? "bg-amber-50/50" : "bg-slate-50/50"
                  }
                >
                  <td className="py-3 text-slate-500 pr-4">
                    <div className="flex items-start gap-2">
                      <IconComponent
                        className={`w-4 h-4 mt-0.5 ${
                          fee.highlight ? "text-amber-500" : "text-slate-300"
                        }`}
                      />
                      <div>
                        <span
                          className={
                            fee.highlight ? "text-amber-700 font-medium" : ""
                          }
                        >
                          {fee.label}
                        </span>
                        {fee.note && (
                          <p className="text-xs text-amber-600 mt-0.5">
                            {fee.note}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td
                    className={`py-3 text-left ${
                      fee.highlight
                        ? "text-amber-700 font-semibold"
                        : "text-slate-600"
                    }`}
                  >
                    {fee.amount.toLocaleString()} ر.س
                  </td>
                </tr>
              );
            })}

            {/* Total Row */}
            <tr className="border-t-2 border-blue-200 bg-blue-50">
              <td className="pt-4 pb-3 font-bold text-lg text-blue-900">
                إجمالي رسوم الخدمة
              </td>
              <td className="pt-4 pb-3 text-left font-bold text-2xl text-blue-900">
                {serviceFees.total.toLocaleString()}{" "}
                <span className="text-sm font-normal">ر.س</span>
              </td>
            </tr>
          </tbody>
        </table>

        <p className="text-xs text-slate-400 mt-4">
          * سيتم دفع سعر السيارة ({carPrice.toLocaleString()} ر.س) عبر تحويل
          بنكي في الخطوة التالية.
        </p>
      </div>
    </div>
  );
}
