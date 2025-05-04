/**
 * Utilities for handling auction types, statuses, and related functionality
 */

export type AuctionType = "live" | "live_instant" | "silent_instant";
export type AuctionStatus =
    | "pending"
    | "scheduled"
    | "active"
    | "ended"
    | "cancelled";

/**
 * Gets the appropriate badge and display text for an auction type
 */
export function getAuctionTypeBadge(
    auctionType: AuctionType | string | undefined
) {
    switch (auctionType) {
        case "live":
            return { variant: "default" as const, label: "مزاد مباشر" };
        case "live_instant":
            return { variant: "outline" as const, label: "مزاد فوري مباشر" };
        case "silent_instant":
            return { variant: "secondary" as const, label: "مزاد فوري صامت" };
        default:
            return { variant: "outline" as const, label: "غير معروف" };
    }
}

/**
 * Get badge variant and label for an auction status
 */
export function getAuctionStatusBadge(status: string) {
    switch (status.toLowerCase()) {
        case "active":
            return { variant: "success" as const, label: "نشط" };
        case "scheduled":
            return { variant: "secondary" as const, label: "مجدول" };
        case "completed":
            return { variant: "default" as const, label: "مكتمل" };
        case "cancelled":
            return { variant: "destructive" as const, label: "ملغى" };
        case "pending":
            return { variant: "warning" as const, label: "قيد الانتظار" };
        case "rejected":
            return { variant: "destructive" as const, label: "مرفوض" };
        default:
            return { variant: "outline" as const, label: status };
    }
}

/**
 * Checks if an auction is active based on its status and times
 */
export function isAuctionActive(
    status: AuctionStatus | string,
    startTime: string | Date,
    endTime: string | Date
): boolean {
    if (status !== "active") {
        return false;
    }

    const now = new Date();
    const start =
        typeof startTime === "string" ? new Date(startTime) : startTime;
    const end = typeof endTime === "string" ? new Date(endTime) : endTime;

    return now >= start && now <= end;
}

/**
 * Check if a user can bid on an auction
 */
export function canUserBid(
    status: string,
    auctionType: string,
    startTime: string | Date,
    endTime: string | Date,
    isUserVerified: boolean
) {
    // Check auction status
    if (status !== "active") {
        return {
            canBid: false,
            reason:
                status === "scheduled" ? "لم يبدأ المزاد بعد" : "انتهى المزاد",
        };
    }

    // Check auction dates
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) {
        return { canBid: false, reason: "لم يبدأ المزاد بعد" };
    }

    if (now > end) {
        return { canBid: false, reason: "انتهى المزاد" };
    }

    // Check user verification for premium auctions
    if (auctionType === "premium" && !isUserVerified) {
        return {
            canBid: false,
            reason: "هذا المزاد متاح فقط للمستخدمين الموثقين، يرجى إكمال عملية التوثيق أولاً",
        };
    }

    // User can bid
    return { canBid: true, reason: "" };
}

/**
 * Calculate time remaining for an auction
 * and format it in a human-readable way
 */
export function getAuctionTimeRemaining(endTime: string | Date) {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) {
        return { timeRemaining: 0, formatted: "انتهى" };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let formatted = "";

    if (days > 0) {
        formatted += `${days} يوم `;
    }

    if (hours > 0 || days > 0) {
        formatted += `${hours} ساعة `;
    }

    if (minutes > 0 || hours > 0 || days > 0) {
        formatted += `${minutes} دقيقة `;
    }

    formatted += `${seconds} ثانية`;

    return {
        timeRemaining: diff,
        formatted,
        days,
        hours,
        minutes,
        seconds,
    };
}

/**
 * Get auto-bid increment for an auction based on current price
 */
export function getAutoBidIncrement(currentBid: number): number {
    if (currentBid < 1000) {
        return 50; // 50 SAR increment for bids under 1,000
    } else if (currentBid < 5000) {
        return 100; // 100 SAR increment for bids under 5,000
    } else if (currentBid < 10000) {
        return 250; // 250 SAR increment for bids under 10,000
    } else if (currentBid < 50000) {
        return 500; // 500 SAR increment for bids under 50,000
    } else if (currentBid < 100000) {
        return 1000; // 1,000 SAR increment for bids under 100,000
    } else {
        return 2000; // 2,000 SAR increment for bids over 100,000
    }
}

/**
 * Check if an auction is ending soon (within specified minutes)
 */
export function isAuctionEndingSoon(
    endTime: string | Date,
    minutesThreshold = 5
): boolean {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    return diff > 0 && diff <= minutesThreshold * 60 * 1000;
}
