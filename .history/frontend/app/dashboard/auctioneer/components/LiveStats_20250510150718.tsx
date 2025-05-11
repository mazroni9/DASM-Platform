/**
 * 🧩 مكون الإحصائيات المباشرة
 * 📁 المسار: frontend/app/dashboard/auctioneer/components/LiveStats.tsx
 *
 * ✅ الوظيفة:
 * - عرض إحصائيات المزاد في الوقت الحقيقي
 * - عرض عدد المشاهدين والمزايدين
 * - عرض قيمة أعلى مزايدة وإجمالي عدد المزايدات
 */

'use client';

import React from 'react';
import { Eye, Users, Gavel, BarChart2 } from 'lucide-react';
import { formatMoney } from '@/app/lib/format-utils';

interface LiveStatsProps {
  viewerCount: number;
  bidderCount: number;
  highestBid: number;
  bidCount: number;
}

export default function LiveStats({ 
  viewerCount, 
  bidderCount, 
  highestBid, 
  bidCount 
}: LiveStatsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-indigo-600 text-white">
        <h2 className="text-xl font-bold">إحصائيات المزاد</h2>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* عدد المشاهدين */}
          <div className="bg-indigo-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-indigo-800 font-medium">المشاهدون</span>
              <Eye className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-900">
              {viewerCount.toLocaleString()}
            </div>
          </div>
          
          {/* عدد المزايدين */}
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-green-800 font-medium">المزايدون</span>
              <Users className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900">
              {bidderCount.toLocaleString()}
            </div>
          </div>
          
          {/* أعلى مزايدة */}
          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-amber-800 font-medium">أعلى مزايدة</span>
              <Gavel className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-amber-900">
              {formatMoney(highestBid)} ريال
            </div>
          </div>
          
          {/* عدد المزايدات */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-blue-800 font-medium">عدد المزايدات</span>
              <BarChart2 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {bidCount.toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* معدل التفاعل */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">معدل التفاعل</span>
            <span className="text-sm font-medium text-indigo-600">
              {bidderCount > 0 && viewerCount > 0 
                ? `${Math.round((bidderCount / viewerCount) * 100)}%` 
                : '-'}
            </span>
          </div>
          
          {/* شريط التقدم */}
          <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full" 
              style={{ 
                width: bidderCount > 0 && viewerCount > 0 
                  ? `${Math.min((bidderCount / viewerCount) * 100, 100)}%` 
                  : '0%' 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
} 