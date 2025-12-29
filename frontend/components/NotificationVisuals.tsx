"use client";

import {
  Bell,
  Banknote,
  Trophy,
  Gavel,
  TrendingUp,
  BadgeCheck,
  Radio,
  ArrowRightCircle,
  Car,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

/**
 * Icon mapping: iconName (kebab-case from backend) -> Lucide component
 */
const iconMap: Record<string, LucideIcon> = {
  bell: Bell,
  banknote: Banknote,
  trophy: Trophy,
  gavel: Gavel,
  "trending-up": TrendingUp,
  "badge-check": BadgeCheck,
  radio: Radio,
  "arrow-right-circle": ArrowRightCircle,
  car: Car,
  "alert-triangle": AlertTriangle,
};

/**
 * Get the Lucide icon component by name
 * Falls back to Bell if icon name is unknown
 */
export function getNotificationIcon(iconName?: string): LucideIcon {
  if (!iconName) return Bell;
  return iconMap[iconName] || Bell;
}

/**
 * Color variants with full Tailwind class strings
 * This approach prevents Tailwind from purging dynamic classes
 */
export const colorVariants: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  violet: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-800",
  },
  slate: {
    bg: "bg-slate-100 dark:bg-slate-900/30",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-800",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
  gray: {
    bg: "bg-gray-100 dark:bg-gray-800/50",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700",
  },
};

/**
 * Get color classes for a notification
 * Falls back to gray if color is unknown
 */
export function getNotificationColor(colorName?: string) {
  if (!colorName) return colorVariants.gray;
  return colorVariants[colorName] || colorVariants.gray;
}

interface NotificationIconProps {
  iconName?: string;
  colorName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Renders a notification icon with semantic coloring
 */
export function NotificationIcon({
  iconName,
  colorName,
  size = "md",
  className = "",
}: NotificationIconProps) {
  const Icon = getNotificationIcon(iconName);
  const colors = getNotificationColor(colorName);

  const sizeClasses = {
    sm: "w-6 h-6 p-1",
    md: "w-8 h-8 p-1.5",
    lg: "w-10 h-10 p-2",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div
      className={`rounded-full flex items-center justify-center ${colors.bg} ${sizeClasses[size]} ${className}`}
    >
      <Icon className={`${iconSizes[size]} ${colors.text}`} />
    </div>
  );
}
