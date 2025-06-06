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
): string {
    if (amount === null || amount === undefined || amount === "") {
        return "٠ ر.س";
    }

    const {
        currency = "SAR",
        locale = "ar-SA",
        showSymbol = true,
        minimumFractionDigits = 0,
        maximumFractionDigits = 0,
    } = options;

    // Convert amount to a number if it's a string
    const numericAmount =
        typeof amount === "string" ? parseFloat(amount) : amount;

    // Check if the value is a valid number
    if (isNaN(numericAmount)) {
        return "٠ ر.س";
    }

    try {
        const formatter = new Intl.NumberFormat(locale, {
            style: showSymbol ? "currency" : "decimal",
            currency: showSymbol ? currency : undefined,
            minimumFractionDigits,
            maximumFractionDigits,
        });

        return formatter.format(numericAmount);
    } catch (error) {
        console.error("Error formatting currency:", error);
        // Fallback formatting
        return `${numericAmount.toLocaleString(locale)} ${
            showSymbol ? "ر.س" : ""
        }`;
    }
}

/**
 * Format a bid amount with appropriate highlighting for bid differences
 */
export function formatBidAmount(
    amount: number | string | null | undefined,
    previousAmount?: number | null
): {
    formatted: string;
    difference: string | null;
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
            const percentIncrease = ((difference / prevAmount) * 100).toFixed(
                1
            );

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
