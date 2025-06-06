/**
 * --------------------------------------
 * 📝 الملف: مكون قائمة السيارات المباعة في المزاد
 * 📁 المسار: frontend/components/archive/AuctionCarList.tsx
 * 🚀 الإصدار: 1.0
 * 🗓️ تاريخ الإنشاء: 2025/05/11
 * --------------------------------------
 *
 * ✅ الوظيفة الرئيسية:
 * - عرض قائمة السيارات المباعة في المزاد بطريقة منظمة
 * - إظهار تفاصيل السيارة، سعر البداية، وسعر البيع النهائي
 * - إمكانية الانتقال إلى لحظة بيع السيارة في الفيديو مباشرةً
 *
 * 🔄 الترابطات:
 * - يتم استخدامه في صفحة تفاصيل المزاد (frontend/app/auction-archive/[id]/page.tsx)
 * - يتكامل مع مشغل الفيديو RecordedAuctionPlayer من خلال وظيفة onJumpToTimestamp
 * - يعرض بيانات AuctionSoldCar المرتبطة بقاعدة البيانات
 *
 * 🧩 المكونات المستخدمة:
 * - lucide-react: للأيقونات
 * - next/image: لعرض صور السيارات
 * - React Hooks: لإدارة حالة التصفية والترتيب
 * - formatMoney: لتنسيق المبالغ المالية
 */

"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
    ArrowUpRight,
    Clock,
    TrendingUp,
    Play,
    ChevronDown,
    ChevronUp,
    Filter,
} from "lucide-react";
import { formatMoney } from "@/lib/utils";

// واجهة بيانات السيارة المباعة
interface AuctionSoldCar {
    id: number;
    make: string;
    model: string;
    year: number;
    imageUrl: string;
    startPrice: number;
    finalPrice: number;
    bidCount: number;
    timestamp: number; // الوقت بالثواني في الفيديو
    duration: number; // مدة المزايدة بالثواني
    bidders: number;
    color?: string;
    fuelType?: string;
    transmission?: string;
}

interface AuctionCarListProps {
    cars: AuctionSoldCar[];
    onJumpToTimestamp?: (timestamp: number) => void;
    compact?: boolean;
}

export default function AuctionCarList({
    cars,
    onJumpToTimestamp,
    compact = false,
}: AuctionCarListProps) {
    const [sortField, setSortField] = useState<string>("timestamp");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [showFilters, setShowFilters] = useState(false);
    const [expandedCarId, setExpandedCarId] = useState<number | null>(null);

    // ترتيب السيارات
    const sortCars = (a: AuctionSoldCar, b: AuctionSoldCar): number => {
        let valueA: any = a[sortField as keyof AuctionSoldCar];
        let valueB: any = b[sortField as keyof AuctionSoldCar];

        // إذا كان الحقل نصياً
        if (typeof valueA === "string") {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }

        if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
        return 0;
    };

    // تبديل اتجاه الترتيب
    const handleSort = (field: string) => {
        if (field === sortField) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    // تنسيق الوقت (MM:SS)
    const formatTimeDisplay = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    // توجيه إلى نقطة معينة في الفيديو
    const handleJumpToTimestamp = (timestamp: number) => {
        if (onJumpToTimestamp) {
            onJumpToTimestamp(timestamp);
        }
    };

    // عرض/إخفاء تفاصيل السيارة
    const toggleCarDetails = (carId: number) => {
        setExpandedCarId(expandedCarId === carId ? null : carId);
    };

    // حساب نسبة الزيادة في السعر
    const calculatePriceIncrease = (
        startPrice: number,
        finalPrice: number
    ): number => {
        return Math.round(((finalPrice - startPrice) / startPrice) * 100);
    };

    // فلترة وترتيب السيارات
    const sortedCars = [...cars].sort(sortCars);

    // عرض مختصر للسيارات
    if (compact) {
        return (
            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-3 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                        السيارات المباعة
                    </h3>
                    <span className="text-sm text-gray-500">
                        {cars.length} سيارة
                    </span>
                </div>

                <div className="divide-y divide-gray-100">
                    {sortedCars.map((car) => (
                        <div
                            key={car.id}
                            className="p-3 hover:bg-gray-50 flex justify-between items-center"
                        >
                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                <div className="relative w-10 h-10 overflow-hidden rounded">
                                    <Image
                                        src={car.imageUrl}
                                        alt={`${car.make} ${car.model}`}
                                        fill
                                        className="object-cover"
                                        sizes="40px"
                                    />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-800">
                                        {car.make} {car.model}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {car.year}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="font-semibold text-teal-600">
                                    {formatMoney(car.finalPrice)} ريال
                                </div>
                                <div className="text-xs text-gray-500">
                                    {car.bidCount} مزايدة
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // العرض الكامل للسيارات
    return (
        <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b flex flex-wrap items-center justify-between gap-y-2">
                <h3 className="text-lg font-semibold text-gray-800">
                    السيارات المباعة في المزاد
                </h3>

                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        title="فلترة وترتيب السيارات"
                    >
                        <Filter className="h-4 w-4 ml-1" />
                        <span>فلترة وترتيب</span>
                        {showFilters ? (
                            <ChevronUp className="h-4 w-4 mr-1" />
                        ) : (
                            <ChevronDown className="h-4 w-4 mr-1" />
                        )}
                    </button>
                </div>
            </div>

            {/* خيارات الفلترة والترتيب */}
            {showFilters && (
                <div className="p-3 bg-gray-50 border-b">
                    <div className="text-sm">ترتيب حسب:</div>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button
                            onClick={() => handleSort("timestamp")}
                            className={`px-3 py-1.5 rounded text-sm flex items-center justify-center ${
                                sortField === "timestamp"
                                    ? "bg-teal-100 text-teal-700 border border-teal-200"
                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            التسلسل الزمني
                            {sortField === "timestamp" &&
                                (sortDirection === "asc" ? (
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                ) : (
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                ))}
                        </button>

                        <button
                            onClick={() => handleSort("finalPrice")}
                            className={`px-3 py-1.5 rounded text-sm flex items-center justify-center ${
                                sortField === "finalPrice"
                                    ? "bg-teal-100 text-teal-700 border border-teal-200"
                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            سعر البيع
                            {sortField === "finalPrice" &&
                                (sortDirection === "asc" ? (
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                ) : (
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                ))}
                        </button>

                        <button
                            onClick={() => handleSort("bidCount")}
                            className={`px-3 py-1.5 rounded text-sm flex items-center justify-center ${
                                sortField === "bidCount"
                                    ? "bg-teal-100 text-teal-700 border border-teal-200"
                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            عدد المزايدات
                            {sortField === "bidCount" &&
                                (sortDirection === "asc" ? (
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                ) : (
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                ))}
                        </button>

                        <button
                            onClick={() => handleSort("year")}
                            className={`px-3 py-1.5 rounded text-sm flex items-center justify-center ${
                                sortField === "year"
                                    ? "bg-teal-100 text-teal-700 border border-teal-200"
                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            سنة الصنع
                            {sortField === "year" &&
                                (sortDirection === "asc" ? (
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                ) : (
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                ))}
                        </button>
                    </div>
                </div>
            )}

            {/* قائمة السيارات */}
            <div className="divide-y divide-gray-100">
                {sortedCars.length > 0 ? (
                    sortedCars.map((car) => (
                        <div
                            key={car.id}
                            className="hover:bg-gray-50 transition-colors"
                        >
                            {/* معلومات السيارة الأساسية */}
                            <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                                {/* صورة السيارة */}
                                <div className="relative w-full h-40 md:w-48 md:h-32 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                        src={car.imageUrl}
                                        alt={`${car.make} ${car.model}`}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 192px"
                                    />
                                </div>

                                {/* معلومات السيارة */}
                                <div className="flex-1">
                                    <div className="flex flex-wrap justify-between items-start mb-2">
                                        <h4 className="text-lg font-semibold text-gray-800">
                                            {car.make} {car.model} {car.year}
                                        </h4>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    toggleCarDetails(car.id)
                                                }
                                                className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                                                title={
                                                    expandedCarId === car.id
                                                        ? "إخفاء التفاصيل"
                                                        : "عرض التفاصيل"
                                                }
                                            >
                                                {expandedCarId === car.id
                                                    ? "إخفاء التفاصيل"
                                                    : "عرض التفاصيل"}
                                            </button>

                                            {onJumpToTimestamp && (
                                                <button
                                                    onClick={() =>
                                                        handleJumpToTimestamp(
                                                            car.timestamp
                                                        )
                                                    }
                                                    className="flex items-center px-2 py-1 text-xs bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition-colors"
                                                    title="الانتقال إلى وقت البيع في الفيديو"
                                                >
                                                    <Play className="h-3 w-3 ml-1" />
                                                    <span>مشاهدة البيع</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* الأسعار والمزايدات */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                                        <div>
                                            <div className="text-xs text-gray-500">
                                                سعر البداية
                                            </div>
                                            <div className="text-sm font-medium">
                                                {formatMoney(car.startPrice)}{" "}
                                                ريال
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs text-gray-500">
                                                سعر البيع
                                            </div>
                                            <div className="text-sm font-semibold text-teal-600">
                                                {formatMoney(car.finalPrice)}{" "}
                                                ريال
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs text-gray-500">
                                                الزيادة
                                            </div>
                                            <div className="text-sm font-medium flex items-center text-green-600">
                                                <TrendingUp className="h-3 w-3 ml-1" />
                                                {calculatePriceIncrease(
                                                    car.startPrice,
                                                    car.finalPrice
                                                )}
                                                %
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs text-gray-500">
                                                المزايدات
                                            </div>
                                            <div className="text-sm font-medium">
                                                {car.bidCount} مزايدة
                                            </div>
                                        </div>
                                    </div>

                                    {/* وقت البيع والمدة */}
                                    <div className="flex items-center text-xs text-gray-500">
                                        <Clock className="h-3 w-3 ml-1" />
                                        <span>
                                            وقت البيع:{" "}
                                            {formatTimeDisplay(car.timestamp)} |
                                            مدة المزايدة:{" "}
                                            {formatTimeDisplay(car.duration)} |
                                            عدد المزايدين: {car.bidders}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* تفاصيل إضافية للسيارة - تظهر فقط عند النقر */}
                            {expandedCarId === car.id && (
                                <div className="p-4 bg-gray-50 border-t border-gray-100">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {car.color && (
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">
                                                    اللون
                                                </div>
                                                <div className="text-sm">
                                                    {car.color}
                                                </div>
                                            </div>
                                        )}

                                        {car.fuelType && (
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">
                                                    نوع الوقود
                                                </div>
                                                <div className="text-sm">
                                                    {car.fuelType}
                                                </div>
                                            </div>
                                        )}

                                        {car.transmission && (
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">
                                                    ناقل الحركة
                                                </div>
                                                <div className="text-sm">
                                                    {car.transmission}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">
                                                معدل المزايدة
                                            </div>
                                            <div className="text-sm">
                                                {(
                                                    car.bidCount /
                                                    (car.duration / 60)
                                                ).toFixed(1)}{" "}
                                                مزايدة/دقيقة
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">
                                                متوسط الزيادة للمزايدة
                                            </div>
                                            <div className="text-sm">
                                                {formatMoney(
                                                    (car.finalPrice -
                                                        car.startPrice) /
                                                        (car.bidCount || 1)
                                                )}{" "}
                                                ريال
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        لا توجد سيارات مباعة في هذا المزاد
                    </div>
                )}
            </div>
        </div>
    );
}
