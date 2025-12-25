"use client";

import api from "@/lib/axios";
import { useState, useEffect, use } from "react";
import { CheckCircle, Car, SaudiRiyal, CreditCard, Truck, FileText } from "lucide-react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";


export default function ConfirmPurchasePage({ params }: { params: Promise<{ auction_id: string }> }) {
  const router = useLoadingRouter();
  
  const roundToNearest5or0 = (number: number): number => {
    return Math.round(number / 5) * 5;
  };

  const { auction_id } = use(params);
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastBid, setLastBid] = useState(0);
  const [item, setItem] = useState(null);
  const [formData, setFormData] = useState({
    auction_id: null,
    user_id: null,
  });
  const [isChecked, setIsChecked] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

  const handleConfirmPurchase = async () => {
    console.log("handleConfirmPurchase");
    
    if (item?.id) {
      try {
        const response = await api.post('/api/auctions/confirm-purchase', {
          auction_id: item.id,
          final_price: totalAmount,
          payment_method: paymentMethod
        });
        
        if (response.data.success) {
          // Redirect to payment page
          router.push(`/payment/process/${item.id}?amount=${totalAmount}&method=${paymentMethod}`);
        }
      } catch (error) {
        console.error('Error confirming purchase:', error);
        alert('حدث خطأ في تأكيد الشراء. يرجى المحاولة مرة أخرى.');
      }
      console.log(`Purchase confirmed for auction ID: ${item.id}, Total amount: ${totalAmount} SAR`);
    }
  };
  useEffect(() => {
    async function fetchAuctionData() {
      console.log("auction_id", auction_id);
      try {
        const response = await api.get(`/api/auctions/purchase-confirmation/${auction_id}`);
        if (response.data.data || response.data.data) {
          const auctionData = response.data.data.data || response.data.data;
          setCar(auctionData.auction.car);
          
          setLastBid(
            roundToNearest5or0(auctionData.auction.current_bid || 0)
          );
          // Handle API data structure
          setItem(auctionData);

          // Set form data with auction information
          setFormData((prev) => ({
            ...prev,
            auction_id: auctionData.id,
            user_id: null, // Will be set from auth context
          }));
        }
      } catch (error) {
        console.error("Error fetching auction data:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    fetchAuctionData();
  }, [auction_id]);
  // Handle loading state


  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-xl text-red-600">خطأ في تحميل بيانات السيارة. يرجى المحاولة مرة أخرى.</div>
      </div>
    );
  }

  // Handle case where item is not loaded
  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-xl text-gray-600">لم يتم العثور على بيانات السيارة.</div>
      </div>
    );
  }

  // Calculate financial details for buyer
  const auctionPrice = Number(item?.auction_price|| 0);
  const platformFee = item?.platformFee || 0;
  const muroorFee = item?.muroorFee || 0;
  
  const tamFee = item?.tamFee || 0;

  const totalFees = platformFee + muroorFee + tamFee;
  const totalAmount = item?.net_amount || auctionPrice + totalFees;
  
  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            تأكيد عملية الشراء
          </h1>
          <p className="text-lg text-gray-600">
            يرجى مراجعة جميع التفاصيل قبل إتمام عملية الشراء والانتقال إلى الدفع
          </p>
        </div>

        {/* Deal Summary Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            {/* Car Image */}
            <div className="flex-shrink-0">
              <img
                src={car?.images?.[0] || '/placeholder-car.jpg'}
                alt={`${car?.make} ${car?.model}`}
                className="w-48 h-32 object-cover rounded-lg"
              />
              <h5 className="text-lg font-bold text-gray-900 mt-2">{car?.make} {car?.model} {car?.year}</h5>
            </div>
            
            {/* Car Details */}
            <div className="flex-grow text-center lg:text-right">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {car?.make} {car?.model} {car?.year}
              </h2>
              <div className="space-y-2">
                <div className="text-lg text-gray-600">
                  <span className="font-medium">سعر المزاد الفائز:</span>
                  <span className="text-2xl font-bold text-blue-600 mr-2 flex items-center gap-1">
                    {auctionPrice.toLocaleString()}
                    <SaudiRiyal className="w-5 h-5" />
                  </span>
                </div>
                <div className="text-xl">
                  <span className="font-medium text-gray-700">المبلغ الإجمالي المطلوب:</span>
                  <span className="text-3xl font-bold text-green-600 mr-2 flex items-center gap-1">
                    {totalAmount.toLocaleString()}
                    <SaudiRiyal className="w-6 h-6" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Breakdown Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            التفصيل المالي
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-lg font-medium text-gray-700">سعر المزاد الفائز</span>
              <span className="text-lg font-bold text-gray-900 flex items-center gap-1">
                {auctionPrice.toLocaleString()}
                <SaudiRiyal className="w-4 h-4" />
              </span>
            </div>
            
            <div className="text-lg font-medium text-orange-600 mb-2">الرسوم الإضافية:</div>
            
            <div className="flex justify-between items-center py-2 pr-4">
              <span className="text-gray-600">رسوم المنصة</span>
              <span className="text-orange-600 font-medium flex items-center gap-1">
                + {platformFee.toLocaleString()}
                <SaudiRiyal className="w-4 h-4" />
              </span>
            </div>

            <div className="flex justify-between items-center py-2 pr-4">
              <span className="text-gray-600">رسوم المرور</span>
              <span className="text-orange-600 font-medium flex items-center gap-1">
                + {muroorFee.toLocaleString()}
                <SaudiRiyal className="w-4 h-4" />
              </span>
            </div>

            <div className="flex justify-between items-center py-2 pr-4">
              <span className="text-gray-600">رسوم تم (شركة علم)</span>
              <span className="text-orange-600 font-medium flex items-center gap-1">
                + {tamFee.toLocaleString()}
                <SaudiRiyal className="w-4 h-4" />
              </span>
            </div>
            <div className="flex justify-between items-center py-2 pr-4">
              <span className="text-gray-600">رسوم نقل الملكية</span>
              <span className="text-orange-600 font-medium flex items-center gap-1">
                + {200}
                <SaudiRiyal className="w-4 h-4" />
              </span>
            </div>
            
            
            <div className="flex justify-between items-center py-2 border-b border-gray-300">
              <span className="text-lg font-medium text-gray-700">إجمالي الرسوم الإضافية</span>
              <span className="text-lg font-bold text-orange-600 flex items-center gap-1">
                + {totalFees.toLocaleString()}
                <SaudiRiyal className="w-4 h-4" />
              </span>
            </div>
            
            <div className="flex justify-between items-center py-4 bg-blue-50 rounded-lg px-4">
              <span className="text-xl font-bold text-gray-900">المبلغ الإجمالي المطلوب</span>
              <span className="text-2xl font-bold text-blue-600 flex items-center gap-1">
                {totalAmount.toLocaleString()}
                <SaudiRiyal className="w-5 h-5" />
              </span>
            </div>
          </div>
        </div>

        {/* What Happens Next Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            ما يحدث بعد تأكيد الشراء
          </h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <CreditCard className="text-blue-600 w-6 h-6 mt-1" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  الخطوة الأولى: معالجة الدفع
                </h4>
                <p className="text-gray-600">
                  سيتم توجيهك إلى صفحة الدفع الآمنة لإتمام عملية الشراء. 
                  يمكنك الدفع باستخدام بطاقة الائتمان أو التحويل البنكي.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <FileText className="text-green-600 w-6 h-6 mt-1" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  الخطوة الثانية: نقل الملكية
                </h4>
                <p className="text-gray-600">
                  بعد تأكيد الدفع، سنقوم بمعالجة نقل الملكية إلكترونياً من خلال نظام "تام". 
                  ستحصل على إشعار بمجرد اكتمال العملية.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Truck className="text-orange-600 w-6 h-6 mt-1" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  الخطوة الثالثة: استلام السيارة
                </h4>
                <p className="text-gray-600">
                  سيتم التنسيق معك لتوصيل السيارة إلى الموقع المحدد، أو يمكنك استلامها من المعرض. 
                  سيتم إجراء فحص نهائي قبل التسليم.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            طريقة الدفع المفضلة
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                paymentMethod === 'credit_card' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setPaymentMethod('credit_card')}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="credit_card"
                  checked={paymentMethod === 'credit_card'}
                  onChange={() => setPaymentMethod('credit_card')}
                  className="text-blue-600"
                />
                <CreditCard className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">بطاقة ائتمان</h4>
                  <p className="text-sm text-gray-600">دفع فوري وآمن</p>
                </div>
              </div>
            </div>

            {/* <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                paymentMethod === 'bank_transfer' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setPaymentMethod('bank_transfer')}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={() => setPaymentMethod('bank_transfer')}
                  className="text-blue-600"
                />
                <SaudiRiyal className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">تحويل بنكي</h4>
                  <p className="text-sm text-gray-600">معالجة خلال 1-2 أيام عمل</p>
                </div>
              </div>
            </div> */}

          </div>
        </div>

        {/* Final Agreement & Confirmation Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            تأكيد الشراء والانتقال للدفع
          </h3>
          
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>المبلغ الإجمالي:</span>
                <span className="text-blue-600 flex items-center gap-1">
                  {totalAmount.toLocaleString()}
                  <SaudiRiyal className="w-5 h-5" />
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agreement"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="agreement" className="text-gray-700 text-lg leading-relaxed">
                لقد راجعت جميع التفاصيل المالية وأوافق على الشروط والأحكام 
                لإتمام هذا الشراء. أتفهم تفصيل الرسوم وأؤكد 
                المبلغ الإجمالي المطلوب للدفع وأن جميع المعلومات صحيحة.
              </label>
            </div>
            
            <button
              onClick={handleConfirmPurchase}
              disabled={!isChecked}
              className={`w-full py-4 px-6 rounded-lg text-xl font-bold transition-all duration-200 ${
                isChecked
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <CreditCard className="w-6 h-6" />
                تأكيد الشراء والانتقال للدفع
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
