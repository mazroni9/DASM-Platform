"use client";

import { useState } from "react";
import { Check, Sparkles, CreditCard, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type Gateway = "moyasar" | "clickpay";

interface PaymentGatewayOption {
  id: Gateway;
  name: string;
  nameEn: string;
  description: string;
  featured?: boolean;
  icons: { src: string; alt: string }[];
  badge?: string;
}

interface PaymentGatewaySelectorProps {
  selectedGateway: Gateway;
  onGatewayChange: (gateway: Gateway) => void;
  disabled?: boolean;
}

const gateways: PaymentGatewayOption[] = [
  {
    id: "moyasar",
    name: "مويسر",
    nameEn: "Moyasar",
    description: "ادفع مباشرة - مدى، STC Pay، Visa",
    featured: true,
    badge: "مُوصى به",
    icons: [
      { src: "/assets/images/Mada-01.svg", alt: "Mada" },
      { src: "/assets/images/STC-pay-01.svg", alt: "STC Pay" },
      { src: "/assets/images/Visa-01.svg", alt: "Visa" },
      { src: "/assets/images/Mastercard-01.svg", alt: "Mastercard" },
    ],
  },
  {
    id: "clickpay",
    name: "الإنماء كليك باي",
    nameEn: "Alinma ClickPay",
    description: "تحويل لصفحة دفع خارجية",
    icons: [
      { src: "/assets/images/Visa-01.svg", alt: "Visa" },
      { src: "/assets/images/Mastercard-01.svg", alt: "Mastercard" },
    ],
  },
];

export default function PaymentGatewaySelector({
  selectedGateway,
  onGatewayChange,
  disabled = false,
}: PaymentGatewaySelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-slate-800 text-sm mb-2">
        اختر طريقة الدفع
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gateways.map((gateway) => {
          const isSelected = selectedGateway === gateway.id;

          return (
            <button
              key={gateway.id}
              onClick={() => !disabled && onGatewayChange(gateway.id)}
              disabled={disabled}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all duration-200 text-right",
                "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                isSelected
                  ? "border-blue-500 bg-blue-50/50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Featured Badge */}
              {gateway.featured && (
                <div className="absolute -top-2 right-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {gateway.badge}
                </div>
              )}

              {/* Selection Indicator */}
              <div
                className={cn(
                  "absolute top-3 left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected
                    ? "border-blue-500 bg-blue-500"
                    : "border-slate-300 bg-white"
                )}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>

              {/* Content */}
              <div className="pr-0 pl-8">
                {/* Gateway Name */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-800">
                    {gateway.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({gateway.nameEn})
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                  {gateway.id === "clickpay" && (
                    <ExternalLink className="w-3 h-3" />
                  )}
                  {gateway.description}
                </p>

                {/* Payment Icons */}
                <div className="flex gap-2 items-center">
                  {gateway.icons.map((icon, idx) => (
                    <img
                      key={idx}
                      src={icon.src}
                      alt={icon.alt}
                      className="h-5 w-auto"
                    />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type { Gateway };
