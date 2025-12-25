
/**
 * 🧩 AuctionCard
 * 📁 المسار: Frontend-local/components/AuctionCard.tsx
 *
 * ✅ الوظيفة:
 * - عرض بطاقة سيارة تحتوي على صورة، اسم، سعر، زر تفاصيل
 * - يُستخدم في صفحات المزادات مثل الفوري أو المجوهرات
 * - يدعم حالة الـ skeleton loading
 */

'use client';

import React from 'react';
import LoadingLink from "@/components/LoadingLink";
import { Fuel, KeySquare } from 'lucide-react';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

interface AuctionCardProps {
  car?: any;
  loading?: boolean;
}

export default function AuctionCard({ car, loading = false }: AuctionCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col">
      {/* صورة السيارة أو skeleton */}
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={192} className="rounded-md mb-4" />
      ) : (
        <img
          src={car?.image || '/placeholder-car.jpg'}
          alt={car?.title || 'Car image'}
          className="w-full h-48 object-cover rounded-md mb-4"
        />
      )}

      {/* عنوان السيارة أو skeleton */}
      {loading ? (
        <Skeleton variant="text" height={28} className="mb-1" />
      ) : (
        <h3 className="text-lg font-bold text-foreground mb-1">{car?.title}</h3>
      )}

      {/* السعر الحالي أو skeleton */}
      {loading ? (
        <Skeleton variant="text" height={24} width="60%" className="mb-2" />
      ) : (
        <p className="text-primary font-semibold mb-2">
          السعر الحالي: {car?.evaluation_price?.toLocaleString() ?? 0} ريال
        </p>
      )}

      {/* حالة المزاد أو skeleton */}
      {loading ? (
        <Skeleton variant="text" height={20} width="40%" className="mb-2" />
      ) : (
        car?.active_auction?.status_label && (
          <div className="flex items-center mb-2">
            <span className="ml-1">حالة المزاد:</span>
            <p className="text-sm text-secondary">{car.active_auction.status_label}</p>
          </div>
        )
      )}

      {/* تفاصيل السيارة أو skeleton */}
      {loading ? (
        <Box className="flex items-center gap-1 mb-4">
          <Skeleton variant="text" width={60} height={16} />
          <Skeleton variant="text" width={80} height={16} />
          <Skeleton variant="text" width={70} height={16} />
        </Box>
      ) : (
        <div className="flex items-center gap-1 mb-4">
          <span className="flex items-center gap-1 text-foreground">
            <KeySquare size={12}/> {car?.condition?.ar}
          </span>
          <span className="flex items-center gap-1 text-foreground">
            <Fuel size={12}/> {car?.engine}
          </span>
          <span className="flex items-center gap-1 text-foreground">
            <KeySquare size={12}/> {car?.transmission?.ar}
          </span>
        </div>
      )}

      {/* زر التفاصيل أو skeleton */}
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={40} className="mt-auto rounded" />
      ) : (
        <LoadingLink
          href={`/carDetails/${car?.id}`}
          className="mt-auto text-center bg-primary text-white py-2 px-4 rounded hover:bg-primary/90 block text-sm"
        >
          عرض التفاصيل
        </LoadingLink>
      )}
    </div>
  );
}
