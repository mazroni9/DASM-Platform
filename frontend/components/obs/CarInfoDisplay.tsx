'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Clock, Edit, Save, Plus, Minus, RefreshCw } from 'lucide-react';
import { AuctionInfo } from '@/lib/obs/carInfoUpdater';
import { CarInfo } from '@/lib/obs/obsService';

interface CarInfoDisplayProps {
  className?: string;
  onStartAuction?: (auctionInfo: AuctionInfo) => void;
  onStopAuction?: () => void;
  onUpdateBidder?: (name: string, amount: number) => void;
  onExtendTime?: (seconds: number) => void;
}

// بيانات افتراضية للسيارة
const DEFAULT_CAR_INFO: CarInfo = {
  id: '',
  make: 'تويوتا',
  model: 'كامري',
  year: 2023,
  color: 'أبيض',
  currentPrice: 85000,
};

export default function CarInfoDisplay({ 
  className, 
  onStartAuction, 
  onStopAuction, 
  onUpdateBidder, 
  onExtendTime 
}: CarInfoDisplayProps) {
  // بيانات السيارة
  const [carInfo, setCarInfo] = useState<CarInfo>(DEFAULT_CAR_INFO);
  
  // معلومات المزاد
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 دقائق افتراضية
  const [isActive, setIsActive] = useState(false);
  const [bidderName, setBidderName] = useState('');
  const [bidAmount, setBidAmount] = useState(85000);
  const [minBidIncrement, setMinBidIncrement] = useState(1000);
  const [isEditing, setIsEditing] = useState(false);
  
  // رسائل النظام
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // بدء المزاد
  const startAuction = () => {
    if (!carInfo.id && !carInfo.make) {
      setError('الرجاء إدخال معلومات السيارة أولاً');
      return;
    }
    
    const auctionInfo: AuctionInfo = {
      carInfo,
      timeRemaining,
      endTime: new Date(Date.now() + timeRemaining * 1000),
      minBidIncrement,
      isActive: true,
      highestBidder: bidderName ? {
        name: bidderName,
        amount: bidAmount,
        bidTime: new Date()
      } : undefined
    };
    
    setIsActive(true);
    
    if (onStartAuction) {
      onStartAuction(auctionInfo);
    }
    
    showSuccessMessage('تم بدء المزاد بنجاح');
  };

  // إيقاف المزاد
  const stopAuction = () => {
    setIsActive(false);
    
    if (onStopAuction) {
      onStopAuction();
    }
    
    showSuccessMessage('تم إيقاف المزاد');
  };

  // إضافة مزايدة جديدة
  const addNewBid = () => {
    if (!bidderName) {
      setError('الرجاء إدخال اسم المزايد');
      return;
    }
    
    if (bidAmount <= carInfo.currentPrice) {
      setError('يجب أن يكون مبلغ المزايدة أكبر من السعر الحالي');
      return;
    }
    
    // تحديث السعر الحالي وصاحب أعلى مزايدة
    setCarInfo({
      ...carInfo,
      currentPrice: bidAmount
    });
    
    // استدعاء معالج تحديث المزايد
    if (onUpdateBidder) {
      onUpdateBidder(bidderName, bidAmount);
    }
    
    // إعادة تعيين حقول المزايدة
    setBidAmount(bidAmount + minBidIncrement);
    
    showSuccessMessage(`تم تسجيل مزايدة جديدة: ${bidderName} - ${bidAmount.toLocaleString()} ريال`);
  };

  // زيادة وقت المزاد
  const extendAuctionTime = (seconds: number) => {
    setTimeRemaining(prev => prev + seconds);
    
    if (onExtendTime) {
      onExtendTime(seconds);
    }
    
    showSuccessMessage(`تم تمديد وقت المزاد بمقدار ${seconds} ثانية`);
  };

  // تنسيق الوقت المتبقي (دقائق:ثواني)
  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // عرض رسالة نجاح مؤقتة
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      <h2 className="text-xl font-bold mb-4">معلومات السيارة والمزاد</h2>
      
      {/* عرض الأخطاء إن وجدت */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-4 flex items-start">
          <AlertCircle className="text-red-500 mt-0.5 ml-2 flex-shrink-0 h-5 w-5" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {/* عرض رسالة النجاح إن وجدت */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-md mb-4">
          <p className="text-green-600 text-sm">{successMessage}</p>
        </div>
      )}
      
      {/* معلومات السيارة */}
      <div className="mb-6 border-b pb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-medium">معلومات السيارة</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4 ml-1" />
                حفظ
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 ml-1" />
                تعديل
              </>
            )}
          </button>
        </div>
        
        {isEditing ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الماركة
              </label>
              <input
                type="text"
                value={carInfo.make}
                onChange={(e) => setCarInfo({ ...carInfo, make: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                aria-label="ماركة السيارة"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الموديل
              </label>
              <input
                type="text"
                value={carInfo.model}
                onChange={(e) => setCarInfo({ ...carInfo, model: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                aria-label="موديل السيارة"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                السنة
              </label>
              <input
                type="number"
                value={carInfo.year}
                onChange={(e) => setCarInfo({ ...carInfo, year: parseInt(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                aria-label="سنة الصنع"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اللون
              </label>
              <input
                type="text"
                value={carInfo.color}
                onChange={(e) => setCarInfo({ ...carInfo, color: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                aria-label="لون السيارة"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-y-2">
            <div>
              <span className="text-sm font-medium text-gray-500">الماركة:</span>
              <p className="text-gray-900">{carInfo.make}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500">الموديل:</span>
              <p className="text-gray-900">{carInfo.model}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500">السنة:</span>
              <p className="text-gray-900">{carInfo.year}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500">اللون:</span>
              <p className="text-gray-900">{carInfo.color}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* معلومات المزاد */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-3">معلومات المزاد</h3>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              السعر الحالي (ريال)
            </label>
            <input
              type="number"
              value={carInfo.currentPrice}
              onChange={(e) => setCarInfo({ ...carInfo, currentPrice: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              disabled={isActive}
              aria-label="السعر الحالي"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الحد الأدنى للزيادة (ريال)
            </label>
            <input
              type="number"
              value={minBidIncrement}
              onChange={(e) => setMinBidIncrement(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              disabled={isActive}
              aria-label="الحد الأدنى للزيادة"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              مدة المزاد (ثانية)
            </label>
            <input
              type="number"
              value={timeRemaining}
              onChange={(e) => setTimeRemaining(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              disabled={isActive}
              min="60"
              max="1800"
              aria-label="مدة المزاد بالثواني"
            />
          </div>
          
          <div className="flex items-end">
            <div className={`p-2 text-center font-bold rounded-md w-full text-xl ${
              isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {formatTimeRemaining(timeRemaining)}
            </div>
          </div>
        </div>
        
        {/* أزرار التحكم بوقت المزاد */}
        {isActive && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => extendAuctionTime(30)}
              className="flex-1 flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
              aria-label="تمديد وقت المزاد 30 ثانية"
            >
              <Clock className="h-4 w-4 ml-1" />
              +30 ثانية
            </button>
            
            <button
              onClick={() => extendAuctionTime(60)}
              className="flex-1 flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
              aria-label="تمديد وقت المزاد دقيقة"
            >
              <Clock className="h-4 w-4 ml-1" />
              +1 دقيقة
            </button>
            
            <button
              onClick={() => extendAuctionTime(300)}
              className="flex-1 flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
              aria-label="تمديد وقت المزاد 5 دقائق"
            >
              <Clock className="h-4 w-4 ml-1" />
              +5 دقائق
            </button>
          </div>
        )}
        
        {/* أزرار بدء/إيقاف المزاد */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={startAuction}
            disabled={isActive}
            className="flex-1 flex items-center justify-center p-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="بدء المزاد"
          >
            <Clock className="h-4 w-4 ml-1" />
            بدء المزاد
          </button>
          
          <button
            onClick={stopAuction}
            disabled={!isActive}
            className="flex-1 flex items-center justify-center p-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="إيقاف المزاد"
          >
            <Clock className="h-4 w-4 ml-1" />
            إيقاف المزاد
          </button>
        </div>
      </div>
      
      {/* مزايدات جديدة */}
      <div>
        <h3 className="text-md font-medium mb-3">تسجيل مزايدة جديدة</h3>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اسم المزايد
            </label>
            <input
              type="text"
              value={bidderName}
              onChange={(e) => setBidderName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              placeholder="أدخل اسم المزايد"
              aria-label="اسم المزايد"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              مبلغ المزايدة (ريال)
            </label>
            <div className="flex">
              <button
                onClick={() => setBidAmount(prev => prev - minBidIncrement)}
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300"
                aria-label="تقليل مبلغ المزايدة"
              >
                <Minus className="h-4 w-4" />
              </button>
              
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(parseInt(e.target.value))}
                className="flex-1 p-2 border-t border-b border-gray-300 text-center"
                aria-label="مبلغ المزايدة"
              />
              
              <button
                onClick={() => setBidAmount(prev => prev + minBidIncrement)}
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded-l-md hover:bg-gray-300"
                aria-label="زيادة مبلغ المزايدة"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        <button
          onClick={addNewBid}
          disabled={!isActive}
          className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="تسجيل المزايدة"
        >
          تسجيل المزايدة
        </button>
      </div>
    </div>
  );
} 