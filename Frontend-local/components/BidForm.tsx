/**
 * 🧩 نموذج المزايدة
 * 📁 المسار: Frontend-local/components/BidForm.tsx
 *
 * ✅ الوظيفة:
 * - عرض نموذج لتقديم مزايدة على سيارة
 * - أزرار سريعة للمبالغ الشائعة
 * - إمكانية إدخال مبلغ مخصص
 * - ارسال المزايدة إلى API
 */

'use client';

import React, { useState, useEffect } from 'react';

interface BidFormProps {
  itemId: number;
  currentPrice: number;
  onSuccess?: () => void;
}

export default function BidForm({ itemId, currentPrice, onSuccess }: BidFormProps) {
  const [bidAmount, setBidAmount] = useState<number | string>(currentPrice + 1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const quickBidOptions = [
    { label: '+100', value: 100 },
    { label: '+300', value: 300 },
    { label: '+500', value: 500 },
    { label: '+750', value: 750 },
    { label: '+1000', value: 1000 },
  ];

  const selectQuickBid = (increment: number) => {
    const newBid = currentPrice + increment;
    setBidAmount(newBid);
    setCustomAmount(newBid.toString());
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '') {
      setCustomAmount('');
      setBidAmount('');
      return;
    }
    
    // تنظيف الإدخال من الفواصل والأحرف غير الرقمية
    const cleanValue = value.replace(/[^0-9]/g, '');
    
    if (cleanValue) {
      const numValue = parseInt(cleanValue);
      setCustomAmount(numValue.toLocaleString());
      setBidAmount(numValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericBid = typeof bidAmount === 'string' 
      ? parseInt(bidAmount.replace(/,/g, '')) 
      : bidAmount;
    
    // التحقق من المبلغ
    if (!numericBid || isNaN(numericBid)) {
      setError('الرجاء إدخال مبلغ صحيح');
      return;
    }
    
    if (numericBid <= currentPrice) {
      setError(`يجب أن يكون المبلغ أكبر من ${currentPrice.toLocaleString()} ريال`);
      return;
    }
    
    // مسح أي أخطاء سابقة
    setError(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          amount: numericBid
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('تم تقديم المزايدة بنجاح!');
        // إعادة تعيين النموذج
        setBidAmount(currentPrice + 1000);
        setCustomAmount('');
        
        // استدعاء callback النجاح إن وجد
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.message || 'حدث خطأ أثناء تقديم المزايدة');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم - يرجى المحاولة مرة أخرى لاحقًا');
      console.error('خطأ في تقديم المزايدة:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded shadow-sm border border-gray-200">
      <div className="p-4">
        <h3 className="text-center font-semibold mb-3">قدم مزايدتك عبر الإنترنت</h3>
        
        <form onSubmit={handleSubmit}>
          {/* أزرار المزايدة السريعة */}
          <div className="flex justify-between mb-3 gap-1">
            {quickBidOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => selectQuickBid(option.value)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs py-1 px-2 rounded-md flex-1 border border-gray-300"
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* حقل المبلغ المخصص */}
          <div className="mb-3">
            <input
              type="text"
              value={customAmount}
              onChange={handleCustomAmountChange}
              placeholder={`أدخل مبلغ أعلى من ${currentPrice.toLocaleString()} ريال`}
              className="w-full border border-gray-300 p-2.5 rounded text-center text-gray-600"
            />
          </div>
          
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 text-green-600 rounded text-sm">
              {success}
            </div>
          )}
          
          {/* زر تأكيد المزايدة */}
          <button
            type="submit"
            disabled={isSubmitting || !bidAmount || Number(bidAmount) <= currentPrice}
            className={`w-full py-2.5 rounded text-white font-medium ${
              isSubmitting || !bidAmount || Number(bidAmount) <= currentPrice
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isSubmitting ? 'جاري التقديم...' : 'تأكيد المزايدة'}
          </button>
        </form>
      </div>
    </div>
  );
} 