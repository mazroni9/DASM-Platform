/**
 * 🧩 مكون السيارات القادمة
 * 📁 المسار: frontend/app/dashboard/auctioneer/components/UpcomingCars.tsx
 *
 * ✅ الوظيفة:
 * - عرض قائمة السيارات القادمة في المزاد
 * - عرض صور مصغرة والمعلومات الأساسية لكل سيارة
 * - تنظيم القائمة بترتيب العرض في المزاد
 */

"use client";

import React from "react";
import { Car, Clock, Calendar } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { Car as CarType } from "@/app/lib/websocket-provider";

interface UpcomingCarsProps {
    cars: CarType[];
}

export default function UpcomingCars({ cars }: UpcomingCarsProps) {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-purple-600 text-white">
                <h2 className="text-xl font-bold">السيارات القادمة</h2>
            </div>

            <div className="p-4">
                {cars.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Car className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg">لا توجد سيارات قادمة</p>
                        <p className="text-sm">
                            تم الانتهاء من جميع السيارات في هذا المزاد
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {cars.map((car, index) => (
                            <li
                                key={car.id}
                                className="border rounded-lg overflow-hidden"
                            >
                                <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
                                    <span className="font-bold text-gray-700">
                                        #{index + 1}
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center">
                                        <Clock className="h-3 w-3 inline ml-1" />
                                        تقريباً {index * 15 + 10} دقيقة
                                    </span>
                                </div>

                                <div className="flex">
                                    {/* صورة السيارة */}
                                    <div className="w-24 h-24 bg-gray-200 relative flex-shrink-0">
                                        {car.images.length > 0 ? (
                                            <img
                                                src={car.images[0]}
                                                alt={car.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Car className="h-8 w-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* تفاصيل السيارة */}
                                    <div className="p-2 flex-grow">
                                        <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">
                                            {car.title}
                                        </h3>

                                        <div className="text-xs text-gray-600 mb-1">
                                            {car.year} • {car.make} •{" "}
                                            {car.mileage.toLocaleString()} كم
                                        </div>

                                        <div className="flex justify-between mt-1">
                                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                                                {car.condition}
                                            </span>
                                            <span className="text-xs font-bold text-green-700">
                                                {formatCurrency (car.min_price)}{" "}
                                                ريال
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {cars.length > 0 && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100 text-center">
                        <p className="text-sm text-purple-800">
                            <Calendar className="h-4 w-4 inline ml-1" />
                            إجمالي {cars.length} سيارة متبقية في هذا المزاد
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
