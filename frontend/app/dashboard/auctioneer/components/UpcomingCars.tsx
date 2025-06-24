"use client";

import React from "react";
import { Car, Clock } from "lucide-react";

interface CarType {
    id: number;
    make: string;
    model: string;
    year: number;
    current_price: number;
    images: string[];
}

interface UpcomingCarsProps {
    cars: CarType[];
}

export default function UpcomingCars({ cars }: UpcomingCarsProps) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-orange-600" />
                    السيارات القادمة
                </h2>
                <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    {cars.length} سيارة
                </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {cars.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد سيارات قادمة</p>
                    </div>
                ) : (
                    cars.map((car, index) => (
                        <div
                            key={car.id}
                            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg mr-3 overflow-hidden">
                                <img
                                    src={
                                        car.images[0] ||
                                        "/api/placeholder/50/50"
                                    }
                                    alt={`${car.make} ${car.model}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-gray-900 text-sm">
                                        {car.make} {car.model}
                                    </h3>
                                    <span className="text-xs text-gray-500">
                                        #{index + 1}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-gray-500">
                                        {car.year}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {car.current_price.toLocaleString()}{" "}
                                        ريال
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
