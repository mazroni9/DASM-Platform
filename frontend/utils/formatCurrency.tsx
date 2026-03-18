import { SaudiRiyal } from "lucide-react";
import React from "react";
/**
 * Currency formatting utilities
 */

/**
 * Format a number as currency (SAR by default)
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options: {
    currency?: string;
    locale?: string;
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): React.ReactNode {
  const {
    currency = "SAR",
    locale = "ar-SA",
    showSymbol = true,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options;

  if (amount === null || amount === undefined || amount === "") {
    if (!showSymbol) {
      return "٠";
    }
    return (
      <span className="inline-flex items-center gap-1">
        ٠ <SaudiRiyal className="h-4 w-4" />
      </span>
    );
  }

  // Convert amount to a number if it's a string
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;

  // Check if the value is a valid number
  if (isNaN(numericAmount)) {
    if (!showSymbol) {
      return "٠";
    }
    return (
      <span className="inline-flex items-center gap-1">
        ٠ <SaudiRiyal className="h-4 w-4" />
      </span>
    );
  }

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: showSymbol ? "currency" : "decimal",
      currency: showSymbol ? currency : undefined,
      minimumFractionDigits,
      maximumFractionDigits,
    });

    if (!showSymbol) {
      // If not showing symbol, no need for the icon.
      return formatter.format(numericAmount);
    }

    // Use formatToParts to isolate currency symbol and replace it with the icon
    const parts = formatter.formatToParts(numericAmount);

    return (
      <span style={{ fontSize:"17px" }} className="inline-flex items-center gap-1 fs-4">
        {parts.map((part, index) => {
          if (part.type === "currency") {
            return <SaudiRiyal key={index} className="h-4 w-4" />;
          }
          return part.value;
        })}
      </span>
    );
  } catch (error) {
    console.error("Error formatting currency:", error);
    // Fallback formatting that respects showSymbol
    if (showSymbol) {
      return (
        <span style={{ fontSize:"17px" }} className="inline-flex items-center gap-1  fs-4">
          {numericAmount.toLocaleString(locale)}{" "}
          <SaudiRiyal className="h-4 w-4" />
        </span>
      );
    }
    return numericAmount.toLocaleString(locale);
  }
}

/**
 * Format a bid amount with appropriate highlighting for bid differences
 */
export function formatBidAmount(
  amount: number | string | null | undefined,
  previousAmount?: number | null
): {
  formatted: React.ReactNode;
  difference: React.ReactNode | null;
  percentIncrease: string | null;
} {
  const formatted = formatCurrency(amount);

  if (previousAmount && amount) {
    const currentAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;
    const prevAmount =
      typeof previousAmount === "string"
        ? parseFloat(previousAmount)
        : previousAmount;

    if (!isNaN(currentAmount) && !isNaN(prevAmount) && prevAmount > 0) {
      const difference = currentAmount - prevAmount;
      const percentIncrease = ((difference / prevAmount) * 100).toFixed(1);

      return {
        formatted,
        difference: formatCurrency(difference),
        percentIncrease: `${percentIncrease}%`,
      };
    }
  }

  return {
    formatted,
    difference: null,
    percentIncrease: null,
  };
}

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export function formatCompactNumber(
  num: number | string | null | undefined
): string {
  if (num === null || num === undefined || num === "") {
    return "0";
  }

  const value = typeof num === "string" ? parseFloat(num) : num;

  if (isNaN(value)) {
    return "0";
  }

  try {
    return new Intl.NumberFormat("ar", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value);
  } catch (error) {
    console.error("Error formatting compact number:", error);
    return value.toString();
  }
}
