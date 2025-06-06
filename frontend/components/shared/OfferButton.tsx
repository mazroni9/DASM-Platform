'use client';

import { useState } from 'react';

interface OfferButtonProps {
  initialPrice: string | number;
  onSubmit: (amount: number) => void;
  isProcessing?: boolean;
  minIncrement?: number;
  buttonText?: string;
  incrementOptions?: number[];
}

export default function OfferButton({
  initialPrice,
  onSubmit,
  isProcessing = false,
  minIncrement = 1000,
  buttonText = 'قدم عرضك',
  incrementOptions = [1000, 5000, 10000, 50000, 100000]
}: OfferButtonProps) {
  const [amount, setAmount] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // تحويل السعر الأولي إلى رقم
  const initialPriceNumber = typeof initialPrice === 'string' 
    ? parseInt(initialPrice.replace(/,/g, '')) 
    : initialPrice;

  const handleSubmit = () => {
    const offerAmount = parseInt(amount.replace(/,/g, ''));
    
    if (isNaN(offerAmount) || offerAmount <= initialPriceNumber) {
      alert('يجب أن يكون العرض أعلى من السعر الحالي');
      return;
    }
    
    onSubmit(offerAmount);
  };

  const applyIncrement = (increment: number) => {
    const newAmount = initialPriceNumber + increment;
    setAmount(newAmount.toLocaleString());
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    
    // إذا كان الزر لم يكن مرئياً من قبل، نضع قيمة ابتدائية
    if (!isVisible && !amount) {
      const newAmount = initialPriceNumber + minIncrement;
      setAmount(newAmount.toLocaleString());
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 p-4">
        {buttonText}
      </h3>
      
      {isVisible ? (
        <div className="p-4">
          <div className="mb-4">
            <div className="flex justify-between text-gray-600 mb-2">
              <span>السعر الحالي:</span>
              <span className="font-semibold">{typeof initialPrice === 'string' ? initialPrice : initialPrice.toLocaleString()} ريال</span>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="offerAmount" className="block text-gray-700 mb-2">
              قيمة العرض (ريال)
            </label>
            <input
              type="text"
              id="offerAmount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`أكثر من ${typeof initialPrice === 'string' ? initialPrice : initialPrice.toLocaleString()} ريال`}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
              required
            />
          </div>

          <div className="mb-4">
            <div className="text-gray-700 mb-2">زيادة سريعة</div>
            <div className="flex flex-wrap gap-2">
              {incrementOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => applyIncrement(option)}
                  className="px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-full text-sm"
                >
                  + {option.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`flex-1 py-3 rounded-lg font-medium ${
                isProcessing
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              } transition-colors`}
            >
              {isProcessing ? 'جاري المعالجة...' : 'تأكيد العرض'}
            </button>
            
            <button
              type="button"
              onClick={toggleVisibility}
              className="py-3 px-4 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t">
          <button
            type="button"
            onClick={toggleVisibility}
            className="w-full py-3 rounded-lg font-medium bg-orange-600 hover:bg-orange-700 text-white transition-colors"
          >
            {buttonText}
          </button>
        </div>
      )}
    </div>
  );
} 