/**
 * --------------------------------------
 * 📝 الملف: مكون سجل تاريخي للمزاد
 * 📁 المسار: frontend/components/archive/AuctionHistoryRecord.tsx
 * 🚀 الإصدار: 1.0
 * 🗓️ تاريخ الإنشاء: 2025/05/11
 * --------------------------------------
 *
 * ✅ الوظيفة الرئيسية:
 * - عرض سجل تاريخي لمزاد سابق مع بياناته
 * - توفير وصلة للوصول إلى تفاصيل المزاد وفيديو التسجيل
 * - عرض إحصائيات المزاد ومبيعات السيارات
 *
 * 🔄 الترابطات:
 * - يتم استخدامه في صفحة أرشيف المزادات (frontend/app/auction-archive/page.tsx)
 * - يرتبط مع مكونات عرض الفيديو والبيانات (RecordedAuctionPlayer.tsx)
 * - يعرض بيانات من صيغة AuctionHistoryData المرتبطة بقاعدة البيانات
 *
 * 🧩 المكونات المستخدمة:
 * - lucide-react: للأيقونات
 * - next/image: لعرض صور المزادات
 * - formatCurrency , formatDate: لتنسيق البيانات
 */

"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Calendar,
    Clock,
    Users,
    Play,
    Bookmark,
    ChevronLeft,
    TrendingUp,
    Car,
    Tag,
} from "lucide-react";
import { formatCurrency , formatDate, formatTime } from "@/lib/utils";

// واجهة بيانات السيارة المباعة في المزاد
interface AuctionCar {
    id: number;
    title: string;
    make: string;
    model: string;
    year: number;
    finalPrice: number;
    startingPrice: number;
    imageUrl: string;
    bids: number;
}

// واجهة بيانات المزاد
export interface AuctionHistoryData {
    id: number;
    title: string;
    date: string;
    venue: string;
    location: string;
    thumbnailUrl: string;
    recordingUrl: string;
    duration: number; // بالدقائق
    totalCars: number;
    soldCars: number;
    totalBids: number;
    totalParticipants: number;
    totalSales: number;
    cars: AuctionCar[];
    hasHighlights: boolean;
}

interface AuctionHistoryRecordProps {
    auction: AuctionHistoryData;
    view?: "card" | "list";
    showDetails?: boolean;
}

export default function AuctionHistoryRecord({
    auction,
    view = "card",
    showDetails = false,
}: AuctionHistoryRecordProps) {
    // حساب معدل بيع السيارات
    const sellRate =
        auction.soldCars > 0
            ? Math.round((auction.soldCars / auction.totalCars) * 100)
            : 0;

    // حساب متوسط سعر البيع
    const averageSalePrice =
        auction.soldCars > 0 ? auction.totalSales / auction.soldCars : 0;

    // تنسيق مدة المزاد
    const formatDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours} ساعة${hours > 1 ? " و" : ""}${
                mins > 0 ? ` ${mins} دقيقة` : ""
            }`;
        }

        return `${mins} دقيقة`;
    };

    // عرض بطاقة المزاد
    if (view === "card") {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="relative">
                    {/* صورة مصغرة للمزاد */}
                    <div className="relative w-full h-48 overflow-hidden">
                        <Image
                            src={auction.thumbnailUrl}
                            alt={auction.title}
                            className="object-cover hover:scale-105 transition-transform duration-300"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />

                        {/* زر تشغيل الفيديو */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all duration-300">
                            <div className="w-14 h-14 bg-teal-600 rounded-full flex items-center justify-center hover:bg-teal-700 cursor-pointer">
                                <Play className="h-6 w-6 text-white ml-1" />
                            </div>
                        </div>

                        {/* شريط المعلومات السريعة */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent py-2 px-3">
                            <div className="flex justify-between text-white text-sm">
                                <span className="flex items-center">
                                    <Calendar className="h-3.5 w-3.5 ml-1" />
                                    {formatDate(new Date(auction.date))}
                                </span>
                                <span className="flex items-center">
                                    <Clock className="h-3.5 w-3.5 ml-1" />
                                    {formatDuration(auction.duration)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* محتوى البطاقة */}
                <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-teal-600 transition-colors">
                        <Link
                            href={`/auction-archive/${auction.id}`}
                            className="hover:underline"
                        >
                            {auction.title}
                        </Link>
                    </h3>

                    <div className="text-sm text-gray-600 mb-3">
                        <p>
                            {auction.venue} - {auction.location}
                        </p>
                    </div>

                    {/* إحصائيات أساسية */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 p-2 rounded">
                            <div className="text-xs text-gray-500 mb-1">
                                إجمالي المبيعات
                            </div>
                            <div className="text-lg font-semibold text-teal-600">
                                {formatCurrency (auction.totalSales)} ريال
                            </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                            <div className="text-xs text-gray-500 mb-1">
                                معدل البيع
                            </div>
                            <div className="text-lg font-semibold text-teal-600">
                                {sellRate}%
                            </div>
                        </div>
                    </div>

                    {/* الإحصائيات التفصيلية - تظهر فقط عند طلبها */}
                    {showDetails && (
                        <div className="border-t border-gray-100 pt-3 mt-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center">
                                    <Car className="h-4 w-4 text-gray-400 ml-1" />
                                    <span className="text-gray-600">
                                        {auction.soldCars} / {auction.totalCars}{" "}
                                        سيارة
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <Users className="h-4 w-4 text-gray-400 ml-1" />
                                    <span className="text-gray-600">
                                        {auction.totalParticipants} مشارك
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <TrendingUp className="h-4 w-4 text-gray-400 ml-1" />
                                    <span className="text-gray-600">
                                        {auction.totalBids} مزايدة
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <Tag className="h-4 w-4 text-gray-400 ml-1" />
                                    <span className="text-gray-600">
                                        متوسط {formatCurrency (averageSalePrice)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* زر الإجراء */}
                    <div className="mt-4 flex justify-between">
                        <Link
                            href={`/auction-archive/${auction.id}`}
                            className="flex items-center text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors"
                        >
                            عرض التفاصيل
                            <ChevronLeft className="h-4 w-4 mr-1" />
                        </Link>

                        <button
                            title="حفظ في المفضلة"
                            className="p-1.5 text-gray-400 hover:text-teal-600 rounded-full hover:bg-teal-50 transition-colors"
                        >
                            <Bookmark className="h-4 w-4" />
                            <span className="sr-only">حفظ في المفضلة</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // عرض صف في قائمة
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 p-4">
            <div className="flex flex-col md:flex-row md:items-center">
                {/* صورة مصغرة للمزاد */}
                <div className="relative w-full h-32 md:w-48 md:h-28 md:ml-4 overflow-hidden rounded-lg mb-4 md:mb-0 flex-shrink-0">
                    <Image
                        src={auction.thumbnailUrl}
                        alt={auction.title}
                        className="object-cover"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 20vw, 10vw"
                    />

                    {/* زر تشغيل الفيديو */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all duration-300">
                        <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center hover:bg-teal-700 cursor-pointer">
                            <Play className="h-5 w-5 text-white ml-0.5" />
                        </div>
                    </div>
                </div>

                {/* المعلومات الأساسية */}
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1 hover:text-teal-600 transition-colors">
                        <Link
                            href={`/auction-archive/${auction.id}`}
                            className="hover:underline"
                        >
                            {auction.title}
                        </Link>
                    </h3>

                    <div className="flex flex-wrap items-center text-sm text-gray-600 mb-3 gap-x-4">
                        <span className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 ml-1" />
                            {formatDate(new Date(auction.date))}
                        </span>
                        <span className="flex items-center">
                            <Clock className="h-3.5 w-3.5 ml-1" />
                            {formatDuration(auction.duration)}
                        </span>
                        <span>
                            {auction.venue} - {auction.location}
                        </span>
                    </div>

                    {/* الإحصائيات المختصرة */}
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center">
                            <Tag className="h-4 w-4 text-teal-500 ml-1" />
                            <span className="text-teal-600 font-semibold">
                                {formatCurrency (auction.totalSales)} ريال
                            </span>
                        </div>
                        <div className="flex items-center">
                            <Car className="h-4 w-4 text-blue-500 ml-1" />
                            <span>
                                {auction.soldCars} / {auction.totalCars} سيارة
                            </span>
                        </div>
                        <div className="flex items-center">
                            <Users className="h-4 w-4 text-purple-500 ml-1" />
                            <span>{auction.totalParticipants} مشارك</span>
                        </div>
                    </div>
                </div>

                {/* زر الإجراء */}
                <div className="flex justify-end mt-4 md:mt-0">
                    <Link
                        href={`/auction-archive/${auction.id}`}
                        className="bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors px-4 py-2 rounded-lg flex items-center"
                    >
                        عرض التفاصيل
                        <ChevronLeft className="h-4 w-4 mr-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
