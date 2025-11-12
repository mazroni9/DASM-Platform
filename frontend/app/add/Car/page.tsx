/**
 * 📝 صفحة إضافة سيارة جديدة
 * 📁 المسار: frontend/app/add/Car/page.tsx
 */

"use client";

import { Car, Home } from "lucide-react";
import LoadingLink from "@/components/LoadingLink";
import CarDataEntryForm from "@/components/dashboard/CarDataEntryForm";

export default function AddCarPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* رأس الصفحة مع رابط العودة */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Car className="text-blue-600 h-8 w-8 ml-2" />
            <h1 className="text-3xl font-bold text-gray-900">إضافة سيارة جديدة</h1>
          </div>
          <LoadingLink
            href="/auctions"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Home className="ml-2 -mr-1 h-5 w-5" />
            العودة للرئيسية
          </LoadingLink>
        </div>
        <p className="mt-2 text-gray-600">أدخل بيانات سيارتك وسيتم إنشاء مزاد تلقائياً بعد الموافقة</p>
      </div>

      {/* نموذج إدخال بيانات السيارة */}
      <CarDataEntryForm />
    </div>
  );
}
