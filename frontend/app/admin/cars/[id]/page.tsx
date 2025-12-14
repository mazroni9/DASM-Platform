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

// ✅ صفحة عرض المزاد المتأخر مع رابط للتفاصيل السيارة
// المسار: /pages/silent/page.tsx

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import LoadingLink from "@/components/LoadingLink";
import {
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Gauge,
    Paintbrush,
    Fuel,
    Car,
    Wrench,
    Tag,
    ChevronLeft,
} from "lucide-react";
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

    const [item, setItem] = useState<any>(null);
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
        console.log("carId", carId);
        async function fetchAuctions() {
            if (!isLoggedIn) return;
            try {
                const response = await api.get(`/api/admin/cars/${carId}`);

                if (response.data && response.data.data) {
                    const carData = response.data.data;
                    console.log('car', carData);
                    
                    setItem(carData);

                    const car_user_id = carData.user_id;
                    const current_user_id = user.id;
                    let dealer_user_id = null;
                    if (carData.dealer) {
                        dealer_user_id = carData.dealer.user_id;
                    }

                    if (current_user_id == car_user_id || dealer_user_id == current_user_id) {
                        setIsOwner(true);
                    }
                }
            } catch (error) {
                console.error("error fetching car details", error);
                setItem(null);
                setError("error fetching car details");
                setLoading(false);
            } finally {
                setLoading(false);
            }
        }
        fetchAuctions();
    }, [isLoggedIn, user, carId]);

 
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <p className="text-lg">جاري تحميل بيانات السيارة...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                    <p className="mt-4 text-lg text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
                    <p className="mt-4 text-lg">لم يتم العثور على بيانات السيارة.</p>
                </div>
            </div>
        );
    }

        const images = item.images || [];
        // الصورة الحالية المختارة
        const currentImage = images[selectedImageIndex] || '/placeholder-car.jpg';
        const carTitle = item ? `${item.make} ${item.model}` : "صورة السيارة";

    const goToNextImage = () => {
        setSelectedImageIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
    };

    const goToPreviousImage = () => {
        setSelectedImageIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    // عرض بيانات السيارة إذا تم العثور عليها
    return (
        <div className="min-h-screen ">
            {/* نافذة عرض الصور المكبرة */}
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
                            className="absolute top-0 right-0 m-4 text-white text-3xl z-10 hover:text-gray-300"
                        >
                            &times;
                        </button>
                        <img
                            src={currentImage}
                            alt={carTitle}
                            className="max-w-full max-h-[80vh] mx-auto object-contain rounded-lg"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                    "/placeholder-car.jpg";
                            }}
                        />
                         <div className="absolute inset-x-0 bottom-4 flex justify-center space-x-2 rtl:space-x-reverse">
              {images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                  className={`w-3 h-3 rounded-full transition-colors ${idx === selectedImageIndex ? 'bg-white scale-125' : 'bg-gray-400 hover:bg-gray-200'}`}
                  aria-label={`عرض الصورة ${idx + 1}`}
                />
              ))}
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); goToPreviousImage(); }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                aria-label="الصورة السابقة"
            >
                <ChevronLeft className="h-6 w-6" />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                aria-label="الصورة التالية"
            >
                <ChevronRight className="h-6 w-6" />
            </button>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <LoadingLink
                        href="/admin/cars"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                    >
                        <ChevronRight className="h-5 w-5 ml-1 rtl:rotate-180" />
                        <span>العودة إلى قائمة السيارات</span>
                    </LoadingLink>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* --- Colonne de Gauche: Galerie d'images --- */}
                    <div className="lg:col-span-2">
                        <div
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200"
                        >
                            <div
                                className="relative rounded-lg overflow-hidden cursor-pointer group"
                                onClick={() => setShowImageModal(true)}
                            >
                                <img
                                    src={currentImage}
                                    alt={carTitle}
                                    className="w-full h-[450px] object-cover transition-transform duration-300 group-hover:scale-105"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            "/placeholder-car.jpg";
                                    }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all"></div>
                            </div>
                            <div className="mt-4 grid grid-cols-5 gap-3">
                                {images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className={`cursor-pointer rounded-md overflow-hidden ring-2 ring-offset-2 transition-all ${
                                            idx === selectedImageIndex
                                                ? "ring-blue-500"
                                                : "ring-transparent hover:ring-blue-300"
                                        }`}
                                        onClick={() =>
                                            setSelectedImageIndex(idx)
                                        }
                                    >
                                        <img
                                            src={img}
                                            alt={`صورة ${idx + 1}`}
                                            className="w-full h-24 object-cover"
                                            onError={(e) => {
                                                (
                                                    e.target as HTMLImageElement
                                                ).src = "/placeholder-car.jpg";
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- Colonne de Droite: Détails et Actions --- */}
                    <div className="lg:col-span-1 space-y-6">
                         {/* --- Boîte d'enchères --- */}
                         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                             {item.auctions && item.auctions.length > 0 ? (
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">السعر الحالي</p>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {item.auctions[0].current_bid?.toLocaleString() || "-"} ريال
                                    </p>
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">سعر الإفتتاح</p>
                                            <p className="font-semibold">{item.auctions[0].minimum_bid?.toLocaleString() || "-"} ريال</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">عدد المزايدات</p>
                                            <p className="font-semibold">{item.auctions.reduce((acc, auction) => acc + (auction.bids?.length || 0), 0)}</p>
                                        </div>
                                    </div>
                                </div>
                             ) : (
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        غير متاح للمزايدة
                                    </h3>
                                    <p className="text-gray-500 mt-2 text-sm">
                                        هذه السيارة غير مدرجة في مزاد حالياً.
                                    </p>
                                </div>
                             )}
                        </div>

                        {/* --- Boîte de détails de la voiture --- */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800">{carTitle}</h2>
                            <div className="space-y-4 text-sm">
                                <DetailRow icon={Car} label="الماركة" value={item.make} />
                                <DetailRow icon={Tag} label="الموديل" value={item.model} />
                                <DetailRow icon={Calendar} label="سنة الصنع" value={item.year} />
                                <DetailRow icon={Gauge} label="رقم العداد" value={`${item.odometer?.toLocaleString() || "-"} كم`} />
                                <DetailRow icon={Paintbrush} label="اللون" value={item.color || "-"} />
                                <DetailRow icon={Fuel} label="نوع الوقود" value={item.engine || "-"} />
                                <DetailRow icon={Wrench} label="حالة السيارة" value={item.condition || "-"} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const DetailRow = ({ icon, label, value }) => {
    const Icon = icon;
    return (
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center text-gray-600">
                {Icon && <Icon className="h-4 w-4 ml-2 text-gray-400" />}
                <span>{label}</span>
            </div>
            <p className="font-semibold text-gray-800">{value}</p>
        </div>
    );
};
