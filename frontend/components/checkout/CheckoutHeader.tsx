"use client";

import { Lock } from "lucide-react";

export default function CheckoutHeader() {
  return (
    <header className="bg-white border-b border-slate-200 py-4 sticky top-0 z-30">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold">
            D
          </div>
          <span className="font-bold text-xl text-blue-900">
            المزادات الرقمية
          </span>
        </div>

        {/* Secure Payment Indicator */}
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Lock className="w-4 h-4 text-green-600" />
          <span className="hidden sm:inline">دفع آمن ومشفّر 100%</span>
        </div>
      </div>
    </header>
  );
}
