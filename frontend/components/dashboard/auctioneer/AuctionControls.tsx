/**
 * 🧩 مكون أزرار التحكم في المزاد
 * 📁 المسار: frontend/app/dashboard/auctioneer/components/AuctionControls.tsx
 *
 * ✅ الوظيفة:
 * - توفير أزرار للتحكم في سير المزاد
 * - إيقاف/تشغيل المزاد
 * - الانتقال للسيارة التالية
 * - إنهاء المزاد الحالي (بيع أو عدم بيع)
 */

'use client';

import React, { useState } from 'react';
import { Play, Pause, ChevronRight, Check, X, AlertTriangle } from 'lucide-react';

interface AuctionControlsProps {
  auctionStatus: 'waiting' | 'active' | 'paused';
  onNextCar: () => void;
  onEndAuction: (sold: boolean) => void;
  onTogglePause: () => void;
}

export default function AuctionControls({ 
  auctionStatus, 
  onNextCar, 
  onEndAuction, 
  onTogglePause 
}: AuctionControlsProps) {
  const [showConfirm, setShowConfirm] = useState<null | 'end-sold' | 'end-unsold'>(null);

  // إظهار نافذة تأكيد لإنهاء المزاد
  const confirmEndAuction = (sold: boolean) => {
    setShowConfirm(sold ? 'end-sold' : 'end-unsold');
  };

  // التأكيد على إنهاء المزاد
  const handleConfirmEnd = () => {
    if (showConfirm === 'end-sold') {
      onEndAuction(true);
    } else if (showConfirm === 'end-unsold') {
      onEndAuction(false);
    }
    setShowConfirm(null);
  };

  // إلغاء عملية التأكيد
  const handleCancelConfirm = () => {
    setShowConfirm(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-gray-800 text-white">
        <h2 className="text-xl font-bold">التحكم في المزاد</h2>
      </div>
      
      <div className="p-4">
        {showConfirm ? (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <h3 className="font-bold text-yellow-800">
                {showConfirm === 'end-sold' 
                  ? 'تأكيد البيع وإنهاء المزاد' 
                  : 'تأكيد عدم البيع وإنهاء المزاد'}
              </h3>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              {showConfirm === 'end-sold' 
                ? 'هل أنت متأكد من بيع السيارة الحالية والانتقال للسيارة التالية؟' 
                : 'هل أنت متأكد من إنهاء المزاد للسيارة الحالية بدون بيع؟'}
            </p>
            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <button
                onClick={handleCancelConfirm}
                className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmEnd}
                className={`px-3 py-1.5 rounded text-white ${
                  showConfirm === 'end-sold' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                تأكيد
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* زر إيقاف/تشغيل المزاد */}
            <button
              onClick={onTogglePause}
              className={`flex items-center justify-center py-3 px-4 rounded-lg ${
                auctionStatus === 'active' 
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
              disabled={auctionStatus === 'waiting'}
            >
              {auctionStatus === 'active' ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  <span>إيقاف مؤقت</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  <span>استئناف</span>
                </>
              )}
            </button>
            
            {/* زر السيارة التالية */}
            <button
              onClick={onNextCar}
              className="flex items-center justify-center py-3 px-4 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
            >
              <span>السيارة التالية</span>
              <ChevronRight className="h-5 w-5 ml-2" />
            </button>
            
            {/* زر إنهاء المزاد - تم البيع */}
            <button
              onClick={() => confirmEndAuction(true)}
              className="flex items-center justify-center py-3 px-4 bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
              disabled={auctionStatus === 'waiting'}
            >
              <Check className="h-5 w-5 mr-2" />
              <span>تم البيع</span>
            </button>
            
            {/* زر إنهاء المزاد - لم يتم البيع */}
            <button
              onClick={() => confirmEndAuction(false)}
              className="flex items-center justify-center py-3 px-4 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
              disabled={auctionStatus === 'waiting'}
            >
              <X className="h-5 w-5 mr-2" />
              <span>لم يتم البيع</span>
            </button>
          </div>
        )}
        
        {/* الحالة الحالية للمزاد */}
        <div className="mt-4 text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            auctionStatus === 'active' 
              ? 'bg-green-100 text-green-800' 
              : auctionStatus === 'paused' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-gray-100 text-gray-800'
          }`}>
            <span className={`h-2 w-2 rounded-full mr-1.5 ${
              auctionStatus === 'active' 
                ? 'bg-green-500 animate-pulse' 
                : auctionStatus === 'paused' 
                  ? 'bg-yellow-500' 
                  : 'bg-gray-500'
            }`}></span>
            {auctionStatus === 'active' 
              ? 'المزاد نشط' 
              : auctionStatus === 'paused' 
                ? 'متوقف مؤقتاً' 
                : 'في الانتظار'
            }
          </div>
        </div>
      </div>
    </div>
  );
} 