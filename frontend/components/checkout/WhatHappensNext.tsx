"use client";

import { Check, FileText, Key } from "lucide-react";

const steps = [
  {
    icon: Check,
    iconColor: "text-blue-600",
    title: "1. معالجة الدفع",
    description: "تأكيد فوري للعملية",
  },
  {
    icon: FileText,
    iconColor: "text-slate-400",
    title: "2. نقل الملكية",
    description: 'يتم آلياً عبر نظام "تم"',
  },
  {
    icon: Key,
    iconColor: "text-slate-400",
    title: "3. استلام السيارة",
    description: "من ساحة المزاد بالرياض",
  },
];

export default function WhatHappensNext() {
  return (
    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
      <h3 className="font-bold text-blue-900 mb-4 text-sm">
        ماذا يحدث بعد الدفع؟
      </h3>

      <div className="flex flex-col md:flex-row justify-between gap-6 relative">
        {/* Dashed Line (Desktop only) */}
        <div className="hidden md:block absolute top-5 right-0 left-0 h-0.5 border-t-2 border-dashed border-blue-200 -z-10 mt-1" />

        {steps.map((step, index) => {
          const IconComponent = step.icon;
          return (
            <div
              key={index}
              className="flex md:flex-col gap-4 md:items-center md:text-center bg-blue-50 z-10 pr-2 md:pr-0"
            >
              <div className="w-12 h-12 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center shadow-sm">
                <IconComponent className={`w-5 h-5 ${step.iconColor}`} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">
                  {step.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
