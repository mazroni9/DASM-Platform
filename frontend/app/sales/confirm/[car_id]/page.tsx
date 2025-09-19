"use client";

import api from "@/lib/axios";
import { useState, useEffect,use } from "react";
import { CheckCircle, Car, SaudiRiyal, Settings } from "lucide-react";

export default function ConfirmSalePage({ params }) {
  const roundToNearest5or0 = (number: number): number => {
    return Math.round(number / 5) * 5;
  };

  const {car_id}  = use(params);
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

  const handleConfirmSale = async () => {
    console.log("handleConfirmSale");
    
    if (item?.active_auction) {
      try {
        const response = await api.post('/api/auctions/confirm-sale', {
          auction_id: item.active_auction.id,
          final_price: item.active_auction.current_bid
        });
        
        if (response.data.success) {
          // Handle successful confirmation
          alert('تم تأكيد البيع بنجاح!');
        }
      } catch (error) {
        console.error('Error confirming sale:', error);
        alert('حدث خطأ في تأكيد البيع. يرجى المحاولة مرة أخرى.');
      }
      console.log(`Sale confirmed for auction ID: ${item.active_auction.id}, Final price: ${item.active_auction.current_bid} SAR`);
    }
  };
  useEffect(() => {
    async function fetchCarData() {
      console.log("car_id",car_id);
      try {
        const response = await api.get(`/api/car/${car_id}`);
        if (response.data.data || response.data.data) {
          const carsData = response.data.data.data || response.data.data;
          setCar(carsData.car);
          
          setLastBid(
            roundToNearest5or0(carsData.active_auction?.current_bid || 0) + 100
          );
          // تعامل مع هيكل البيانات من API
          setItem(carsData);

          // Check if car has an active auction before setting auction_id
          if (carsData.active_auction && carsData.active_auction.id) {
            setFormData((prev) => ({
              ...prev,
              auction_id: carsData.active_auction.id,
              user_id: null, // Remove reference to undefined 'user'
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              user_id: null, // Remove reference to undefined 'user'
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching car data:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    fetchCarData();
  }, [car_id]);


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

  // Calculate financial details
  const finalSalePrice = item.active_auction?.current_bid || 0;
  //const platformFee = Math.round(finalSalePrice * 0.025); // 2.5%
  const platformFee = Math.round(350); 
  const ownershipTransferFee = 50; // Fixed 300 SAR
  const totalDeductions = platformFee + ownershipTransferFee;
  const netAmount = finalSalePrice - totalDeductions;

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            مراجعة وتأكيد البيع
          </h1>
          <p className="text-lg text-gray-600">
            يرجى مراجعة جميع التفاصيل قبل إتمام بيع سيارتك
          </p>
        </div>

        {/* Deal Summary Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            {/* Car Image */}
            <div className="flex-shrink-0">
            <h5 className="text-lg font-bold text-gray-900 mt-2">{car.make} {car.model} {car.year}</h5>
              <img
                src={car.images?.[0] || '/placeholder-car.jpg'}
                alt={`${car.make} ${car.model}`}
                className="w-48 h-32 object-cover rounded-lg"
              />
              
            </div>
            
            {/* Car Details */}
            <div className="flex-grow text-center lg:text-right">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {item.make} {item.model} {item.year}
              </h2>
              <div className="space-y-2">
                <div className="text-lg text-gray-600">
                  <span className="font-medium">سعر البيع النهائي:</span>
                  <span className="text-2xl font-bold text-blue-600 mr-2 flex items-center gap-1">
                    {finalSalePrice.toLocaleString()}
                    <SaudiRiyal className="w-5 h-5" />
                  </span>
                </div>
                <div className="text-xl">
                  <span className="font-medium text-gray-700">المبلغ الصافي لك:</span>
                  <span className="text-3xl font-bold text-green-600 mr-2 flex items-center gap-1">
                    {netAmount.toLocaleString()}
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
              <span className="text-lg font-medium text-gray-700">سعر البيع النهائي</span>
              <span className="text-lg font-bold text-gray-900 flex items-center gap-1">
                {finalSalePrice.toLocaleString()}
                <SaudiRiyal className="w-4 h-4" />
              </span>
            </div>
            
            <div className="text-lg font-medium text-red-600 mb-2">الخصومات:</div>
            
            <div className="flex justify-between items-center py-2 pr-4">
              <span className="text-gray-600">رسوم المنصة</span>
              <span className="text-red-600 font-medium flex items-center gap-1">
                - {platformFee.toLocaleString()}
                <SaudiRiyal className="w-4 h-4" />
              </span>
            </div>

            <div className="flex justify-between items-center py-2 pr-4">
              <span className="text-gray-600">عمولة المعرض</span>
              <span className="text-red-600 font-medium flex items-center gap-1">
                - 150
                <SaudiRiyal className="w-4 h-4" />
              </span>
            </div>

            <div className="flex justify-between items-center py-2 pr-4">
              <span className="text-gray-600">عمولة المرور</span>
              <span className="text-red-600 font-medium flex items-center gap-1">
                - 150
                <SaudiRiyal className="w-4 h-4" />
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 pr-4 border-b border-gray-200">
              <span className="text-gray-600">رسوم نقل الملكية (تام)</span>
              <span className="text-red-600 font-medium flex items-center gap-1">
                - {ownershipTransferFee.toLocaleString()}
                <SaudiRiyal className="w-4 h-4" />
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-300">
              <span className="text-lg font-medium text-gray-700">إجمالي الخصومات</span>
              <span className="text-lg font-bold text-red-600 flex items-center gap-1">
                - {totalDeductions.toLocaleString()}
                <SaudiRiyal className="w-4 h-4" />
              </span>
            </div>
            
            <div className="flex justify-between items-center py-4 bg-green-50 rounded-lg px-4">
              <span className="text-xl font-bold text-gray-900">المبلغ الصافي المستحق لك</span>
              <span className="text-2xl font-bold text-green-600 flex items-center gap-1">
                {netAmount.toLocaleString()}
                <SaudiRiyal className="w-5 h-5" />
              </span>
            </div>
          </div>
        </div>

        {/* What Happens Next Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            ما يحدث بعد ذلك
          </h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Settings className="text-blue-600 w-6 h-6 mt-1" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  الخطوة الأولى: نقل الملكية
                </h4>
                <p className="text-gray-600">
                  سيتم معالجة نقل الملكية إلكترونياً من خلال نظام "تام". 
                  هذا يضمن نقل ملكية آمن وقانوني للمشتري.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Car className="text-green-600 w-6 h-6 mt-1" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  الخطوة الثانية: تسليم السيارة
                </h4>
                <p className="text-gray-600">
                  يرجى تسليم سيارتك إلى معرض الشريك المخصص لدينا. 
                  سيقوم فريقنا بفحص المركبة والتعامل مع عملية التسليم مع المشتري.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <SaudiRiyal className="text-yellow-600 w-6 h-6 mt-1" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  الخطوة الثالثة: استلام الدفعة
                </h4>
                <p className="text-gray-600">
                  المبلغ الصافي البالغ {netAmount.toLocaleString()} <SaudiRiyal className="inline w-4 h-4 mx-1" /> سيتم تحويله إلى حسابك 
                  خلال 24-48 ساعة بعد تأكيد معرضنا استلام السيارة.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Final Agreement & Confirmation Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            التأكيد النهائي
          </h3>
          
          <div className="space-y-6">
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
                لإتمام هذا البيع. أتفهم تفصيل الخصومات وأؤكد 
                المبلغ الصافي المستحق لي.
              </label>
            </div>
            
            <button
              onClick={handleConfirmSale}
              disabled={!isChecked}
              className={`w-full py-4 px-6 rounded-lg text-xl font-bold transition-all duration-200 ${
                isChecked
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <CheckCircle className="w-6 h-6" />
                تأكيد البيع النهائي واستلام الدفعة
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
