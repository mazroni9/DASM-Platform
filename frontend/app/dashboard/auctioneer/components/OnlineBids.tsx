/**
 * 🧩 مكون المزايدات المباشرة
 * 📁 المسار: frontend/app/dashboard/auctioneer/components/OnlineBids.tsx
 *
 * ✅ الوظيفة:
 * - عرض المزايدات الواردة من المزايدين عبر الإنترنت
 * - تمييز حالة المزايدات بألوان مختلفة
 * - تنبيه المُحرّج عند وصول مزايدة جديدة
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { Clock, Globe, User, CheckCircle, XCircle } from 'lucide-react';
import { formatMoney } from '@/app/lib/format-utils';
import { Bid } from '@/app/lib/websocket-provider';

interface OnlineBidsProps {
  bids: Bid[];
}

export default function OnlineBids({ bids }: OnlineBidsProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastBidCountRef = useRef<number>(0);
  
  // تشغيل صوت عند وصول مزايدة جديدة
  useEffect(() => {
    if (bids.length > lastBidCountRef.current && lastBidCountRef.current > 0) {
      // تشغيل الصوت إذا كان موجوداً
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.error('خطأ في تشغيل الصوت:', err));
      }
      
      // تمرير التلقائي للقائمة
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    }
    
    // تحديث عدد المزايدات
    lastBidCountRef.current = bids.length;
  }, [bids.length]);
  
  // تنسيق وقت المزايدة
  const formatBidTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-blue-600 text-white">
        <h2 className="text-xl font-bold">المزايدات المباشرة</h2>
      </div>
      
      {/* صوت التنبيه */}
      <audio ref={audioRef} src="/sounds/bid-notification.mp3" preload="auto" />
      
      {/* قائمة المزايدات */}
      <div 
        ref={containerRef}
        className="max-h-[400px] overflow-y-auto"
      >
        {bids.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Globe className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg">لا توجد مزايدات حتى الآن</p>
            <p className="text-sm">ستظهر المزايدات المباشرة هنا عند وصولها</p>
          </div>
        ) : (
          <ul className="divide-y">
            {bids.map((bid, index) => (
              <li 
                key={bid.id}
                className={`p-3 ${index === 0 ? 'bg-blue-50 animate-pulse' : ''}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className={`w-2 h-2 rounded-full ${bid.is_online ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                    <span className="font-semibold">{bid.bidder_name}</span>
                    {bid.is_online ? (
                      <Globe className="h-4 w-4 text-gray-500" />
                    ) : (
                      <User className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {formatBidTime(bid.timestamp)}
                  </div>
                </div>
                
                <div className="text-lg font-bold text-green-600">
                  {formatMoney(bid.amount)} ريال
                </div>
                
                <div className="mt-1 flex justify-end space-x-2 rtl:space-x-reverse">
                  <button
                    className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                    title="قبول المزايدة"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    قبول
                  </button>
                  <button
                    className="inline-flex items-center text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                    title="رفض المزايدة"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    رفض
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 