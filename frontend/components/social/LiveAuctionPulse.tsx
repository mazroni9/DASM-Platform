/**
 * 🧩 مكون نبض المزاد المباشر
 * 📁 المسار: components/social/LiveAuctionPulse.tsx
 *
 * ✅ الوظيفة:
 * - عرض الإحصائيات الحية للمزاد مثل عدد المزايدين النشطين
 * - عرض مؤشر الاهتمام بالسيارة
 * - عرض معدل تغير السعر
 * - محاكاة "نبض" المزاد لإعطاء المزايدين الشعور بالاتصال المباشر بالحدث
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Zap, Users, TrendingUp, Eye, Clock, HeartPulse } from 'lucide-react';
import { formatMoney } from '@/app/lib/format-utils';

interface LiveAuctionPulseProps {
  auctionId: number;
  initialViewers?: number;
  initialBidders?: number;
  initialInterestLevel?: number; // 0-100
  priceChangeRate?: number; // نسبة مئوية للتغير في الدقيقة
  remainingTime?: number; // بالثواني
  className?: string; // إضافة خاصية className للسماح بتخصيص المظهر الخارجي
}

export default function LiveAuctionPulse({ 
  auctionId, 
  initialViewers = 35, 
  initialBidders = 8, 
  initialInterestLevel = 65,
  priceChangeRate = 2.5, // 2.5% في الدقيقة
  remainingTime = 600, // 10 دقائق
  className = ''
}: LiveAuctionPulseProps) {
  const [viewers, setViewers] = useState(initialViewers);
  const [bidders, setBidders] = useState(initialBidders);
  const [interestLevel, setInterestLevel] = useState(initialInterestLevel);
  const [pulseTime, setPulseTime] = useState(new Date());
  const [countdown, setCountdown] = useState(remainingTime);
  
  // محاكاة تغيرات في الإحصائيات الحية للمزاد
  useEffect(() => {
    // تحديث البيانات كل 10 ثوانٍ
    const intervalId = setInterval(() => {
      // محاكاة تغير عدد المشاهدين (±0-3)
      const viewerChange = Math.floor(Math.random() * 4) * (Math.random() > 0.6 ? 1 : -1);
      setViewers(prev => Math.max(initialViewers, prev + viewerChange));
      
      // محاكاة تغير عدد المزايدين (±0-1)
      const bidderChange = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      setBidders(prev => Math.max(5, prev + bidderChange));
      
      // محاكاة تغير مستوى الاهتمام (±0-2)
      const interestChange = Math.floor(Math.random() * 3) * (Math.random() > 0.5 ? 1 : -1);
      setInterestLevel(prev => Math.min(100, Math.max(0, prev + interestChange)));
      
      // تحديث وقت النبض
      setPulseTime(new Date());
    }, 10000);
    
    // تحديث العد التنازلي كل ثانية
    const countdownId = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          clearInterval(countdownId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(intervalId);
      clearInterval(countdownId);
    };
  }, [initialViewers]);
  
  // تنسيق العد التنازلي
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // تحديد فئة الاهتمام بناءً على مستوى الاهتمام
  const getInterestCategory = (level: number): string => {
    if (level >= 80) return 'مرتفع جداً';
    if (level >= 60) return 'مرتفع';
    if (level >= 40) return 'متوسط';
    if (level >= 20) return 'منخفض';
    return 'منخفض جداً';
  };
  
  // تحديد لون مستوى الاهتمام
  const getInterestColor = (level: number): string => {
    if (level >= 80) return 'text-red-500';
    if (level >= 60) return 'text-orange-500';
    if (level >= 40) return 'text-yellow-500';
    if (level >= 20) return 'text-blue-500';
    return 'text-gray-500';
  };
  
  // تحديد دلالة معدل تغير السعر
  const getPriceRateIndicator = (rate: number): JSX.Element => {
    if (rate > 3) {
      return (
        <div className="flex items-center text-red-500">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>سريع جداً</span>
        </div>
      );
    } else if (rate > 1.5) {
      return (
        <div className="flex items-center text-orange-500">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>سريع</span>
        </div>
      );
    } else if (rate > 0.5) {
      return (
        <div className="flex items-center text-yellow-500">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>متوسط</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-blue-500">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>بطيء</span>
        </div>
      );
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden h-full ${className}`}>
      <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex items-center">
          <HeartPulse className="h-5 w-5 mr-2" />
          <h3 className="font-bold">نبض المزاد</h3>
          <div className="ml-auto flex items-center">
            <span className="h-2 w-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
            <span className="text-xs">مباشر</span>
          </div>
        </div>
      </div>
      
      <div className="p-2 flex flex-col h-full justify-between">
        {/* المؤشرات بتنسيق عمودي */}
        <div className="space-y-2">
          {/* عدد المشاهدين */}
          <div className="bg-indigo-50 p-2 rounded-lg">
            <div className="flex items-center text-xs text-indigo-700 mb-1">
              <Eye className="h-3 w-3 mr-1" />
              <span>المشاهدون</span>
            </div>
            <div className="flex items-end">
              <span className="text-xl font-bold text-indigo-700">{viewers}</span>
              <span className="text-xs text-indigo-500 mb-1 mr-1">نشط</span>
            </div>
          </div>
          
          {/* عدد المزايدين */}
          <div className="bg-green-50 p-2 rounded-lg">
            <div className="flex items-center text-xs text-green-700 mb-1">
              <Users className="h-3 w-3 mr-1" />
              <span>المزايدون</span>
            </div>
            <div className="flex items-end">
              <span className="text-xl font-bold text-green-700">{bidders}</span>
              <span className="text-xs text-green-500 mb-1 mr-1">نشط</span>
            </div>
          </div>
          
          {/* مستوى الاهتمام */}
          <div className="bg-gray-50 p-2 rounded-lg">
            <div className="flex items-center text-xs text-gray-700 mb-1">
              <Zap className="h-3 w-3 mr-1" />
              <span>مستوى الاهتمام</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${getInterestColor(interestLevel)}`}>
                  {getInterestCategory(interestLevel)}
                </span>
                <span className="text-xs text-gray-500">{interestLevel}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    interestLevel >= 80 ? 'bg-red-500' :
                    interestLevel >= 60 ? 'bg-orange-500' :
                    interestLevel >= 40 ? 'bg-yellow-500' :
                    interestLevel >= 20 ? 'bg-blue-500' : 'bg-gray-500'
                  }`}
                  style={{ width: `${interestLevel}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* معدل تغير السعر */}
          <div className="bg-yellow-50 p-2 rounded-lg">
            <div className="flex items-center text-xs text-yellow-700 mb-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>معدل تغير السعر</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-yellow-700">{priceChangeRate}%</span>
              <span className="text-xs">
                {getPriceRateIndicator(priceChangeRate)}
              </span>
            </div>
          </div>
        </div>
        
        {/* الوقت المتبقي والنبض */}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-1.5" />
            <span>{formatCountdown(countdown)}</span>
          </div>
          
          <div className="flex items-center text-xs text-gray-500">
            <span>آخر تحديث: {pulseTime.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <div className="h-2 w-2 bg-indigo-400 rounded-full ml-1.5 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}