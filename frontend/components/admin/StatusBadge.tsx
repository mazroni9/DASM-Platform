"use client";

import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  XCircle,
  Lock,
  Unlock,
  AlertCircle,
} from "lucide-react";

interface StatusBadgeProps {
  status: string;
  type?: "payment" | "escrow" | "release" | "general";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

// Status configuration with colors and labels
const statusConfig: Record<
  string,
  Record<string, { color: string; label: string; icon: any }>
> = {
  payment: {
    PAID: {
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      label: "مدفوع",
      icon: CheckCircle,
    },
    PENDING: {
      color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      label: "في الانتظار",
      icon: Clock,
    },
    FAILED: {
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      label: "فشل",
      icon: XCircle,
    },
    REFUNDED: {
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      label: "مسترجع",
      icon: AlertCircle,
    },
  },
  escrow: {
    PENDING: {
      color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      label: "في الانتظار",
      icon: Clock,
    },
    VERIFIED: {
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      label: "تم التحقق",
      icon: CheckCircle,
    },
    PAID: {
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      label: "مدفوع",
      icon: CheckCircle,
    },
    HELD_IN_ESCROW: {
      color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      label: "محتجز في الضمان",
      icon: Lock,
    },
    FAILED: {
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      label: "فشل",
      icon: XCircle,
    },
  },
  release: {
    NOT_APPLICABLE: {
      color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      label: "غير متاح",
      icon: Clock,
    },
    PENDING: {
      color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      label: "في الانتظار",
      icon: Clock,
    },
    RELEASED: {
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      label: "تم الإفراج",
      icon: Unlock,
    },
    HELD: {
      color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      label: "محتجز",
      icon: Lock,
    },
  },
  general: {
    pending: {
      color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      label: "قيد الانتظار",
      icon: Clock,
    },
    active: {
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      label: "نشط",
      icon: CheckCircle,
    },
    completed: {
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      label: "مكتمل",
      icon: CheckCircle,
    },
    cancelled: {
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      label: "ملغى",
      icon: XCircle,
    },
    refund_pending: {
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      label: "استرداد قيد المعالجة",
      icon: AlertCircle,
    },
  },
};

export function StatusBadge({
  status,
  type = "general",
  size = "md",
  showIcon = true,
}: StatusBadgeProps) {
  const config = statusConfig[type]?.[status] ||
    statusConfig[type]?.[status.toUpperCase()] || {
      color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      label: status,
      icon: AlertCircle,
    };

  const Icon = config.icon;
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.color} ${sizeClasses[size]}`}
    >
      {showIcon && (
        <Icon
          className={
            size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"
          }
        />
      )}
      {config.label}
    </span>
  );
}

export default StatusBadge;
