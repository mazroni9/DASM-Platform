/**
 * 🧩 مكون السيارة الحالية
 * 📁 المسار: frontend/app/dashboard/auctioneer/components/CurrentCar.tsx
 *
 * ✅ الوظيفة:
 * - عرض تفاصيل السيارة الحالية في المزاد
 * - عرض صور السيارة
 * - عرض معلومات المالك
 */

"use client";

import React, { useState } from "react";
import {
    Car,
    Clock,
    AlertCircle,
    Check,
    X,
    ChevronRight,
    ChevronLeft,
} from "lucide-react";
import { formatMoney } from "@/lib/utils";

// نوع بيانات السيارة نفس ما تم تعريفه في الصفحة الرئيسية
interface Car {
    id: number;
    title: string;
    make: string;
    model: string;
    year: number;
    mileage: number;
    color: string;
    vin: string;
    condition: string;
    images: string[];
    min_price: number;
    max_price: number;
    current_price: number;
    description: string;
    seller_id: number;
    seller_name?: string;
    status: "pending" | "active" | "sold" | "unsold";
    created_at: string;
}

interface CurrentCarProps {
    car: Car | null;
}

export default function CurrentCar({ car }: CurrentCarProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // التعامل مع عدم وجود سيارة حالية
    if (!car) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <Car className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-bold text-gray-700 mb-2">
                    لا توجد سيارة حالية
                </h2>
                <p className="text-gray-500">
                    انقر على "السيارة التالية" لبدء المزاد
                </p>
            </div>
        );
    }

    // التنقل بين صور السيارة
    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex(
            (prev) => (prev - 1 + car.images.length) % car.images.length
        );
    };

    // تحديد لون حالة السيارة
    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800";
            case "sold":
                return "bg-blue-100 text-blue-800";
            case "unsold":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // تحديد نص حالة السيارة
    const getStatusText = (status: string) => {
        switch (status) {
            case "active":
                return "جارٍ المزاد";
            case "sold":
                return "تم البيع";
            case "unsold":
                return "لم يتم البيع";
            case "pending":
                return "في الانتظار";
            default:
                return "غير معروف";
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-teal-700 text-white">
                <h2 className="text-xl font-bold">السيارة الحالية في المزاد</h2>
            </div>

            {/* صور السيارة مع أزرار التنقل */}
            <div className="relative">
                {car.images.length > 0 ? (
                    <>
                        <div className="relative pb-[56.25%] bg-gray-200">
                            <img
                                src={car.images[currentImageIndex]}
                                alt={car.title}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </div>

                        {car.images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70"
                                    aria-label="الصورة السابقة"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70"
                                    aria-label="الصورة التالية"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>

                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 rtl:space-x-reverse">
                                    {car.images.map((_, index) => (
                                        <div
                                            key={index}
                                            className={`h-2 w-2 rounded-full ${
                                                index === currentImageIndex
                                                    ? "bg-white"
                                                    : "bg-white bg-opacity-50"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                        <Car className="h-16 w-16 text-gray-400" />
                    </div>
                )}
            </div>

            {/* معلومات السيارة */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-800">
                        {car.title}
                    </h3>
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            car.status
                        )}`}
                    >
                        {getStatusText(car.status)}
                    </span>
                </div>

                {/* السعر الحالي */}
                <div className="bg-teal-50 p-3 rounded-lg mb-4 text-center border border-teal-200">
                    <p className="text-sm text-teal-700 mb-1">السعر الحالي</p>
                    <p className="text-3xl font-bold text-teal-800">
                        {formatMoney(car.current_price)} ريال
                    </p>
                    <div className="mt-1 flex justify-between text-xs text-teal-600">
                        <span>الحد الأدنى: {formatMoney(car.min_price)}</span>
                        <span>الحد الأقصى: {formatMoney(car.max_price)}</span>
                    </div>
                </div>

                {/* تفاصيل السيارة في جدول */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">الماركة</span>
                        <span className="font-medium">{car.make}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">الموديل</span>
                        <span className="font-medium">{car.model}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">سنة الصنع</span>
                        <span className="font-medium">{car.year}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">العداد</span>
                        <span className="font-medium">
                            {car.mileage.toLocaleString()} كم
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">اللون</span>
                        <span className="font-medium">{car.color}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">الحالة</span>
                        <span className="font-medium">{car.condition}</span>
                    </div>
                </div>

                {/* وصف السيارة */}
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">
                        الوصف
                    </h4>
                    <p className="text-sm text-gray-600">{car.description}</p>
                </div>

                {/* معلومات البائع */}
                {car.seller_name && (
                    <div className="border-t pt-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">
                            البائع
                        </h4>
                        <p className="text-sm text-gray-600">
                            {car.seller_name}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
