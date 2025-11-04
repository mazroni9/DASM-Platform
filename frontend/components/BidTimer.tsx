/**
 * 🧭 BidTimer
 * 📁 المسار: Frontend-local/components/BidTimer.tsx
 *
 * ✅ الوظيفة:
 * - يعرض مؤقت تنازلي حتى نهاية المزاد الحالي (الحراج أو الفوري أو الصامت)
 * - يُحسب تلقائيًا حسب الساعة الداخلية للنظام
 * - يمكنه قبول وقت مبدئي محدد (بالثواني) من خلال props
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

function getAuctionEndTime(): { label: string, end: Date } {
  const now = new Date();
  const h = now.getHours();

  let label = '';
  let end = new Date(now);

  if (h >= 16 && h < 19) {
    label = 'الحراج المباشر';
    end.setHours(19, 0, 0, 0);
  } else if (h >= 19 && h < 22) {
    label = 'السوق الفوري المباشر';
    end.setHours(22, 0, 0, 0);
  } else {
    label = 'السوق الصامت';
    if (h >= 22) {
      end.setDate(end.getDate() + 1);
    }
    end.setHours(16, 0, 0, 0); // ينتهي الساعة 4:00 عصرًا اليوم التالي
  }

  return { label, end };
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

interface BidTimerProps {
  initialTime?: number; // الوقت المبدئي بالثواني (اختياري)
  showLabel?: boolean; // إظهار عنوان المزاد (اختياري) - افتراضيًا true
  showProgress?: boolean; // إظهار شريط التقدم (اختياري) - افتراضيًا true
}

export default function BidTimer({ 
  initialTime, 
  showLabel = true, 
  showProgress = true 
}: BidTimerProps) {
  const { label, end } = getAuctionEndTime();
  const [remaining, setRemaining] = useState(initialTime ? initialTime * 1000 : end.getTime() - new Date().getTime());

  useEffect(() => {
    if (initialTime) {
      // إذا تم تقديم وقت مبدئي، استخدمه كمؤقت تنازلي
      const timer = setInterval(() => {
        setRemaining(prev => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      // استخدام الوقت المبني على نهاية المزاد
      const timer = setInterval(() => {
        setRemaining(end.getTime() - new Date().getTime());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [end, initialTime]);

  // إذا كان المكون جزءًا من مربع أكبر ولا يحتاج لعرض كامل
  if (!showLabel && !showProgress) {
    return <span>{formatTime(remaining)}</span>;
  }

  return (
    <div className="bg-card border-l-4 border-destructive rounded-lg shadow-md p-4">
      {showLabel && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {label} - جارٍ الآن
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="text-destructive h-5 w-5" />
            <div className="text-xl font-mono font-semibold text-destructive">
              {formatTime(remaining)}
            </div>
          </div>
        </div>
      )}
      {!showLabel && (
        <div className="flex items-center gap-3 justify-center">
          <Clock className="text-destructive h-5 w-5" />
          <div className="text-xl font-mono font-semibold text-destructive">
            {formatTime(remaining)}
          </div>
        </div>
      )}
      {showProgress && (
        <div className="mt-3 h-2 w-full bg-border rounded-full overflow-hidden">
          <div 
            className="h-full bg-destructive rounded-full"
            style={{
              width: `${Math.min(100, 100 - (remaining / (3 * 60 * 60 * 1000)) * 100)}%`,
            }}
          ></div>
        </div>
      )}
    </div>
  );
}
