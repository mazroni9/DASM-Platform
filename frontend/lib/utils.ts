import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * دمج فئات Tailwind بشكل صحيح
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDateTime(date: Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * التحقق من صحة عنوان البريد الإلكتروني
 * @param email البريد الإلكتروني للتحقق
 * @returns إذا كان البريد صالحاً
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function formatCurrency (
    value: number | string | null | undefined,
    currency: string = "ريال"
): string {
    if (value === null || value === undefined || value === "") {
        return `0 ${currency}`;
    }

    // Convert to number if it's a string
    const numValue =
        typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;

    // Check if it's a valid number
    if (isNaN(numValue)) {
        return `0 ${currency}`;
    }

    // Format with thousand separators in Arabic locale
    try {
        const formatted = new Intl.NumberFormat("ar-SA").format(numValue);
        return `${formatted} ${currency}`;
    } catch (error) {
        console.error("Error formatting money value:", error);
        return `${numValue.toLocaleString()} ${currency}`;
    }
}

/**
 * Format a date to a localized string
 * @param date The date to format
 * @param locale The locale to use (default: ar-SA)
 * @returns Formatted date string
 */
export function formatDate(
    date: Date | string | number,
    locale: string = "ar-SA"
): string {
    if (!date) return "";

    try {
        const dateObj =
            typeof date === "string" || typeof date === "number"
                ? new Date(date)
                : date;

        return dateObj.toLocaleDateString(locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch (error) {
        console.error("Error formatting date:", error);
        return String(date);
    }
}

/**
 * Format a time to a localized string
 * @param date The date to format
 * @param locale The locale to use (default: ar-SA)
 * @returns Formatted time string
 */
export function formatTime(
    date: Date | string | number,
    locale: string = "ar-SA"
): string {
    if (!date) return "";

    try {
        const dateObj =
            typeof date === "string" || typeof date === "number"
                ? new Date(date)
                : date;

        return dateObj.toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch (error) {
        console.error("Error formatting time:", error);
        return String(date);
    }
}

/**
 * Format a number as a percentage
 * @param value The number to format as percentage
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(
    value: number | string | null | undefined,
    decimals: number = 1
): string {
    if (value === null || value === undefined || value === "") {
        return "0%";
    }

    const numValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(numValue)) {
        return "0%";
    }

    return `${numValue.toFixed(decimals)}%`;
}

/**
 * Format a number with abbreviations (K, M, B)
 * @param value The number to format
 * @returns Abbreviated number as string
 */
export function formatCompactNumber(
    value: number | string | null | undefined
): string {
    if (value === null || value === undefined || value === "") {
        return "0";
    }

    const numValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(numValue)) {
        return "0";
    }

    try {
        return new Intl.NumberFormat("ar", {
            notation: "compact",
            compactDisplay: "short",
        }).format(numValue);
    } catch (error) {
        console.error("Error formatting compact number:", error);
        return numValue.toString();
    }
}
