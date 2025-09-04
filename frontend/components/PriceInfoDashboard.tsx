/**
 * 🧩 مكون لوحة معلومات السعر المباشرة
 * 📁 المسار: frontend/components/PriceInfoDashboard.tsx
 *
 * ✅ الوظيفة:
 * - عرض الرسم البياني المصغر لحركة سعر السيارة
 * - عرض السعر بخط كبير متغير اللون (أخضر للارتفاع، أحمر للانخفاض)
 * - عرض نسبة التغير والفرق في السعر
 */

"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Minus, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface PricePoint {
    time: string;
    price: number;
}

interface PriceInfoDashboardProps {
    currentPrice: number;
    previousPrice?: number;
    historyPoints?: PricePoint[];
    auctionType?: "live_instant" | "silent_instant";
    className?: string;
}

export default function PriceInfoDashboard({
    currentPrice,
    previousPrice,
    historyPoints = [],
    auctionType = "live_instant",
    className = "",
}: PriceInfoDashboardProps) {
    // حساب نسبة التغير والفرق في السعر
    const [priceHistory, setPriceHistory] =
        useState<PricePoint[]>(historyPoints);
    const [priceDirection, setPriceDirection] = useState<
        "up" | "down" | "stable"
    >("stable");
    const [priceChange, setPriceChange] = useState({
        amount: 0,
        percentage: 0,
    });

    // إذا لم يتم توفير سعر سابق، استخدم نفس السعر الحالي
    const prevPrice =
        previousPrice !== undefined ? previousPrice : currentPrice;

    // تحديث اتجاه السعر وحساب التغير
    useEffect(() => {
        if (currentPrice > prevPrice) {
            setPriceDirection("up");
        } else if (currentPrice < prevPrice) {
            setPriceDirection("down");
        } else {
            setPriceDirection("stable");
        }

        const diff = currentPrice - prevPrice;
        const percentChange = prevPrice > 0 ? (diff / prevPrice) * 100 : 0;

        setPriceChange({
            amount: diff,
            percentage: parseFloat(percentChange.toFixed(2)),
        });

        // إضافة نقطة جديدة إلى التاريخ إذا كان السعر قد تغير
        if (currentPrice !== prevPrice) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString("ar", {
                hour: "2-digit",
                minute: "2-digit",
            });

            setPriceHistory((prev) => {
                // حفظ آخر 24 نقطة فقط
                const newHistory = [
                    ...prev,
                    { time: timeStr, price: currentPrice },
                ];
                if (newHistory.length > 24) {
                    return newHistory.slice(1);
                }
                return newHistory;
            });
        }
    }, [currentPrice, prevPrice]);

    // الحصول على أقصى وأدنى قيمة في التاريخ لرسم المخطط
    const maxPrice = Math.max(
        ...priceHistory.map((p) => p.price),
        currentPrice
    );
    const minPrice = Math.min(
        ...priceHistory.map((p) => p.price),
        currentPrice
    );
    const priceRange = maxPrice - minPrice > 0 ? maxPrice - minPrice : 1;

    // تحديد لون اتجاه السعر
    const getPriceDirectionColor = () => {
        switch (priceDirection) {
            case "up":
                return "text-green-600";
            case "down":
                return "text-red-600";
            default:
                return "text-gray-600";
        }
    };

    // الحصول على أيقونة اتجاه السعر
    const getPriceDirectionIcon = () => {
        switch (priceDirection) {
            case "up":
                return <ArrowUp className="h-6 w-6 text-green-600" />;
            case "down":
                return <ArrowDown className="h-6 w-6 text-red-600" />;
            default:
                return <Minus className="h-6 w-6 text-gray-600" />;
        }
    };

    return (
        <div
            className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}
        >
            <div
                className={`p-3 ${
                    auctionType === "live_instant"
                        ? "bg-blue-600"
                        : "bg-purple-600"
                } text-white`}
            >
                <h3 className="font-bold flex items-center">
                    <DollarSign className="h-5 w-5 ml-1" />
                    <span>لوحة أسعار المزاد</span>
                </h3>
            </div>

            <div className="p-4">
                {/* عرض السعر الحالي */}
                <div className="mb-4 text-center">
                    <div className="text-xs text-gray-500 mb-1">
                        السعر الحالي
                    </div>
                    <div
                        className={`text-4xl font-bold ${getPriceDirectionColor()} transition-colors duration-500`}
                    >
                        {formatCurrency (currentPrice)} 
                    </div>

                    {/* تغير السعر */}
                    <div className="flex justify-center items-center mt-2">
                        {getPriceDirectionIcon()}
                        <span className={`mx-1 ${getPriceDirectionColor()}`}>
                            {priceChange.amount > 0 ? "+" : ""}
                            {formatCurrency (priceChange.amount)} 
                        </span>
                        <span className={`text-sm ${getPriceDirectionColor()}`}>
                            ({priceChange.percentage > 0 ? "+" : ""}
                            {priceChange.percentage}%)
                        </span>
                    </div>
                </div>

                {/* رسم بياني مصغر */}
                <div className="h-20 flex items-end justify-between">
                    {priceHistory.length > 0 ? (
                        <>
                            {priceHistory.map((point, index) => {
                                const height =
                                    ((point.price - minPrice) / priceRange) *
                                    100;
                                // تحديد اللون بناءً على التغير عن النقطة السابقة
                                let barColor = "bg-gray-300";
                                if (index > 0) {
                                    if (
                                        point.price >
                                        priceHistory[index - 1].price
                                    ) {
                                        barColor = "bg-green-500";
                                    } else if (
                                        point.price <
                                        priceHistory[index - 1].price
                                    ) {
                                        barColor = "bg-red-500";
                                    }
                                }

                                return (
                                    <div
                                        key={index}
                                        className="flex flex-col items-center mx-[1px]"
                                    >
                                        <div
                                            className={`w-1.5 ${barColor} rounded-t transition-all duration-500`}
                                            style={{ height: `${height}%` }}
                                            title={`${
                                                point.time
                                            }: ${formatCurrency (point.price)} `}
                                        ></div>
                                        {/* نعرض الوقت لبعض النقاط فقط لتجنب التزاحم */}
                                        {index % 6 === 0 && (
                                            <div className="text-[7px] text-gray-500 mt-1 truncate w-8 text-center">
                                                {point.time}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    ) : (
                        <div className="w-full text-center text-gray-400 text-xs">
                            لا يوجد بيانات تاريخية كافية بعد
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
