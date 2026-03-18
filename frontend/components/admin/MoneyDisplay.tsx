"use client";

interface MoneyDisplayProps {
  amount: number;
  currency?: string;
  locale?: string;
  showSign?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "positive" | "negative" | "muted";
  label?: string;
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg font-semibold",
  xl: "text-2xl font-bold",
};

const variantClasses = {
  default: "text-foreground",
  positive: "text-green-500",
  negative: "text-red-500",
  muted: "text-muted-foreground",
};

export function MoneyDisplay({
  amount,
  currency = "SAR",
  locale = "ar-SA",
  showSign = false,
  size = "md",
  variant = "default",
  label,
}: MoneyDisplayProps) {
  const formattedAmount = new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const sign = showSign && amount !== 0 ? (amount > 0 ? "+" : "-") : "";
  const autoVariant =
    variant === "default" && showSign
      ? amount > 0
        ? "positive"
        : amount < 0
        ? "negative"
        : "default"
      : variant;

  return (
    <div className="flex flex-col">
      {label && (
        <span className="text-xs text-muted-foreground mb-0.5">{label}</span>
      )}
      <span className={`${sizeClasses[size]} ${variantClasses[autoVariant]}`}>
        {sign}
        {formattedAmount}{" "}
        <span className="text-muted-foreground text-sm">{currency}</span>
      </span>
    </div>
  );
}

// Simple inline version for table cells
export function MoneyInline({
  amount,
  currency = "ر.س",
}: {
  amount: number;
  currency?: string;
}) {
  const formatted = new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return (
    <span className="font-medium tabular-nums">
      {formatted}{" "}
      <span className="text-muted-foreground text-xs">{currency}</span>
    </span>
  );
}

export default MoneyDisplay;
