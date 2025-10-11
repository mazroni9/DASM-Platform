"use client";

import { ChangeEvent, FormEvent, useEffect, useState, useCallback } from "react";
import LoadingLink from "@/components/LoadingLink";
import { ChevronRight, AlertCircle, CheckCircle2, Plus, Truck, Car, Users, TrendingUp, Clock, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import toast from "react-hot-toast";
import Pusher from "pusher-js";
import BidForm from "@/components/BidForm";

// =============== أنواع TypeScript ===============
interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  plate: string;
  odometer: string;
  engine: string;
  condition: string;
  color: string;
  registration_card_image: string | null;
  report_images: { id: number; image_path: string }[];
  user_id: number;
  dealer?: { user_id: number } | null;
  images: string[];
}

interface ActiveAuction {
  id: number;
  minimum_bid: number;
  maximum_bid: number;
  current_bid: number;
  opening_price: number;
  bids: { increment: number }[];
}

interface CarItem {
  id: number;
  car: Car;
  active_auction: ActiveAuction | null;
  auction_result: string | null;
  total_bids: number;
}

function getCurrentAuctionType(): string {
  const hour = new Date().getHours();
  if (hour >= 16 && hour < 19) return "live";
  if (hour >= 19 && hour < 22) return "immediate";
  return "late";
}

export default function CarDetailPage() {
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [item, setItem] = useState<CarItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showBid, setShowBid] = useState(false);
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useLoadingRouter();
  const params = useParams<{ id: string }>();
  const carId = params["id"];

  // تحقق من التوثيق
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      // السماح بالوصول العام لعرض التفاصيل
    }
  }, [isLoggedIn, authLoading]);

  // جلب بيانات السيارة
  const fetchCarData = useCallback(async () => {
    if (authLoading) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/api/car/${carId}`);
      const data = response.data.data;
      
      if (data) {
        setItem(data);
        
        // تحقق من الملكية
        const carUserId = data.car.user_id;
        const dealerUserId = data.car.dealer?.user_id;
        const currentUserId = user?.id;
        setIsOwner(currentUserId === carUserId || currentUserId === dealerUserId);
        
        // إعداد Pusher
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'ap2',
        });
        
        const channel = pusher.subscribe(`auction.${data.id}`);
        channel.bind("NewBidEvent", (event: any) => {
          setItem(prev => prev ? { ...prev, ...event.data } : null);
        });
        
        return () => {
          pusher.unsubscribe(`auction.${data.id}`);
          pusher.disconnect();
        };
      }
    } catch (err) {
      console.error("فشل تحميل بيانات السيارة", err);
      setError("تعذر تحميل بيانات السيارة. يرجى المحاولة لاحقًا.");
    } finally {
      setLoading(false);
    }
  }, [authLoading, carId, user?.id]);

  useEffect(() => {
    fetchCarData();
  }, [fetchCarData]);

  // وظائف الصور
  const images = item?.car.images || [];
  const currentImage = images[selectedImageIndex] || "/placeholder-car.jpg";

  const goToNextImage = () => {
    setSelectedImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };

  const goToPreviousImage = () => {
    setSelectedImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  // تنسيق العملة
  const formatCurrency = (value: number | null | undefined): string => {
    if (value == null) return "-";
    return new Intl.NumberFormat('ar-SA', { 
      style: 'currency', 
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جارٍ تحميل تفاصيل السيارة...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-start mb-6">
            <LoadingLink 
              href="/auctions"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors px-4 py-2.5 text-sm rounded-xl border border-blue-800/50 hover:border-blue-700 bg-gray-800/50 hover:bg-gray-800 backdrop-blur-sm"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              العودة إلى الأسواق
            </LoadingLink>
          </div>
          
          <div className="bg-red-900/20 border border-red-800/40 text-red-300 rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100 p-4 md:p-6">
      {/* نافذة عرض الصور */}
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
              className="absolute top-4 right-4 text-white text-2xl z-10 hover:text-gray-300"
            >
              ✕
            </button>
            <img
              src={currentImage}
              alt={item?.car.make || ""}
              className="max-w-full max-h-[80vh] mx-auto object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-car.jpg";
              }}
            />
            <div className="absolute inset-x-0 bottom-4 flex justify-center space-x-2 rtl:space-x-reverse">
              {images.map((_, idx) => (
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

      <div className="max-w-7xl mx-auto">
        {/* التنقل العلوي */}
        <div className="flex justify-between items-center mb-8">
          <LoadingLink
            href="/auctions"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors px-4 py-2.5 text-sm rounded-xl border border-blue-800/50 hover:border-blue-700 bg-gray-800/50 hover:bg-gray-800 backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            العودة إلى الأسواق
          </LoadingLink>
          
          {isOwner && (
            <button
              onClick={() => router.push(`/sales/confirm/${carId}`)}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl border border-emerald-500/30"
            >
              تأكيد البيع
            </button>
          )}
        </div>

        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
            {/* قسم الصور */}
            <div className="flex flex-col">
              {/* الصورة الرئيسية */}
              <div
                className="bg-gray-900/50 rounded-xl overflow-hidden relative cursor-pointer aspect-video mb-5"
                onClick={() => setShowImageModal(true)}
              >
                <img
                  src={currentImage}
                  alt={item?.car.make || ""}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-car.jpg";
                  }}
                />
                
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPreviousImage();
                      }}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                      aria-label="الصورة السابقة"
                    >
                      ←
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goToNextImage();
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                      aria-label="الصورة التالية"
                    >
                      →
                    </button>
                  </>
                )}
              </div>

              {/* شريط الصور المصغرة */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`cursor-pointer rounded-lg overflow-hidden border-2 ${
                        idx === selectedImageIndex
                          ? "border-blue-500 ring-2 ring-blue-500/30"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                      onClick={() => setSelectedImageIndex(idx)}
                    >
                      <img
                        src={img}
                        alt={`صورة ${idx + 1}`}
                        className="w-full h-16 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder-car.jpg";
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* قسم المزايدة */}
              <div className="mt-6">
                {item?.active_auction ? (
                  !showBid ? (
                    <button
                      onClick={() => setShowBid(true)}
                      className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white py-3.5 rounded-xl font-bold text-lg border-2 border-teal-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" />
                        قدم عرضك الآن
                      </span>
                    </button>
                  ) : (
                    <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50">
                      <BidForm
                        auction_id={item.active_auction.id}
                        bid_amount={
                          item.active_auction.current_bid === 0
                            ? item.active_auction.opening_price
                            : item.active_auction.current_bid
                        }
                        onSuccess={() => {
                          toast.success("تم تقديم عرضك بنجاح!");
                          setShowBid(false);
                        }}
                      />
                    </div>
                  )
                ) : (
                  <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl p-5 text-center">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                    <h3 className="font-semibold text-amber-300 mb-1">غير متاح للمزايدة</h3>
                    <p className="text-amber-400/80 text-sm">
                      هذه السيارة غير مدرجة في مزاد حالياً. يرجى المراجعة لاحقاً.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* قسم التفاصيل */}
            <div className="space-y-6">
              {/* حالة المزاد */}
              {item?.active_auction ? (
                <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-emerald-300">المزاد نشط</h3>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 mb-3">
                    {formatCurrency(item.active_auction.current_bid)}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">المزايدات:</span>
                      <span className="text-white font-medium">{item.total_bids || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">النوع:</span>
                      <span className="text-white font-medium">
                        {getCurrentAuctionType() === 'live' ? 'مباشر' : 
                         getCurrentAuctionType() === 'immediate' ? 'فوري' : 'متأخر'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-400">عرض تفاصيل</h3>
                  </div>
                  <p className="text-gray-500">
                    هذه السيارة متاحة للعرض فقط أو في انتظار الموافقة للمزاد.
                  </p>
                </div>
              )}

              {/* معلومات السيارة */}
              <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  معلومات السيارة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ["الماركة", item?.car.make],
                    ["الموديل", item?.car.model],
                    ["سنة الصنع", item?.car.year?.toString()],
                    ["رقم اللوحة", item?.car.plate],
                    ["العداد", `${item?.car.odometer} كم`],
                    ["نوع الوقود", item?.car.engine],
                    ["الحالة", item?.car.condition],
                    ["اللون", item?.car.color]
                  ].map(([label, value], i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-400">{label}:</span>
                      <span className="text-white font-medium">{value || "-"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* صورة كرت التسجيل */}
              {(item?.car.registration_card_image || item?.car.report_images?.length > 0) && (
                <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50">
                  <h3 className="text-xl font-bold text-white mb-4">الوثائق</h3>
                  
                  {item.car.registration_card_image && (
                    <div className="mb-4">
                      <p className="text-gray-400 mb-2">كرت التسجيل:</p>
                      <a
                        href={item.car.registration_card_image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <img
                          src={item.car.registration_card_image}
                          alt="كرت التسجيل"
                          className="w-24 h-auto rounded-lg border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
                        />
                      </a>
                    </div>
                  )}
                  
                  {item.car.report_images?.length > 0 && (
                    <div>
                      <p className="text-gray-400 mb-2">تقارير الفحص:</p>
                      <div className="flex flex-wrap gap-2">
                        {item.car.report_images.map((report) => (
                          <a
                            key={report.id}
                            href={report.image_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm underline"
                          >
                            {report.image_path.split("/").pop()}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* معلومات المزاد */}
              {item?.active_auction && (
                <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    تفاصيل المزاد
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      ["سعر الافتتاح", formatCurrency(item.active_auction.opening_price)],
                      ["أقل سعر", formatCurrency(item.active_auction.minimum_bid)],
                      ["أعلى سعر", formatCurrency(item.active_auction.maximum_bid)],
                      ["المزايدات المقدمة", item.total_bids?.toString() || "0"]
                    ].map(([label, value], i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-gray-400">{label}:</span>
                        <span className="text-white font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}