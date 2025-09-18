"use client";

import React, { useState, useEffect } from "react";
import LoadingLink from "@/components/LoadingLink";
import {
    Car,
    Search,
    Clock,
    Calendar,
    ArrowUpRight,
    Bookmark,
    Star,
    Zap,
    Filter,
    ChevronDown,
    ArrowLeft,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

// واجهة بيانات السيارة الموصى بها
interface RecommendedCar {
    id: number;
    title: string;
    make: string;
    model: string;
    year: number;
    image: string;
    price: number;
    auctionDate?: string;
    timeLeft?: string;
    isLiveNow?: boolean;
    match?: number;
    valueScore?: number;
    isWatched?: boolean;
    category?: string;
}

export default function RecommendationsPage() {
    const [recommendations, setRecommendations] = useState<RecommendedCar[]>(
        []
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        // جلب بيانات التوصيات من API
        async function fetchRecommendations() {
            try {
                setLoading(true);

                try {
                    // محاولة استدعاء API الحقيقي
                    const response = await fetch("/api/recommendations");
                    if (!response.ok) throw new Error("فشل الاتصال بالخادم");
                    const data = await response.json();
                    setRecommendations(data);
                } catch (apiError) {
                    // في حالة الخطأ مع الاتصال بالـ API، نضع قائمة فارغة
                    console.error("خطأ في استدعاء API التوصيات:", apiError);
                    setRecommendations([]);
                }
            } catch (err) {
                console.error("فشل في جلب التوصيات:", err);
                setError(
                    "لم نتمكن من جلب التوصيات. يرجى المحاولة مرة أخرى لاحقًا."
                );
            } finally {
                setLoading(false);
            }
        }

        fetchRecommendations();
    }, []);

    // تبديل مراقبة السيارة
    const toggleWatchCar = (carId: number) => {
        setRecommendations((prevCars) =>
            prevCars.map((car) =>
                car.id === carId ? { ...car, isWatched: !car.isWatched } : car
            )
        );

        // في التنفيذ الفعلي، يتم إرسال طلب API هنا لتحديث حالة المراقبة في الخادم
    };

    // تنسيق تاريخ المزاد
    const formatAuctionDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
            return "اليوم";
        } else if (diffDays === 1) {
            return "غدًا";
        } else if (diffDays < 7) {
            return `بعد ${diffDays} أيام`;
        } else {
            return date.toLocaleDateString("ar-SA", {
                day: "numeric",
                month: "long",
            });
        }
    };

    // تصفية التوصيات حسب الفئة
    const filteredRecommendations = recommendations.filter((car) => {
        // تصفية حسب الفئة
        if (activeCategory !== "all" && car.category !== activeCategory) {
            return false;
        }

        // تصفية حسب البحث
        if (searchTerm.trim() !== "") {
            const searchLower = searchTerm.toLowerCase();
            return (
                car.title.toLowerCase().includes(searchLower) ||
                car.make.toLowerCase().includes(searchLower) ||
                car.model.toLowerCase().includes(searchLower) ||
                car.year.toString().includes(searchLower)
            );
        }

        return true;
    });

    // عرض حالة التحميل
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="animate-pulse">
                    <div className="h-10 bg-gray-200 rounded w-1/3 mb-8"></div>
                    <div className="h-12 bg-gray-200 rounded mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-lg shadow-sm p-4"
                            >
                                <div className="h-40 bg-gray-200 rounded mb-4"></div>
                                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                <div className="h-8 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
  

    // عرض حالة الخطأ
    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* العنوان وشريط البحث */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        توصيات مخصصة لك
                    </h1>
                    <LoadingLink
                        href="/dashboard"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors gap-1 px-3 py-2 rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
                    >
                        <span>لوحة التحكم</span>
                        <ArrowLeft className="h-4 w-4" />
                    </LoadingLink>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="ابحث عن ماركة، موديل، أو سنة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 pl-12 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Search className="absolute right-4 top-3.5 h-5 w-5 text-gray-400" />
                    </div>

                    <div className="relative">
                        <button className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 w-full md:w-auto min-w-[200px]">
                            <span className="flex items-center">
                                <Filter className="h-5 w-5 ml-2 text-gray-500" />
                                <span>تصفية حسب: </span>
                                <span className="font-medium">
                                    {activeCategory === "all" && "الكل"}
                                    {activeCategory === "similar" &&
                                        "سيارات مشابهة"}
                                    {activeCategory === "upcoming" &&
                                        "مزادات قادمة"}
                                    {activeCategory === "value" && "قيمة مميزة"}
                                    {activeCategory === "trending" && "رائجة"}
                                </span>
                            </span>
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                        </button>

                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                            <div className="py-1">
                                <button
                                    onClick={() => setActiveCategory("all")}
                                    className={`block w-full text-right px-4 py-2 text-sm ${
                                        activeCategory === "all"
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    الكل
                                </button>
                                <button
                                    onClick={() => setActiveCategory("similar")}
                                    className={`block w-full text-right px-4 py-2 text-sm ${
                                        activeCategory === "similar"
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    سيارات مشابهة
                                </button>
                                <button
                                    onClick={() =>
                                        setActiveCategory("upcoming")
                                    }
                                    className={`block w-full text-right px-4 py-2 text-sm ${
                                        activeCategory === "upcoming"
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    مزادات قادمة
                                </button>
                                <button
                                    onClick={() => setActiveCategory("value")}
                                    className={`block w-full text-right px-4 py-2 text-sm ${
                                        activeCategory === "value"
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    قيمة مميزة
                                </button>
                                <button
                                    onClick={() =>
                                        setActiveCategory("trending")
                                    }
                                    className={`block w-full text-right px-4 py-2 text-sm ${
                                        activeCategory === "trending"
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    رائجة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* بطاقات السيارات الموصى بها */}
            {filteredRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRecommendations.map((car) => (
                        <div
                            key={car.id}
                            className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                        >
                            {/* صورة السيارة */}
                            <div className="relative h-48 bg-gray-200">
                                <img
                                    src={car.image}
                                    alt={car.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            "https://via.placeholder.com/400x200?text=DASM";
                                    }}
                                />
                                {car.isLiveNow && (
                                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center">
                                        <div className="h-2 w-2 bg-white rounded-full mr-1 animate-pulse"></div>
                                        مباشر الآن
                                    </div>
                                )}
                                {car.category === "upcoming" &&
                                    !car.isLiveNow && (
                                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {car.auctionDate &&
                                                formatAuctionDate(
                                                    car.auctionDate
                                                )}
                                        </div>
                                    )}
                                <button
                                    title={
                                        car.isWatched
                                            ? "إلغاء المراقبة"
                                            : "إضافة للمراقبة"
                                    }
                                    onClick={() => toggleWatchCar(car.id)}
                                    className={`absolute top-2 right-2 p-1.5 rounded-full ${
                                        car.isWatched
                                            ? "bg-blue-50 text-blue-500"
                                            : "bg-white text-gray-400 hover:text-gray-600"
                                    }`}
                                >
                                    <Bookmark
                                        className="h-5 w-5"
                                        fill={
                                            car.isWatched
                                                ? "currentColor"
                                                : "none"
                                        }
                                    />
                                </button>
                            </div>

                            {/* معلومات السيارة */}
                            <div className="p-4">
                                <div className="flex justify-between">
                                    <h2 className="text-lg font-bold text-gray-900">
                                        {car.title}
                                    </h2>
                                    <div className="flex items-center">
                                        {car.match && (
                                            <div className="flex items-center text-blue-600 text-sm">
                                                <Star
                                                    className="h-4 w-4 ml-1"
                                                    fill="currentColor"
                                                />
                                                {car.match}%
                                            </div>
                                        )}
                                        {car.valueScore && car.match && (
                                            <span className="mx-1 text-gray-300">
                                                |
                                            </span>
                                        )}
                                        {car.valueScore && (
                                            <div className="flex items-center text-green-600 text-sm">
                                                <Zap className="h-4 w-4 ml-1" />
                                                {car.valueScore}%
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-1 text-gray-600">
                                    {car.year} • {car.make} • {car.model}
                                </div>

                                <div className="mt-2 text-2xl font-bold text-gray-800">
                                    {formatCurrency (car.price)} ريال
                                </div>

                                {car.timeLeft && (
                                    <div className="mt-2 flex items-center text-sm text-red-600">
                                        <Clock className="h-4 w-4 ml-1" />
                                        <span>متبقي: {car.timeLeft}</span>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <LoadingLink
                                        href={`/car/${car.id}`}
                                        className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                                    >
                                        عرض التفاصيل
                                    </LoadingLink>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <p className="text-gray-600 mb-4">
                        لم نجد أي سيارات تطابق معايير البحث الخاصة بك.
                    </p>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            مسح البحث
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
