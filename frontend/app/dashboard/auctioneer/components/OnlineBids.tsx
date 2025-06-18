'use client';

import React from 'react';
import { TrendingUp, User } from 'lucide-react';

interface Bid {
  id: number;
  amount: number;
  bidder_name: string;
  created_at: string;
}

interface OnlineBidsProps {
  bids: Bid[];
}

export default function OnlineBids({ bids }: OnlineBidsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          المزايدات المباشرة
        </h2>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
          {bids.length} مزايدة
        </span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {bids.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد مزايدات حتى الآن</p>
          </div>
        ) : (
          bids.map((bid, index) => (
            <div
              key={bid.id}
              className={`p-3 rounded-lg border-l-4 ${
                index === 0 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="font-medium text-gray-900">
                    {bid.bidder_name}
                  </span>
                  {index === 0 && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full mr-2">
                      الأعلى
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <div className={`font-bold ${
                    index === 0 ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {bid.amount.toLocaleString()} ريال
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(bid.created_at).toLocaleTimeString('ar-SA')}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
