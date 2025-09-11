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

"use client";

// ✅ صفحة عرض المزاد الصامت مع رابط للتفاصيل السيارة
// المسار: /pages/silent/page.tsx

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import toast from "react-hot-toast";

// تعريف دالة getCurrentAuctionType محلياً لتفادي مشاكل الاستيراد
function getCurrentAuctionType(): string {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 16 && hour < 19) {
        return "live"; // الحراج المباشر
    } else if (hour >= 19 && hour < 22) {
        return "immediate"; // السوق الفوري
    } else {
        return "late"; // السوق المتأخر
    }
}

interface CarData {
    car_id: number;
    user_id: number;
}

export default function CarDetailPage() {
      const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, isLoggedIn } = useAuth();
    const router = useLoadingRouter();
    
    const params = useParams<{ tag: string; item: string }>();
    let carId = params["id"];
    const [isOwner, setIsOwner] = useState(false);

   
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
                const response = await api.get(`/api/cars/${carId}`);
                if (response.data.data || response.data.data) {
                    const carsData = response.data.data.data || response.data.data;
                    // تعامل مع هيكل البيانات من API
                    setItem(carsData);

                    let car_user_id = carsData.car.user_id;
                    let current_user_id = user.id;
                    let dealer_user_id = carsData.car.dealer;
                    if (dealer_user_id != null) {
                        dealer_user_id = carsData.car.dealer.user_id;
                    }

                    if (current_user_id == car_user_id) {
                        setIsOwner(true);
                    } else if (dealer_user_id == current_user_id) {
                        setIsOwner(true);
                    }
                }
            } catch (error) {
                console.error("فشل تحميل بيانات المزاد الصامت", error);
                setItem([]); // مصفوفة فارغة في حالة الفشل
                setError(
                    "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً."
                );
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

        const images = item['car'].images;
        // الصورة الحالية المختارة
            const currentImage = images[selectedImageIndex];
            
            const goToNextImage = () => {
                setSelectedImageIndex((prevIndex) => 
                prevIndex === images.length - 1 ? 0 : prevIndex + 1
                );
            };
                // وظائف التنقل بين الصور
            const goToPreviousImage = () => {
                setSelectedImageIndex((prevIndex) => 
                prevIndex === 0 ? images.length - 1 : prevIndex - 1
                );
            };

    // عرض بيانات السيارة إذا تم العثور عليها
    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
             {/* نافذة عرض الصور المكبرة */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative w-full max-w-4xl mx-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowImageModal(false); }}
              className="absolute top-0 right-0 m-4 text-white text-2xl z-10 hover:text-gray-300"
            >
              ✖
            </button>
            <img 
              src={currentImage} 
              alt={item.title} 
              className="max-w-full max-h-[80vh] mx-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-car.jpg';
              }}
            />
            <div className="absolute inset-x-0 bottom-4 flex justify-center space-x-2 rtl:space-x-reverse">
              {images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                  className={`w-3 h-3 rounded-full ${idx === selectedImageIndex ? 'bg-white' : 'bg-gray-400'}`}
                  aria-label={`عرض الصورة ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
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
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
                    {/* رسائل النظام */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* قسم الصور (يمكن إضافته لاحقاً) */}
                        <div className="rounded-lg flex-direction-column items-center">
      {/* قسم معرض الصور */}
              <div className="order-2 lg:order-1">
                {/* الصورة الرئيسية */}
                <div 
                  className="bg-gray-100 rounded-lg overflow-hidden relative cursor-pointer"
                  onClick={() => setShowImageModal(true)}
                >
                  <img 
                    src={currentImage} 
                    alt={item.title} 
                    className="w-full h-96 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-car.jpg';
                    }}
                  />
                  
                  {/* أزرار التنقل بين الصور */}
                  {images.length > 1 && (
                    <>

                      <button 
                        onClick={(e) => { e.stopPropagation(); goToPreviousImage(); }}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-opacity-70"
                        aria-label="الصورة السابقة"
                      >
                         &lt;
                      </button>
                       <button 
                        onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-opacity-70"
                        aria-label="الصورة التالية"
                      >
                        &gt;
                      </button>
     
                    </>
                  )}
                </div>
                
                {/* شريط الصور المصغرة */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {images.map((img, idx) => (
                    <div 
                      key={idx}
                      className={`cursor-pointer border-2 rounded-md overflow-hidden ${idx === selectedImageIndex ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 hover:border-gray-300'}`}
                      onClick={() => setSelectedImageIndex(idx)}
                    >
                      <img 
                        src={img} 
                        alt={`صورة ${idx + 1}`} 
                        className="w-full h-16 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-car.jpg';
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* معلومات السعر للشاشات الصغيرة */}
                <div className="mt-6 block lg:hidden">
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-2xm font-bold text-blue-600">
                      السعر الحالي: {item.active_auction.current_bid?.toLocaleString()} ريال
                    </p>
                    {item.auction_result && (
                      <p className="text-lg text-green-600 mt-2">{item.auction_result}</p>
                    )}
                  </div>
                </div>
              </div>
                            {!isOwner && !item["active_auction"] && (
                                <div
                                    className="max-w-md mx-auto bg-gray-50 p-6 rounded-3xl shadow-lg border border-gray-200"
                                    dir="rtl"
                                >
                                    <h2 className="text-xl font-bold text-center mb-4 text-gray-600">
                                        غير متاح للمزايدة
                                    </h2>
                                    <p className="text-center text-gray-500">
                                        هذه السيارة غير مدرجة في مزاد حالياً.
                                        يرجى المراجعة لاحقاً أو تصفح السيارات
                                        المتاحة للمزاد.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* بيانات السيارة */}
                        <div>
                            {item["active_auction"] ? (
                                <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <p className="text-2xl font-bold text-blue-600">
                                        آخر سعر:{" "}
                                        {item[
                                            "active_auction"
                                        ].current_bid?.toLocaleString() ||
                                            "-"}{" "}
                                        ريال
                                    </p>
                                    {item["active_auction"].current_bid && (
                                        <p className="text-lg text-green-600 mt-2">
                                            {item["active_auction"].current_bid}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <p className="text-xl font-bold text-yellow-700">
                                        هذه السيارة غير متاحة للمزايدة حالياً
                                    </p>
                                    <p className="text-sm text-yellow-600 mt-1">
                                        السيارة متاحة للعرض فقط أو في انتظار
                                        الموافقة للمزاد
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-500 text-sm">
                                            الماركة
                                        </p>
                                        <p className="font-semibold">
                                            {item["car"].make}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">
                                            الموديل
                                        </p>
                                        <p className="font-semibold">
                                            {item["car"].model}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">
                                            سنة الصنع
                                        </p>
                                        <p className="font-semibold">
                                            {item["car"].year}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">
                                            رقم اللوحة
                                        </p>
                                        <p className="font-semibold">
                                            {item["car"].plate}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">
                                            رقم العداد
                                        </p>
                                        <p className="font-semibold">
                                            {item[
                                                "car"
                                            ].odometer?.toLocaleString() ||
                                                "-"}{" "}
                                            كم
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">
                                            نوع الوقود
                                        </p>
                                        <p className="font-semibold">
                                            {item["car"].engine || "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">
                                            حالة السيارة
                                        </p>
                                        <p className="font-semibold">
                                            {item["car"].condition || "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">
                                            لون السيارة
                                        </p>
                                        <p className="font-semibold">
                                            {item["car"].color || "-"}
                                        </p>
                                    </div>
                                </div>

                                {item["active_auction"] ? (
                                    <div className="pt-4 border-t">
                                        <p className="text-gray-500 text-sm mb-2">
                                            معلومات المزاد
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-gray-500 text-sm">
                                                    سعر الإفتتاح
                                                </p>
                                                <p className="font-semibold">
                                                    {item[
                                                        "active_auction"
                                                    ].minimum_bid?.toLocaleString() ||
                                                        "-"}{" "}
                                                    ريال
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-sm">
                                                    أقل سعر
                                                </p>
                                                <p className="font-semibold">
                                                    {item[
                                                        "active_auction"
                                                    ].minimum_bid?.toLocaleString() ||
                                                        "-"}{" "}
                                                    ريال
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-sm">
                                                    أعلى سعر
                                                </p>
                                                <p className="font-semibold">
                                                    {item[
                                                        "active_auction"
                                                    ].maximum_bid?.toLocaleString() ||
                                                        "-"}{" "}
                                                    ريال
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-sm">
                                                    المزايدات المقدمة
                                                </p>
                                                <p className="font-semibold">
                                                    {item["total_bids"] || "0"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t">
                                        <p className="text-gray-500 text-sm mb-2">
                                            حالة السيارة
                                        </p>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-600">
                                                هذه السيارة غير مدرجة في مزاد
                                                حالياً. قد تكون متاحة للعرض أو
                                                في انتظار الموافقة للمزاد.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
