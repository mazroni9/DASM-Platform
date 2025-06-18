'use client';

import React from 'react';
import { Car, Clock, DollarSign } from 'lucide-react';

interface CarType {
  id: number;
  make: string;
  model: string;
  year: number;
  current_price: number;
  images: string[];
}

interface CurrentCarProps {
  car: CarType | null;
}

export default function CurrentCar({ car }: CurrentCarProps) {
  if (!car) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد سيارة حالية</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative">
        <img
          src={car.images[0] || '/api/placeholder/400/300'}
          alt={`${car.make} ${car.model}`}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          مباشر الآن
        </div>
      </div>
      
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {car.make} {car.model} {car.year}
        </h2>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-green-600">
            <DollarSign className="h-5 w-5 mr-1" />
            <span className="text-2xl font-bold">{car.current_price.toLocaleString()}</span>
            <span className="text-sm mr-1">ريال</span>
          </div>
          
          <div className="flex items-center text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span className="text-sm">نشط</span>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">تفاصيل السيارة</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">الماركة:</span>
              <span className="font-medium mr-2">{car.make}</span>
            </div>
            <div>
              <span className="text-gray-500">الموديل:</span>
              <span className="font-medium mr-2">{car.model}</span>
            </div>
            <div>
              <span className="text-gray-500">السنة:</span>
              <span className="font-medium mr-2">{car.year}</span>
            </div>
            <div>
              <span className="text-gray-500">الرقم:</span>
              <span className="font-medium mr-2">#{car.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
