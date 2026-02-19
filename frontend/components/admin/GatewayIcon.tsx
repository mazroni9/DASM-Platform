"use client";

import Image from "next/image";
import { CreditCard } from "lucide-react";

interface GatewayIconProps {
  gateway: string | null | undefined;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const gatewayConfig: Record<
  string,
  { icon: string; label: string; color: string }
> = {
  MOYASAR: {
    icon: "/images/payment/moyasar-logo.svg",
    label: "Moyasar",
    color: "text-purple-500",
  },
  CLICKPAY: {
    icon: "/images/payment/clickpay-logo.svg",
    label: "ClickPay",
    color: "text-blue-500",
  },
  SADAD: {
    icon: "/images/payment/sadad-logo.svg",
    label: "سداد",
    color: "text-green-500",
  },
  SARIE: {
    icon: "/images/payment/sarie-logo.svg",
    label: "ساري",
    color: "text-cyan-500",
  },
  BANK_TRANSFER: {
    icon: "",
    label: "تحويل بنكي",
    color: "text-gray-500",
  },
};

const sizeClasses = {
  sm: { icon: 16, text: "text-xs" },
  md: { icon: 20, text: "text-sm" },
  lg: { icon: 24, text: "text-base" },
};

export function GatewayIcon({
  gateway,
  size = "md",
  showLabel = true,
}: GatewayIconProps) {
  const normalizedGateway = gateway?.toUpperCase() || "";
  const config = gatewayConfig[normalizedGateway];
  const sizeConfig = sizeClasses[size];

  if (!config) {
    return (
      <div className="flex items-center gap-1.5">
        <CreditCard className={`w-4 h-4 text-muted-foreground`} />
        {showLabel && (
          <span className={`${sizeConfig.text} text-muted-foreground`}>
            {gateway || "غير محدد"}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {config.icon ? (
        <div
          className="relative flex items-center justify-center bg-white rounded p-0.5"
          style={{ width: sizeConfig.icon + 4, height: sizeConfig.icon + 4 }}
        >
          <Image
            src={config.icon}
            alt={config.label}
            width={sizeConfig.icon}
            height={sizeConfig.icon}
            className="object-contain"
            onError={(e) => {
              // Fallback to credit card icon on error
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : (
        <CreditCard
          className={`${config.color}`}
          style={{ width: sizeConfig.icon, height: sizeConfig.icon }}
        />
      )}
      {showLabel && (
        <span className={`${sizeConfig.text} ${config.color} font-medium`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

// Simple badge version for compact display
function GatewayBadge({
  gateway,
}: {
  gateway: string | null | undefined;
}) {
  const normalizedGateway = gateway?.toUpperCase() || "";
  const config = gatewayConfig[normalizedGateway];

  if (!config) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        {gateway || "N/A"}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-opacity-10 ${config.color} bg-current`}
    >
      {config.label}
    </span>
  );
}

