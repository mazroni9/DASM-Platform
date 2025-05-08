/**
 * 🧩 نموذج المزايدة
 * 📁 المسار: Frontend-local/components/BidForm.tsx
 *
 * ✅ الوظيفة:
 * - عرض نموذج لتقديم مزايدة على سيارة
 * - أزرار سريعة للمبالغ الشائعة
 * - إمكانية إدخال مبلغ مخصص
 * - ارسال المزايدة إلى API
 * - نظام المزايدة التلقائية
 */

'use client';

import React, { useState, useEffect } from 'react';
import { formatMoney } from '@/app/lib/format-utils';

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
  
  // إعدادات المزايدة التلقائية
  const [showAutoBid, setShowAutoBid] = useState(false);
  const [isAutoBidEnabled, setIsAutoBidEnabled] = useState(false);
  const [autoBidIncrement, setAutoBidIncrement] = useState(200);
  const [autoBidMaximum, setAutoBidMaximum] = useState(currentPrice + 5000);
  
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
      setCustomAmount(formatMoney(numValue));
      setBidAmount(numValue);
    }
  };
  
  // معالجة تغيير قيمة الزيادة التلقائية
  const handleAutoBidIncrementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      // التأكد من أن قيمة الزيادة لا تقل عن 200 ريال
      setAutoBidIncrement(Math.max(200, value));
    }
  };
  
  // معالجة تغيير الحد الأقصى للمزايدة التلقائية
  const handleAutoBidMaximumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setAutoBidMaximum(value);
    }
  };
  
  // تفعيل/إلغاء تفعيل المزايدة التلقائية
  const toggleAutoBid = () => {
    // إذا كان المستخدم يرغب في تفعيل المزايدة التلقائية
    if (!isAutoBidEnabled) {
      // التحقق من أن الإعدادات صحيحة
      if (autoBidIncrement < 200) {
        setError('يجب أن تكون الزيادة التلقائية 200 ريال على الأقل');
        return;
      }
      
      if (autoBidMaximum <= currentPrice) {
        setError('يجب أن يكون الحد الأقصى أكبر من السعر الحالي');
        return;
      }
      
      // تفعيل المزايدة التلقائية
      setIsAutoBidEnabled(true);
      setSuccess('تم تفعيل المزايدة التلقائية بنجاح');
      
      // هنا يمكن إرسال إعدادات المزايدة التلقائية إلى الخادم
      saveAutoBidSettings();
    } else {
      // إلغاء تفعيل المزايدة التلقائية
      setIsAutoBidEnabled(false);
      setSuccess('تم إلغاء تفعيل المزايدة التلقائية');
      
      // هنا يمكن حذف إعدادات المزايدة التلقائية من الخادم
      deleteAutoBidSettings();
    }
  };
  
  // حفظ إعدادات المزايدة التلقائية
  const saveAutoBidSettings = async () => {
    try {
      const response = await fetch('/api/auto-bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          increment: autoBidIncrement,
          maximum: autoBidMaximum
        }),
      });
      
      if (!response.ok) {
        setError('لم يتم حفظ إعدادات المزايدة التلقائية. الرجاء المحاولة مرة أخرى.');
        setIsAutoBidEnabled(false);
      }
    } catch (err) {
      setError('تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.');
      setIsAutoBidEnabled(false);
      console.error('خطأ في حفظ إعدادات المزايدة التلقائية:', err);
    }
  };
  
  // حذف إعدادات المزايدة التلقائية
  const deleteAutoBidSettings = async () => {
    try {
      const response = await fetch(`/api/auto-bid?itemId=${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        setError('حدث خطأ أثناء إلغاء المزايدة التلقائية');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
      console.error('خطأ في إلغاء المزايدة التلقائية:', err);
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
      setError(`يجب أن يكون المبلغ أكبر من ${formatMoney(currentPrice)} ريال`);
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
        setSuccess('تم تقديم العرض بنجاح!');
        // إعادة تعيين النموذج
        setBidAmount(currentPrice + 1000);
        setCustomAmount('');
        
        // استدعاء callback النجاح إن وجد
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.message || 'حدث خطأ أثناء تقديم العرض');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم - يرجى المحاولة مرة أخرى لاحقًا');
      console.error('خطأ في تقديم العرض:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded shadow-sm border border-gray-200">
      <div className="p-4">
        <h3 className="text-center font-semibold mb-3">قدم عرضك</h3>
        
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
          
          {/* التصميم الجديد: مربعان متساويان */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* حقل إدخال المبلغ - مربع أول متساوي */}
            <div className="col-span-1">
              <input
                type="text"
                value={customAmount}
                onChange={handleCustomAmountChange}
                placeholder={`أدخل مبلغ أعلى من ${formatMoney(currentPrice)} ريال`}
                className="w-full border border-gray-300 p-2.5 rounded text-center text-gray-600 h-full"
              />
            </div>
            
            {/* زر تأكيد المزايدة - مربع ثاني متساوي */}
            <button
              type="submit"
              disabled={isSubmitting || !bidAmount || Number(bidAmount) <= currentPrice}
              className={`h-full py-2.5 rounded text-white font-medium ${
                isSubmitting || !bidAmount || Number(bidAmount) <= currentPrice
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              تأكيد
            </button>
          </div>
          
          {error && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-600 rounded text-sm flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 text-green-600 rounded text-sm">
              {success}
            </div>
          )}
          
          {/* زر عرض/إخفاء إعدادات المزايدة التلقائية */}
          <div className="mt-4 mb-2">
            <button
              type="button"
              onClick={() => setShowAutoBid(!showAutoBid)}
              className="w-full text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-sm py-2 rounded-md flex items-center justify-center"
            >
              <span>{showAutoBid ? 'إخفاء' : 'عرض'} إعدادات المزايدة التلقائية</span>
              <svg
                className={`w-4 h-4 mr-1 transition-transform duration-200 ${showAutoBid ? 'transform rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* قسم المزايدة التلقائية (يظهر عند النقر على الزر) */}
          {showAutoBid && (
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mt-1 mb-2">
              {!isAutoBidEnabled ? (
                <>
                  <h4 className="text-blue-900 font-semibold text-sm mb-3">إعدادات المزايدة التلقائية</h4>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-blue-900 mb-1">مقدار الزيادة التلقائية (ريال)</label>
                        <input
                          type="number"
                          min="200"
                          step="50"
                          value={autoBidIncrement}
                          onChange={handleAutoBidIncrementChange}
                          className="w-full p-2 text-sm border border-blue-200 rounded"
                          disabled={isAutoBidEnabled}
                        />
                        <p className="text-xs text-blue-700 mt-1">الحد الأدنى 200 ريال</p>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-blue-900 mb-1">الحد الأقصى للمزايدة (ريال)</label>
                        <input
                          type="number"
                          min={currentPrice + 1}
                          step="1000"
                          value={autoBidMaximum}
                          onChange={handleAutoBidMaximumChange}
                          className="w-full p-2 text-sm border border-blue-200 rounded"
                          disabled={isAutoBidEnabled}
                        />
                        <p className="text-xs text-blue-700 mt-1">يجب أن يكون أكبر من السعر الحالي</p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-blue-800 leading-relaxed">
                      <p>سيقوم النظام بالمزايدة تلقائياً لصالحك عند وصول سعر المزاد إلى سعر معين بزيادة {formatMoney(autoBidIncrement)} ريال لكل مزايدة، حتى الوصول للحد الأقصى {formatMoney(autoBidMaximum)} ريال.</p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={toggleAutoBid}
                      className="w-full py-2 rounded text-white mt-2 bg-blue-500 hover:bg-blue-600"
                    >
                      تفعيل المزايدة التلقائية
                    </button>
                  </div>
                </>
              ) : (
                // عرض مختصر بعد تفعيل المزايدة التلقائية
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-900">المزايدة التلقائية تعمل حالياً</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleAutoBid}
                    className="text-sm text-white bg-red-500 hover:bg-red-600 py-1.5 px-3 rounded"
                  >
                    إيقاف
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}