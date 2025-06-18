'use client';

import React from 'react';
import { Eye, Users, TrendingUp, Hash } from 'lucide-react';

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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">إحصائيات مباشرة</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-900">{viewerCount}</div>
          <div className="text-sm text-blue-700">مشاهد</div>
        </div>

        <div className="text-center p-4 bg-green-50 rounded-lg">
          <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-900">{bidderCount}</div>
          <div className="text-sm text-green-700">مزايد</div>
        </div>

        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <div className="text-xl font-bold text-orange-900">
            {highestBid.toLocaleString()}
          </div>
          <div className="text-sm text-orange-700">أعلى مزايدة</div>
        </div>

        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <Hash className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-900">{bidCount}</div>
          <div className="text-sm text-purple-700">إجمالي المزايدات</div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">معدل المزايدة</div>
          <div className="text-lg font-bold text-gray-900">
            {bidderCount > 0 ? (bidCount / bidderCount).toFixed(1) : '0'} مزايدة/شخص
          </div>
        </div>
      </div>
    </div>
  );
}
