import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns";
import { arSA } from "date-fns/locale";

/**
 * Formats a date with a consistent format
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return "غير محدد";

    try {
        const dateObj = typeof date === "string" ? new Date(date) : date;

        // Format: 15 أبريل 2023, 3:30 م
        return format(dateObj, "d MMMM yyyy, h:mm a", { locale: arSA });
    } catch (error) {
        console.error("Error formatting date:", error);
        return "تاريخ غير صالح";
    }
}

/**
 * Format a date relative to now (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeDate(
    date: string | Date | null | undefined
): string {
    if (!date) return "غير محدد";

    try {
        const dateObj = typeof date === "string" ? new Date(date) : date;

        return formatDistanceToNow(dateObj, {
            addSuffix: true,
            locale: arSA,
        });
    } catch (error) {
        console.error("Error formatting relative date:", error);
        return "تاريخ غير صالح";
    }
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: string | Date | null | undefined): boolean {
    if (!date) return false;

    try {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        return isBefore(dateObj, new Date());
    } catch (error) {
        console.error("Error checking if date is past:", error);
        return false;
    }
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: string | Date | null | undefined): boolean {
    if (!date) return false;

    try {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        return isAfter(dateObj, new Date());
    } catch (error) {
        console.error("Error checking if date is future:", error);
        return false;
    }
}

/**
 * Get auction status based on start and end time
 */
export function getAuctionTimeStatus(
    startTime: string | Date,
    endTime: string | Date
) {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) {
        return { variant: "secondary" as const, label: "مجدول" };
    } else if (now > end) {
        return { variant: "default" as const, label: "منتهي" };
    } else {
        return { variant: "success" as const, label: "نشط" };
    }
}

/**
 * Calculate remaining time components (days, hours, minutes, seconds) for a countdown
 */
export function getRemainingTimeComponents(endTime: string | Date) {
    const now = new Date();
    const end = typeof endTime === "string" ? new Date(endTime) : endTime;

    // If the end time is in the past, return all zeros
    if (end <= now) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const totalSeconds = Math.floor((end.getTime() - now.getTime()) / 1000);

    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return { days, hours, minutes, seconds };
}

/**
 * Format a date or time in short format
 */
export function formatShortDate(
    date: string | Date | null | undefined
): string {
    if (!date) return "غير محدد";

    try {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        return format(dateObj, "yyyy-MM-dd", { locale: arSA });
    } catch (error) {
        console.error("Error formatting short date:", error);
        return "تاريخ غير صالح";
    }
}

/**
 * Format just the time portion of a date
 */
export function formatTime(date: string | Date | null | undefined): string {
    if (!date) return "غير محدد";

    try {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        return format(dateObj, "h:mm a", { locale: arSA });
    } catch (error) {
        console.error("Error formatting time:", error);
        return "وقت غير صالح";
    }
}
