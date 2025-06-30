/**
 * 📝 صفحة تفاصيل السيارة بمعرف محدد
 * 📁 المسار: Frontend-local/app/carDetails/[id]/page.tsx
 *
 * ✅ الوظيفة:
 * - عرض تفاصيل السيارة عند توفر معرف صحيح
 * - توجيه المستخدم لإضافة سيارة جديدة في حالة عدم وجود بيانات
 * 
 * 🔄 الارتباط:
 * - يستخدم مكون: @/components/CarDataEntryButton
 */

'use client';

// ✅ صفحة عرض المزاد الصامت مع رابط للتفاصيل السيارة
// المسار: /pages/silent/page.tsx

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Car, AlertCircle, CheckCircle2 } from 'lucide-react';
import CarDataEntryButton from '@/components/CarDataEntryButton';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ImageGallery from '@/components/shared/ImageGallery';

// تعريف دالة getCurrentAuctionType محلياً لتفادي مشاكل الاستيراد
function getCurrentAuctionType(): string {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 16 && hour < 19) {
    return 'live'; // الحراج المباشر
  } else if (hour >= 19 && hour < 22) {
    return 'immediate'; // السوق الفوري
  } else {
    return 'late'; // السوق المتأخر
  }
}

interface BidingData {
  auction_id:number;
  user_id: number;
  bid_amount: number;
}
let bidingData={
  auction_id:0,
  user_id: 0,
  bid_amount:0
  }

  

export default function CarDetailPage() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastbid,setLastBid]=useState(0);
    const [formData, setFormData] = useState<BidingData>(bidingData);
    const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
 const params = useParams<{ tag: string; item: string }>()
  let carId= params['id'];
  const [isOwner,setIsOwner] = useState(false);


   // التعامل مع تغيير قيم حقول النموذج
    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };
  
      const confirmSubmit =async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    setSubmitResult(null);
    try {
    
      // التحقق من البيانات المدخلة
      const requiredFields = ['bid_amount'];
      for (const field of requiredFields) {
        if (!formData[field as keyof BidingData]) {
          throw new Error(`حقل ${field.replace('_', ' ')} مطلوب`);
        }
      }
      
      formData.bid_amount=roundToNearest5or0(formData.bid_amount);
      // إرسال بيانات السيارة مع روابط الصور والتقارير
         try { 
          
          const response = await api.post('/api/auctions/bid', formData, {
              headers: {
                'Content-Type': 'application/json'
              }
            })

            if (response.data.status === "success") {
                 // تم الحفظ بنجاح
                setSubmitResult({
                  success: true,
                  message: 'تم إضافة  بنجاح'
                });
            // إعادة تعيين النموذج
                 setFormData(bidingData);
                 setTimeout(()=>{
                  window.location.reload();
                 },2000)
            } else {
                toast.error("فشل في إضافة ");
            }
        } catch (error) {
            console.error("Error in adding car user:", error);
             toast.error("فشل في إضافة ");
        }
    
    } catch (error: any) {
      console.error('خطأ في حفظ البيانات:', error);
      setSubmitResult({
        success: false,
        message: error.message || 'حدث خطأ أثناء حفظ البيانات'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // تقديم النموذج
  const handleSubmit =  (e: FormEvent) => {
    e.preventDefault();
   
     setShowConfirm(true);
    
  };

                                    
const roundToNearest5or0 = (number) => {
  return Math.round(number / 5) * 5;
};
    
// Verify user is authenticated
useEffect(() => {
    if (!isLoggedIn) {
        router.push("/auth/login?returnUrl=/dashboard/profile");
    }
  }, [isLoggedIn, router]);
 
     // Fetch user profile data
  useEffect(() => {
       setLoading(true);
      async function fetchAuctions() {
           if (!isLoggedIn) return;
          try {
            
              const response = await api.get(`/api/car/${carId}`);
              if (response.data.data || response.data.data) {
                  const carsData = response.data.data.data || response.data.data;
                  setLastBid(roundToNearest5or0(carsData.active_auction.current_bid)+100);
                    // تعامل مع هيكل البيانات من API
                  setItem(carsData);
                  formData['auction_id']= carsData.active_auction.id
                  formData['user_id']=user.id;
                   let car_user_id = carsData.car.user_id;
                   let current_user_id=user.id;
                   let dealer_user_id = carsData.car.dealer;
                  if(dealer_user_id != null){
                     dealer_user_id = carsData.car.dealer.user_id;
                  }
                  
                  if(current_user_id == car_user_id ){
                    setIsOwner(true);
                  }else if(dealer_user_id == current_user_id){
                      setIsOwner(true);
                  }
              }
          } catch (error) {
               console.error('فشل تحميل بيانات المزاد الصامت', error);
              setItem([]); // مصفوفة فارغة في حالة الفشل
              setError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.");
              setLoading(false);
          } finally {
              setLoading(false);
          }
      }
      fetchAuctions();
  }, []);



  // صفحة التحميل
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">جاري تحميل البيانات...</div>
      </div>
    );
  }

  // صفحة الخطأ - مع إتاحة خيار إضافة سيارة جديدة
  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="flex items-center text-red-600 mb-4">
          <Car className="h-8 w-8 ml-2" />
          <span className="text-2xl font-bold">{error || 'معرف المركبة غير موجود'}</span>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center mt-4">
          <Link 
            href="/auctions" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-4 py-2 text-base rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
          >
            <ChevronRight className="h-5 w-5 ml-1 rtl:rotate-180" />
            <span>العودة إلى المزادات</span>
          </Link>
          <div className="my-4 text-gray-500">أو</div>
          <CarDataEntryButton label="إدخال بيانات سيارتك" variant="primary" />
        </div>
        
        <div className="mt-8 max-w-lg text-center text-gray-600 p-6 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">هل تريد إضافة سيارتك؟</h2>
          <p className="mb-4">
            يمكنك إدخال بيانات سيارتك وإضافة صورها وتقارير فحصها من خلال النموذج المخصص للإضافة.
            بعد الإضافة، ستظهر سيارتك في المزادات المتاحة وفقًا للنظام.
          </p>
          <div className="mt-4">
            <CarDataEntryButton label="إضافة سيارة جديدة الآن" variant="secondary" />
          </div>
        </div>
      </div>
    );
  }


  // عرض بيانات السيارة إذا تم العثور عليها
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* زر العودة */}
        <div className="flex justify-between items-center mb-6">
          <Link 
            href="/auctions" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 text-sm rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
          >
            <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
            <span>العودة إلى المزادات</span>
          </Link>
            { isOwner && (
          <button
            onClick={async () => {
              const type = getCurrentAuctionType();
              const resultText =
                type === 'live'
                  ? 'تم البيع في الحراج المباشر'
                  : type === 'immediate'
                  ? 'تم البيع في السوق الفوري'
                  : 'تم البيع في السوق المتأخر';

              await fetch('/api/items/confirm-sale', {
                method: 'POST',
                body: JSON.stringify({
                  itemId: item.id,
                  result: resultText,
                }),
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              alert(resultText);
            }}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded"
          >
            تأكيد البيع
          </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            {/* رسائل النظام */}
        {submitResult && (
          <div className={`p-4 rounded-md ${submitResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start">
              {submitResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 ml-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 ml-2" />
              )}
              <p className={submitResult.success ? 'text-green-700' : 'text-red-700'}>
                {submitResult.message}
              </p>
            </div>
          </div>
        )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* قسم الصور (يمكن إضافته لاحقاً) */}
            <div className="rounded-lg flex-direction-column items-center">
                            <ImageGallery images={item['car'].images} />
   
            {!isOwner && (
             
             <div className="max-w-md mx-auto bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-2xl border border-gray-200" dir="rtl">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">🚗 قدم عرضك الآن</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="bid_amount" className="block mb-2 text-md font-medium text-gray-700">
            💰 مبلغ العرض (بالريال):
            <p>  يجب ان يكون السعر اعلى من اخر عرض أو أكثر</p>
           
          </label>

          <div className="relative">
            <input
              type="number"
              id="bid_amount"
              name="bid_amount"
              min={lastbid}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 text-lg"
              placeholder="أدخل المبلغ هنا"
              value={formData.bid_amount}
              onChange={handleInputChange}
              required
            />
            <span className="absolute inset-y-0 left-4 flex items-center text-gray-400 text-lg font-bold">﷼</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 text-lg font-semibold shadow-md flex items-center justify-center gap-2"
        >
          إرسال العرض
        </button>
      </form>

      {/* نافذة التأكيد */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">تأكيد الإرسال</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من تقديم هذا العرض بقيمة <strong>{roundToNearest5or0(formData.bid_amount)} ﷼</strong>؟</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
              >
                إلغاء
              </button>
              <button
                onClick={confirmSubmit}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    
    )}
            </div>
            
            {/* بيانات السيارة */}
            <div>
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-2xl font-bold text-blue-600">
                  آخر سعر: {item['active_auction'].current_bid?.toLocaleString() || '-'} ريال
                </p>
                {item['active_auction'].current_bid && (
                  <p className="text-lg text-green-600 mt-2">{item['active_auction'].current_bid}</p>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">الماركة</p>
                    <p className="font-semibold">{item['car'].make}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">الموديل</p>
                    <p className="font-semibold">{item['car'].model}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">سنة الصنع</p>
                    <p className="font-semibold">{item['car'].year}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">رقم اللوحة</p>
                    <p className="font-semibold">{item['car'].plate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">رقم العداد</p>
                    <p className="font-semibold">{item['car'].odometer ?.toLocaleString() || '-'} كم</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">نوع الوقود</p>
                    <p className="font-semibold">{item['car'].engine || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">حالة السيارة</p>
                    <p className="font-semibold">{item['car'].condition || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">لون السيارة</p>
                    <p className="font-semibold">{item['car'].color || '-'}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-gray-500 text-sm mb-2">معلومات المزاد</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">سعر الإفتتاح</p>
                      <p className="font-semibold">{item['active_auction'].minimum_bid ?.toLocaleString() || '-'} ريال</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">أقل سعر</p>
                      <p className="font-semibold">{ item['active_auction'].minimum_bid ?.toLocaleString() || '-'} ريال</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">أعلى سعر</p>
                      <p className="font-semibold">{item['active_auction'].maximum_bid ?.toLocaleString() || '-'} ريال</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">المزايدات المقدمة</p>
                      <p className="font-semibold">{ item['total_bids'] || '0'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
