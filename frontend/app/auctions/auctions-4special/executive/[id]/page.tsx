'use client';

import { useState, useEffect } from 'react';
import LoadingLink from "@/components/LoadingLink";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Shield,
  Award,
  Crown,
  ChevronRight,
  ChevronLeft,
  Download,
  MapPin,
  MessageCircle,
  ShoppingBag,
  HeartIcon,
  Share2,
  BookOpen,
  Maximize,
  RotateCw,
  Info,
  AlertCircle,
  Lock
} from 'lucide-react';

export default function ExecutiveItemDetailPage({ params }) {
  const { id } = params;
  
  const [isExecutive, setIsExecutive] = useState(false); // سيتم استبداله بمنطق التحقق الحقيقي
  const [itemDetails, setItemDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [bidAmount, setBidAmount] = useState(0);
  const [showZoom, setShowZoom] = useState(false);

  // جلب بيانات المنتج
  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const response = await fetch(`/api/executive-auctions/${id}`);
        
        if (!response.ok) {
          throw new Error('فشل في جلب بيانات المنتج');
        }
        
        const data = await response.json();
        setItemDetails(data);
        // تعيين قيمة المزايدة المبدئية
        setBidAmount(data.nextMinBid);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    // محاكاة حالة المستخدم التنفيذي للعرض التوضيحي
    setIsExecutive(true);
    
    fetchItemDetails();
  }, [id]);

  // تنسيق الأرقام بالفواصل
  const formatPrice = (price) => {
    if (!price) return "0";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // حساب الوقت المتبقي للمزاد
  const calculateTimeLeft = () => {
    if (!itemDetails || !itemDetails.endDate) return 'غير محدد';
    
    const now = new Date();
    const endDate = new Date(itemDetails.endDate);
    const difference = endDate - now;
    
    if (difference <= 0) {
      return 'انتهى المزاد';
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days} يوم ${hours} ساعة ${minutes} دقيقة`;
  };



  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">حدث خطأ: {error}</div>
      </div>
    );
  }

  if (!isExecutive) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Lock className="mx-auto mb-4 text-red-500" size={64} />
            <h2 className="text-2xl font-bold mb-4">محتوى مخصص لأعضاء VIP فقط</h2>
            <p className="text-gray-600 mb-6">
              هذا المحتوى مخصص للأعضاء المعتمدين في مزادات VIP الخاصة. يرجى طلب دعوة للانضمام للوصول إلى المنتجات الحصرية.
            </p>
            <LoadingLink 
              href="/auctions/auctions-special/executive"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow transition inline-block"
            >
              العودة للصفحة الرئيسية
            </LoadingLink>
          </div>
        </div>
      </div>
    );
  }

  if (!itemDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">المنتج غير موجود</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-800 py-6">
        <div className="container mx-auto px-4">
          <LoadingLink 
            href="/auctions/auctions-special/executive" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى مزادات VIP الخاصة</span>
          </LoadingLink>
          <h1 className="text-3xl font-bold text-white">{itemDetails.title}</h1>
          <div className="flex items-center mt-2 text-white/80">
            <span>{itemDetails.categoryName}</span>
            <span className="mx-2">•</span>
            <span>{itemDetails.origin}</span>
            {itemDetails.specialBadge && (
              <>
                <span className="mx-2">•</span>
                <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-full text-xs font-bold">
                  {itemDetails.specialBadge}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {showZoom && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setShowZoom(false)}>
          <div className="relative w-full max-w-4xl h-3/4">
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">صورة مكبرة</span>
            </div>
            <button 
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white"
              onClick={() => setShowZoom(false)}
              aria-label="إغلاق العرض المكبر"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* قسم الصور ومعلومات التوثيق - عمود واحد */}
          <div className="lg:col-span-2 space-y-8">
            {/* عارض الصور */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="relative h-[400px] md:h-[500px] bg-gray-100">
                {/* الصورة الرئيسية */}
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">صورة {activeImage + 1}</span>
                </div>
                
                {/* أزرار التنقل */}
                <button 
                  onClick={() => setActiveImage((prev) => (prev === 0 ? (itemDetails.images?.length || 1) - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition"
                  aria-label="الصورة السابقة"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={() => setActiveImage((prev) => (prev === (itemDetails.images?.length || 1) - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition"
                  aria-label="الصورة التالية"
                >
                  <ChevronRight size={24} />
                </button>

                {/* أزرار التكبير والتدوير */}
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <button 
                    onClick={() => setShowZoom(true)}
                    className="bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition"
                    aria-label="تكبير الصورة"
                  >
                    <Maximize size={20} />
                  </button>
                  <button 
                    className="bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition"
                    aria-label="تدوير الصورة"
                  >
                    <RotateCw size={20} />
                  </button>
                </div>
              </div>
              
              {/* معرض الصور المصغر */}
              <div className="flex p-4 gap-2 overflow-x-auto">
                {itemDetails.images && itemDetails.images.map((image, index) => (
                  <button 
                    key={index} 
                    onClick={() => setActiveImage(index)}
                    className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                      activeImage === index ? 'border-purple-600' : 'border-transparent'
                    }`}
                    aria-label={`عرض الصورة ${index + 1}`}
                  >
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-400">{index + 1}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* وصف القطعة */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">وصف المنتج</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{itemDetails.fullDescription}</p>
            </div>

            {/* التاريخ والأصالة */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">التاريخ والأصالة</h2>
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{itemDetails.history}</p>
              </div>

              <h3 className="text-lg font-semibold mb-3">إجراءات التحقق من الأصالة</h3>
              <ul className="space-y-2 text-gray-700">
                {itemDetails.authenticityChecks?.map((check, index) => (
                  <li key={index} className="flex items-start">
                    <div className="bg-green-50 p-1 rounded-full mt-0.5 ml-2">
                      <Shield size={14} className="text-green-600" />
                    </div>
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* المواصفات التفصيلية */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">المواصفات التفصيلية</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">الأصل</span>
                  <span className="font-medium">{itemDetails.origin}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">العصر/السنة</span>
                  <span className="font-medium">{itemDetails.age}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">الحالة</span>
                  <span className="font-medium">{itemDetails.condition}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">المادة</span>
                  <span className="font-medium">{itemDetails.material}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">الأبعاد</span>
                  <span className="font-medium">{itemDetails.dimensions}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">الوزن</span>
                  <span className="font-medium">{itemDetails.weight}</span>
                </div>
              </div>

              {itemDetails.certificate && (
                <div className="mt-6 flex items-center p-3 bg-purple-50 rounded-lg">
                  <Award size={20} className="text-purple-600 ml-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-purple-800">شهادة توثيق وأصالة معتمدة</p>
                    <p className="text-sm text-purple-700">صادرة من: {itemDetails.certificateAuthority}</p>
                    <LoadingLink href={itemDetails.certificate} className="flex items-center text-purple-600 hover:text-purple-700 mt-1 text-sm">
                      <Download size={14} className="ml-1" />
                      <span>تحميل الشهادة</span>
                    </LoadingLink>
                  </div>
                </div>
              )}
            </div>

            {/* خيارات المعاينة */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Info size={20} className="ml-2 text-purple-600" />
                خيارات المعاينة
              </h2>
              <ul className="space-y-2 text-gray-700">
                {itemDetails.viewingOptions?.map((option, index) => (
                  <li key={index} className="flex items-start">
                    <div className="bg-blue-50 p-1 rounded-full mt-0.5 ml-2">
                      <Info size={14} className="text-blue-600" />
                    </div>
                    <span>{option}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* قسم المزايدة والبائع - عمود واحد */}
          <div className="space-y-6">
            {/* علامة VIP */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-800 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center">
                <Crown size={24} className="text-yellow-400 ml-3" />
                <div>
                  <h3 className="font-bold">مزاد VIP خاص</h3>
                  <p className="text-sm text-white/80">هذا المنتج متاح فقط للأعضاء التنفيذيين</p>
                </div>
              </div>
            </div>
            
            {/* معلومات المزايدة */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="text-sm text-gray-500">المزايدة الحالية</div>
                  <div className="text-3xl font-bold text-purple-600">{formatPrice(itemDetails.currentBid)} ريال</div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500">المزاد ينتهي في</div>
                  <div className="flex items-center text-red-600 font-semibold">
                    <Clock size={16} className="ml-1" />
                    <span>{calculateTimeLeft()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg flex items-start mb-6">
                <AlertCircle size={18} className="text-purple-600 ml-2 mt-0.5" />
                <div className="text-sm text-purple-800">
                  <p className="font-medium">ملاحظة هامة للأعضاء التنفيذيين</p>
                  <p>سيتم التواصل معك مباشرة من قبل مستشار المزادات الخاص بك بعد المزايدة لتأكيد العملية وترتيب المعاينة.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col">
                  <label htmlFor="bid-amount" className="text-sm text-gray-600 mb-1">تقديم مزايدة (بالريال)</label>
                  <input 
                    type="number" 
                    id="bid-amount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    min={itemDetails.nextMinBid}
                    step={itemDetails.bidIncrement}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <div className="flex justify-between text-sm mt-1">
                    <span>الحد الأدنى: {formatPrice(itemDetails.nextMinBid)} ريال</span>
                    <span className="text-gray-500">زيادة: {formatPrice(itemDetails.bidIncrement)} ريال+</span>
                  </div>
                </div>

                <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition">
                  تقديم المزايدة
                </button>

                <div className="flex gap-2">
                  <button className="flex-1 flex justify-center items-center gap-2 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <ShoppingBag size={18} />
                    <span>شراء مباشر</span>
                  </button>
                  <button className="flex-1 flex justify-center items-center gap-2 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <MessageCircle size={18} />
                    <span>تقديم عرض</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 flex justify-center items-center gap-2 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <HeartIcon size={18} />
                    <span>إضافة للمفضلة</span>
                  </button>
                  <button className="flex-1 flex justify-center items-center gap-2 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <Share2 size={18} />
                    <span>مشاركة</span>
                  </button>
                </div>
              </div>
            </div>

            {/* البائع */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">معلومات البائع</h2>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div className="mr-3">
                  <div className="font-bold flex items-center">
                    {itemDetails.seller?.name}
                    {itemDetails.seller?.verified && (
                      <span className="mr-2 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">موثق</span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="flex items-center text-amber-500 ml-1">
                      {itemDetails.seller?.rating} ★
                    </span>
                    <span className="mx-1">•</span>
                    <span>{itemDetails.seller?.transactions} عملية</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-5">
                <div className="flex items-center text-gray-600">
                  <MapPin size={16} className="ml-2" />
                  <span>{itemDetails.seller?.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar size={16} className="ml-2" />
                  <span>عضو منذ {itemDetails.seller?.joined}</span>
                </div>
              </div>
              
              <button className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition mb-2">
                طلب معلومات إضافية
              </button>
              <button className="w-full py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition">
                طلب معاينة خاصة
              </button>
            </div>

            {/* سجل المزايدات */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">سجل المزايدات</h2>
              
              {itemDetails.bids && itemDetails.bids.length > 0 ? (
                <ul className="space-y-3">
                  {itemDetails.bids.map((bid, index) => (
                    <li key={index} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between">
                        <span className="font-medium">{bid.user}</span>
                        <span className="text-purple-600 font-bold">{formatPrice(bid.amount)} ريال</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{bid.date}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-4">لا توجد مزايدات حتى الآن</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* قسم منتجات مشابهة */}
      <div className="container mx-auto px-4 mt-16">
        <h2 className="text-2xl font-bold mb-6">منتجات VIP مشابهة قد تعجبك</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {itemDetails.similarItems?.map((item) => (
            <LoadingLink 
              key={item.id} 
              href={`/auctions/auctions-special/executive/${item.id}`}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group"
            >
              <div className="relative h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="text-lg font-bold group-hover:text-purple-600 transition">{item.title}</div>
                <div className="text-lg font-bold text-purple-600 mt-2">
                  {formatPrice(item.price)} ريال
                </div>
              </div>
            </LoadingLink>
          ))}
        </div>
      </div>
    </div>
  );
} 