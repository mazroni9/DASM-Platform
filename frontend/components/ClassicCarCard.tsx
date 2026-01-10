/**
 * 🧩 ClassicCarCard
 * 📁 المسار: Frontend-local/components/ClassicCarCard.tsx
 *
 * ✅ الوظيفة:
 * - عرض بطاقة سيارة كلاسيكية تحتوي على صورة، اسم، وصف، سعر تقديري، تاريخ المزاد، وزر
 * - يُستخدم في صفحة مزادات السيارات الكلاسيكية
 * - يدعم حالة الـ skeleton loading
 */

"use client";

import React from "react";
import Image from "next/image";
import { Calendar, Heart } from "lucide-react";
import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";
import LoadingLink from "@/components/LoadingLink";
interface ClassicCarCardProps {
  car?: {
    id: string;
    title: string;
    description: string;
    evaluation_price: string;
    image: string;
    created_at: string;
    status: "live" | "past";
  };
  loading?: boolean;
}

export default function ClassicCarCard({
  car,
  loading = false,
}: ClassicCarCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden group">
      {/* صورة السيارة مع زر المفضلة أو skeleton */}
      <div className="relative h-64 w-full">
        {loading ? (
          <Skeleton variant="rectangular" width="100%" height={256} />
        ) : (
          <>
            <Image
              src={car?.image || "/placeholder-classic-car.jpg"}
              alt={car?.title || "Classic car image"}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-amber-500"
              title="إضافة للمفضلة"
              aria-label="إضافة للمفضلة"
            >
              <Heart size={20} />
            </button>
          </>
        )}

        {/* skeleton لزر المفضلة */}
        {loading && (
          <div className="absolute top-4 right-4">
            <Skeleton variant="circular" width={40} height={40} />
          </div>
        )}
      </div>

      <div className="p-6">
        {/* اسم السيارة أو skeleton */}
        {loading ? (
          <Skeleton variant="text" height={32} className="mb-2" />
        ) : (
          <h3 className="text-xl font-bold mb-2">{car?.title}</h3>
        )}

        {/* وصف السيارة أو skeleton */}
        {loading ? (
          <Skeleton variant="text" height={24} className="mb-4" />
        ) : (
          <p className="text-gray-600 mb-4">{car?.description}</p>
        )}

        {/* السعر والتاريخ أو skeleton */}
        <div className="flex justify-between items-center">
          <div>
            {loading ? (
              <>
                <Skeleton
                  variant="text"
                  width={100}
                  height={16}
                  className="mb-1"
                />
                <Skeleton variant="text" width={150} height={20} />
              </>
            ) : (
              <>
                <p className="text-gray-500 text-sm mb-1">السعر التقديري</p>
                <p className="font-semibold text-amber-600">
                  {car?.evaluation_price} ريال
                </p>
              </>
            )}
          </div>

          {loading ? (
            <Box className="flex items-center">
              <Skeleton
                variant="circular"
                width={16}
                height={16}
                className="ml-1"
              />
              <Skeleton variant="text" width={80} height={16} />
            </Box>
          ) : (
            <div className="flex items-center text-sm text-gray-500">
              <Calendar size={16} className="ml-1" />
              <span>{car?.created_at}</span>
            </div>
          )}
        </div>

        {/* الزر أو skeleton */}
        <div className="mt-6">
          {loading ? (
            <Skeleton
              variant="rectangular"
              width="100%"
              height={40}
              className="rounded-md"
            />
          ) : car?.status === "live" ? (
            <LoadingLink
              href={`/carDetails/${car?.id}`}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-medium transition"
            >
              <button className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-medium transition">
                عرض التفاصيل
              </button>
            </LoadingLink>
          ) : (
            <div className="w-full py-2 bg-gray-100 text-gray-700 rounded-md font-medium text-center">
              تم الانتهاء من السوق
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
