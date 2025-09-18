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
import LoadingLink from "@/components/LoadingLink";
import { ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import toast from "react-hot-toast";
import Pusher from 'pusher-js';
import { useEcho } from "@laravel/echo-react";

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

interface BidingData {
  auction_id: number;
  user_id: number;
  bid_amount: number;
}


export default function CarDetailPage() {
  console.log("Pusher Key:", process.env.NEXT_PUBLIC_PUSHER_APP_KEY);
  
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastbid, setLastBid] = useState(0);
  const [formData, setFormData] = useState<BidingData>({
    auction_id: 0,
    user_id: 0,
    bid_amount: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggedIn } = useAuth();
  const router = useLoadingRouter();
  const params = useParams<{ tag: string; item: string }>();
  let carId = params["id"];
  const [isOwner, setIsOwner] = useState(false);




  // التعامل مع تغيير قيم حقول النموذج
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Check if there's an active auction first
      if (!formData.auction_id || formData.auction_id === 0) {
        throw new Error("هذه السيارة غير متاحة للمزايدة حالياً");
      }

      // التحقق من البيانات المدخلة
      const requiredFields = ["bid_amount"];
      for (const field of requiredFields) {
        if (!formData[field as keyof BidingData]) {
          throw new Error(`حقل ${field.replace("_", " ")} مطلوب`);
        }
      }

      formData.bid_amount = roundToNearest5or0(formData.bid_amount);

      // إرسال بيانات المزايدة
      const response = await api.post("/api/auctions/bid", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.status === "success") {
        setSubmitResult({
          success: true,
          message: "تم تقديم العرض بنجاح",
        });
        // إعادة تعيين النموذج
        setFormData({
          auction_id: formData.auction_id,
          user_id: formData.user_id,
          bid_amount: 0,
        });
        // setTimeout(() => {
        //   window.location.reload();
        // }, 2000);
      } else {
        toast.error("فشل في تقديم العرض");
      }
    } catch (error: any) {
      console.log(error);
      console.error("خطأ في حفظ البيانات:", error.response.data.message);
      setSubmitResult({
        success: false,
        message: error.response.data.message || "حدث خطأ أثناء حفظ البيانات",
      });
      toast.error(error.response.data.message || "فشل في تقديم العرض");
    } finally {
      setIsSubmitting(false);
    }
  };

  // تقديم النموذج
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    setShowConfirm(true);
  };

  const roundToNearest5or0 = (number: number): number => {
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
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
    });

    
    async function fetchAuctions() {
      if (!isLoggedIn) return;
      try {
        const response = await api.get(`/api/car/${carId}`);
        if (response.data.data || response.data.data) {
          const carsData = response.data.data.data || response.data.data;
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
              user_id: user.id,
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              user_id: user.id,
            }));
          }

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

          const auctionId = carsData.id;
          console.log(`🎯 Setting up Echo listener for auction.${auctionId}`);
        
          var channel = pusher.subscribe(`auction.${auctionId}`);
          
          channel.bind("NewBidEvent", (event) => {
            // add new price into the APPL widget
            console.log("NewBidEvent received!");
            console.log("Event data:", event.data);
            setItem((prevItem) => ({
              ...prevItem, 
              active_auction: event.data.active_auction, 
              total_bids: event.data.total_bids
            }));
            setLastBid(roundToNearest5or0(event.data.active_auction.current_bid) + 100);
            //toast.success(`عرض جديد: ${event.data.active_auction.current_bid?.toLocaleString()} ريال`);
            
          });
        }
      } catch (error) {
        console.error("فشل تحميل بيانات المزاد الصامت", error);
        setItem([]); // مصفوفة فارغة في حالة الفشل
        setError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.");
        setLoading(false);
      } finally {
        setLoading(false);
      }
    }
    fetchAuctions();

  }, []);

  // Setup Echo listener for bid events when we have auction data

  console.log('item', item);

  




  const images = item["car"]?.images;
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
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative w-full max-w-4xl mx-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(false);
              }}
              className="absolute top-0 right-0 m-4 text-white text-2xl z-10 hover:text-gray-300"
            >
              ✖
            </button>
            <img
              src={currentImage}
              alt={item.title}
              className="max-w-full max-h-[80vh] mx-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-car.jpg";
              }}
            />
            <div className="absolute inset-x-0 bottom-4 flex justify-center space-x-2 rtl:space-x-reverse">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(idx);
                  }}
                  className={`w-3 h-3 rounded-full ${
                    idx === selectedImageIndex ? "bg-white" : "bg-gray-400"
                  }`}
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
          <LoadingLink
            href="/auctions"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 text-sm rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
          >
            <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
            <span>العودة إلى الأسواق</span>
          </LoadingLink>
          {isOwner && (
            <button
              onClick={() => router.push(`/sales/confirm/${carId}`)}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded"
            >
              تأكيد البيع
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 ">
          {/* رسائل النظام */}
          {submitResult && (
            <div
              className={`p-4 rounded-md ${
                submitResult.success
                  ? "bg-green-50 border border-green-200 mb-3"
                  : "bg-red-50 border border-red-200 mb-3"
              }`}
            >
              <div className="flex items-start">
                {submitResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 ml-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 ml-2" />
                )}
                <p
                  className={
                    submitResult.success ? "text-green-700" : "text-red-700"
                  }
                >
                  {submitResult.message}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* قسم الصور (يمكن إضافته لاحقاً) */}
            <div className="rounded-lg flex-direction-column items-center">
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
                      (e.target as HTMLImageElement).src =
                        "/placeholder-car.jpg";
                    }}
                  />

                  {/* أزرار التنقل بين الصور */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goToPreviousImage();
                        }}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-opacity-70"
                        aria-label="الصورة السابقة"
                      >
                        &lt;
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goToNextImage();
                        }}
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
                      className={`cursor-pointer border-2 rounded-md overflow-hidden ${
                        idx === selectedImageIndex
                          ? "border-blue-500 ring-2 ring-blue-300"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedImageIndex(idx)}
                    >
                      <img
                        src={img}
                        alt={`صورة ${idx + 1}`}
                        className="w-full h-16 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder-car.jpg";
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* معلومات السعر للشاشات الصغيرة */}
                <div className="mt-6 block lg:hidden">
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-2xl font-bold text-blue-600">
                  
                      السعر الحالي: {item["active_auction"] ? item["active_auction"]?.current_bid?.toLocaleString() : item['car'].max_price?.toLocaleString()} ريال
                    </p>
                    {item.auction_result && (
                      <p className="text-lg text-green-600 mt-2">
                        {item.auction_result}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {!isOwner && item["active_auction"] && (
                <div
                  className="max-w-md mx-auto bg-white p-6 rounded-3xl shadow-lg border"
                  dir="rtl"
                >
                  <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
                    تقديم عرض على السيارة
                  </h2>
                  <form onSubmit={handleSubmit}>
                    <label className="block mb-2 font-semibold text-gray-700">
                      قيمة العرض (ريال سعودي):
                    </label>
                    <input
                      type="number"
                      id="bid_amount"
                      name="bid_amount"
                      className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder={`الحد الأدنى: ${lastbid} ريال`}
                      value={formData.bid_amount}
                      onChange={handleInputChange}
                      min={lastbid}
                      step="5"
                      required
                    />
                    <p className="text-sm text-gray-500 mb-4">
                      الحد الأدنى للمزايدة: {lastbid.toLocaleString()} ريال
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "جاري الإرسال..." : "إرسال العرض"}
                    </button>
                  </form>

                  {/* Confirmation Dialog */}
                  {showConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div
                        className="bg-white rounded-lg p-6 max-w-md mx-4"
                        dir="rtl"
                      >
                        <h3 className="text-lg font-bold mb-4 text-gray-800">
                          تأكيد المزايدة
                        </h3>
                        <p className="text-gray-600 mb-6">
                          هل أنت متأكد من تقديم عرض بقيمة{" "}
                          {formData.bid_amount?.toLocaleString()} ريال على هذه
                          السيارة؟
                        </p>
                        <div className="flex gap-4">
                          <button
                            onClick={confirmSubmit}
                            disabled={isSubmitting}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                          >
                            {isSubmitting ? "جاري الإرسال..." : "تأكيد"}
                          </button>
                          <button
                            onClick={() => setShowConfirm(false)}
                            disabled={isSubmitting}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-200 disabled:opacity-50"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isOwner && !item["active_auction"] && (
                <div
                  className="max-w-md mx-auto bg-gray-50 p-6 rounded-3xl shadow-lg border border-gray-200"
                  dir="rtl"
                >
                  <h2 className="text-xl font-bold text-center mb-4 text-gray-600">
                    غير متاح للمزايدة
                  </h2>
                  <p className="text-center text-gray-500">
                    هذه السيارة غير مدرجة في مزاد حالياً. يرجى المراجعة لاحقاً
                    أو تصفح السيارات المتاحة للمزاد.
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
                    {item["active_auction"].current_bid?.toLocaleString() ||
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
                    السيارة متاحة للعرض فقط أو في انتظار الموافقة للمزاد
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">الماركة</p>
                    <p className="font-semibold">{item["car"].make}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">الموديل</p>
                    <p className="font-semibold">{item["car"].model}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">سنة الصنع</p>
                    <p className="font-semibold">{item["car"].year}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">رقم اللوحة</p>
                    <p className="font-semibold">{item["car"].plate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">رقم العداد</p>
                    <p className="font-semibold">
                      {item["car"].odometer?.toLocaleString() || "-"} كم
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">نوع الوقود</p>
                    <p className="font-semibold">{item["car"].engine || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">حالة السيارة</p>
                    <p className="font-semibold">
                      {item["car"].condition || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">لون السيارة</p>
                    <p className="font-semibold">{item["car"].color || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">صورة كرت التسجيل</p>
                    <p className="font-semibold">
                      {item["car"].registration_card_image ? (
                        <a
                          href={item["car"].registration_card_image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <img
                            src={item["car"].registration_card_image}
                            alt="صورة كرت التسجيل"
                            className="w-20 h-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">تقارير الفحص</p>
                    <p className="font-semibold">
                      {item["car"].report_images.map((file: any) => (
                        <div key={file.id}>
                          <a href={file.image_path}>
                            {file.image_path.split("/").pop()}
                          </a>
                        </div>
                      )) || "-"}
                    </p>
                  </div>
                </div>

                {item["active_auction"] ? (
                  <div className="pt-4 border-t">
                    <p className="text-gray-500 text-sm mb-2">معلومات المزاد</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 text-sm">سعر الإفتتاح</p>
                        <p className="font-semibold">
                          {item[
                            "active_auction"
                          ].minimum_bid?.toLocaleString() || "-"}{" "}
                          ريال
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">أقل سعر</p>
                        <p className="font-semibold">
                          {item[
                            "active_auction"
                          ].minimum_bid?.toLocaleString() || "-"}{" "}
                          ريال
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">أعلى سعر</p>
                        <p className="font-semibold">
                          {item[
                            "active_auction"
                          ].maximum_bid?.toLocaleString() || "-"}{" "}
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
                      <div>
                        <p className="text-gray-500 text-sm">مبلغ المزايدة</p>
                        <p className="font-semibold text-green-500">
                          {(() => {
                            const bids = item?.active_auction?.bids || [];
                            const lastBid =
                              bids.length > 0 ? bids[bids.length - 1] : null;
                            return lastBid ? lastBid.increment : 0;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t">
                    <p className="text-gray-500 text-sm mb-2">حالة السيارة</p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">
                        هذه السيارة غير مدرجة في مزاد حالياً. قد تكون متاحة
                        للعرض أو في انتظار الموافقة للمزاد.
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
