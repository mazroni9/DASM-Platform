/**
 * 🧩 CaravanCard
 * 📁 المسار: Frontend-local/components/CaravanCard.tsx
 *
 * ✅ الوظيفة:
 * - عرض بطاقة كرفان تحتوي على صورة، عنوان، وصف، سعر التقييم، ومعلومات إضافية
 * - يُستخدم في صفحة مزادات الكرفانات
 * - يدعم حالة الـ skeleton loading
 */

'use client';

import React from 'react';
import LoadingLink from "@/components/LoadingLink";
import Image from 'next/image';
import { MapPin, Calendar, Users } from 'lucide-react';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

interface CaravanCardProps {
  caravan?: any;
  loading?: boolean;
}

export default function CaravanCard({ caravan, loading = false }: CaravanCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
      {/* صورة الكرفان أو skeleton */}
      <div className="relative h-60">
        {loading ? (
          <Skeleton variant="rectangular" width="100%" height={240} />
        ) : (
          <Image
            src={caravan?.image || '/placeholder-caravan.jpg'}
            alt={caravan?.title || 'Caravan image'}
            fill
            className="object-cover"
            unoptimized
          />
        )}
      </div>

      <div className="p-6">
        {/* عنوان الكرفان أو skeleton */}
        {loading ? (
          <Skeleton variant="text" height={32} className="mb-2" />
        ) : (
          <h3 className="text-xl font-bold mb-2">{caravan?.title}</h3>
        )}

        {/* وصف الكرفان أو skeleton */}
        {loading ? (
          <Skeleton variant="text" height={24} className="mb-4" />
        ) : (
          <p className="text-gray-600 mb-4">{caravan?.description}</p>
        )}

        {/* سعر التقييم أو skeleton */}
        {loading ? (
          <Skeleton variant="text" height={32} width="70%" className="mb-4" />
        ) : (
          <div className="text-xl font-bold text-green-600 mb-4">
            {caravan?.evaluation_price} ريال
          </div>
        )}

        {/* معلومات إضافية أو skeleton */}
        <div className="flex flex-col gap-2 mb-4">
          {loading ? (
            <>
              <Box className="flex items-center">
                <Skeleton variant="circular" width={18} height={18} className="ml-2" />
                <Skeleton variant="text" width={100} height={20} />
              </Box>
              <Box className="flex items-center">
                <Skeleton variant="circular" width={18} height={18} className="ml-2" />
                <Skeleton variant="text" width={120} height={20} />
              </Box>
              <Box className="flex items-center">
                <Skeleton variant="circular" width={18} height={18} className="ml-2" />
                <Skeleton variant="text" width={80} height={20} />
              </Box>
            </>
          ) : (
            <>
              <div className="flex items-center text-gray-500">
                <MapPin size={18} className="ml-2" />
                <span>{caravan?.province}</span>
              </div>
              <div className="flex items-center text-gray-500">
                <Calendar size={18} className="ml-2" />
                <span>{caravan?.created_at}</span>
              </div>
              <div className="flex items-center text-gray-500">
                <Users size={18} className="ml-2" />
                <span>{caravan?.capacity ?? ""}</span>
              </div>
            </>
          )}
        </div>

        {/* زر تقديم العرض أو skeleton */}
        {loading ? (
          <Skeleton variant="rectangular" width="100%" height={48} className="rounded-lg" />
        ) : (
          <LoadingLink
            href={`/carDetails/${caravan?.id}`}
            className="flex w-full items-center justify-center rounded-lg border border-emerald-800/35 bg-emerald-700 py-3 text-center text-sm font-semibold text-white shadow-sm ring-offset-background transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:bg-emerald-900 min-h-[44px]"
          >
            قدم عرضك
          </LoadingLink>
        )}
      </div>
    </div>
  );
}
