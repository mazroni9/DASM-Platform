'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Shield,
  Award,
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
  AlertCircle
} from 'lucide-react';

export default function RareItemDetailPage({ params }) {
  const { id } = params;
  
  // سيتم استبدال هذا لاحقًا بجلب البيانات من قاعدة البيانات
  const itemDetails = {
    id: id,
    title: 'تمثال برونزي نادر من العصر الروماني',
    category: 'antiques',
    categoryName: 'تحف أثرية',
    description: 'تمثال برونزي نادر يعود للقرن الثاني الميلادي، تم اكتشافه في منطقة البحر المتوسط ويمثل إله الحكمة. التمثال بحالة ممتازة حيث تم ترميمه بواسطة خبراء متخصصين، وتظهر عليه كل تفاصيل الصناعة الرومانية الدقيقة من نقوش وزخارف.',
    fullDescription: `
    تمثال برونزي نادر من العصر الروماني يعود للقرن الثاني الميلادي (حوالي عام 150-180 م)، تم اكتشافه في أحد المواقع الأثرية المهمة في منطقة البحر المتوسط. يصور هذا التمثال المذهل إله الحكمة والفنون جالسًا بوضعية مميزة ويحمل بيده رمزًا من رموز الحكمة.

    التمثال مصنوع من البرونز عالي الجودة ويظهر براعة الحِرفيين الرومان في تلك الفترة. تظهر التفاصيل الدقيقة في ملامح الوجه وثنايا الملابس وحتى العضلات بشكل واضح ودقيق للغاية. ارتفاع التمثال 28 سم وقاعدته 12×12 سم، ويزن حوالي 1.8 كيلوغرام.

    تاريخ التمثال موثق بشكل كامل، وقد خضع لعمليات ترميم احترافية محدودة للحفاظ على حالته الأصلية. تم توثيقه من قبل خبراء في الآثار الرومانية ويأتي مع شهادة أصالة معتمدة.

    هذه القطعة النادرة تمثل إضافة استثنائية لأي مجموعة من المقتنيات الأثرية الرومانية، وتعتبر استثمارًا ثقافيًا وتاريخيًا فريدًا.
    `,
    history: `
    تم اكتشاف هذا التمثال في سبعينيات القرن العشرين أثناء أعمال تنقيب في موقع أثري بمنطقة ساحلية قريبة من روما. كان جزءًا من مجموعة تماثيل في معبد روماني صغير مكرس لإله الحكمة. 

    بعد اكتشافه، خضع للترميم والتوثيق في متحف الفن الروماني، وتم تسجيله في السجلات الرسمية للقطع الأثرية. انتقل بعدها إلى عدة مجموعات خاصة معروفة، وكان معروضًا في معارض متخصصة في باريس ولندن.

    تم توثيق كل معلومات الملكية والانتقال بين المجموعات بشكل رسمي، مما يعزز قيمته التاريخية والمادية.
    `,
    origin: 'الإمبراطورية الرومانية - إيطاليا',
    age: 'القرن الثاني الميلادي (حوالي 150-180 م)',
    condition: 'ممتازة',
    dimensions: '28 سم × 12 سم × 12 سم',
    weight: '1.8 كيلوغرام',
    material: 'برونز عالي الجودة',
    price: 35000,
    startBid: 35000,
    currentBid: 38500,
    nextMinBid: 39500,
    bidIncrement: 1000,
    bidCount: 12,
    endDate: new Date('2023-12-15T18:00:00'),
    certificate: '/certificates/roman-bronze-auth.pdf',
    certificateAuthority: 'المجلس الدولي للآثار والمقتنيات التاريخية',
    seller: {
      name: 'المتحف الخاص للمقتنيات الرومانية',
      rating: 4.9,
      transactions: 38,
      location: 'الرياض، السعودية',
      joined: '2019',
      verified: true
    },
    images: [
      '/rare-items/roman-bronze-1.jpg',
      '/rare-items/roman-bronze-2.jpg',
      '/rare-items/roman-bronze-3.jpg',
      '/rare-items/roman-bronze-4.jpg',
      '/rare-items/roman-bronze-5.jpg',
    ],
    bids: [
      { amount: 38500, user: 'أحمد س.', date: '2023-11-20 19:23' },
      { amount: 37500, user: 'سلطان م.', date: '2023-11-19 14:30' },
      { amount: 36500, user: 'فيصل ع.', date: '2023-11-18 08:45' },
      { amount: 35500, user: 'عبدالله ح.', date: '2023-11-17 21:17' },
      { amount: 35000, user: 'خالد ر.', date: '2023-11-17 10:12' },
    ],
    authenticityChecks: [
      'تم التحقق من الأصالة بواسطة خبراء متخصصين',
      'شهادة أصالة معتمدة من المجلس الدولي للآثار',
      'تحليل المعدن مطابق للمعايير الرومانية في تلك الفترة',
      'الأختام والرموز متوافقة مع الحقبة الزمنية المذكورة',
    ],
    viewingOptions: [
      'معاينة في الموقع متاحة بعد التنسيق المسبق',
      'فحص ومعاينة بحضور خبير مختص',
      'توفير صور إضافية عالية الدقة عند الطلب',
    ],
    similarItems: [
      { id: 101, title: 'رأس تمثال روماني من الرخام', price: 29000, category: 'antiques' },
      { id: 102, title: 'عملة ذهبية رومانية نادرة', price: 15000, category: 'antiques' },
      { id: 103, title: 'إناء فخاري روماني مزخرف', price: 8500, category: 'antiques' },
    ]
  };

  const [activeImage, setActiveImage] = useState(0);
  const [bidAmount, setBidAmount] = useState(itemDetails.nextMinBid);
  const [showZoom, setShowZoom] = useState(false);

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const calculateTimeLeft = () => {
    const now = new Date();
    const difference = itemDetails.endDate - now;
    
    if (difference <= 0) {
      return 'انتهى المزاد';
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days} يوم ${hours} ساعة ${minutes} دقيقة`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-600 py-6">
        <div className="container mx-auto px-4">
          <Link 
            href="/auctions/auctions-4special/precious" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى سوق التحف والقطع النادرة</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">{itemDetails.title}</h1>
          <div className="flex items-center mt-2 text-white/80">
            <span>{itemDetails.categoryName}</span>
            <span className="mx-2">•</span>
            <span>{itemDetails.origin}</span>
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
                  <span className="text-gray-400">صورة القطعة {activeImage + 1}</span>
                </div>
                
                {/* أزرار التنقل */}
                <button 
                  onClick={() => setActiveImage((prev) => (prev === 0 ? itemDetails.images.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition"
                  aria-label="الصورة السابقة"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={() => setActiveImage((prev) => (prev === itemDetails.images.length - 1 ? 0 : prev + 1))}
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
                {itemDetails.images.map((image, index) => (
                  <button 
                    key={index} 
                    onClick={() => setActiveImage(index)}
                    className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                      activeImage === index ? 'border-amber-600' : 'border-transparent'
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
              <h2 className="text-xl font-bold mb-4">وصف القطعة</h2>
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
                {itemDetails.authenticityChecks.map((check, index) => (
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
                  <span className="text-gray-500 text-sm">العصر/الفترة الزمنية</span>
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
                <div className="mt-6 flex items-center p-3 bg-amber-50 rounded-lg">
                  <Award size={20} className="text-amber-600 ml-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800">شهادة توثيق وأصالة معتمدة</p>
                    <p className="text-sm text-amber-700">صادرة من: {itemDetails.certificateAuthority}</p>
                    <Link href={itemDetails.certificate} className="flex items-center text-amber-600 hover:text-amber-700 mt-1 text-sm">
                      <Download size={14} className="ml-1" />
                      <span>تحميل الشهادة</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* خيارات المعاينة */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Info size={20} className="ml-2 text-amber-600" />
                خيارات المعاينة
              </h2>
              <ul className="space-y-2 text-gray-700">
                {itemDetails.viewingOptions.map((option, index) => (
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
            {/* معلومات المزايدة */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="text-sm text-gray-500">المزايدة الحالية</div>
                  <div className="text-3xl font-bold text-amber-600">{formatPrice(itemDetails.currentBid)} ريال</div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500">المزاد ينتهي في</div>
                  <div className="flex items-center text-red-600 font-semibold">
                    <Clock size={16} className="ml-1" />
                    <span>{calculateTimeLeft()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg flex items-start mb-6">
                <AlertCircle size={18} className="text-amber-600 ml-2 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">ملاحظة هامة</p>
                  <p>القطع النادرة تحتاج إلى توثيق إضافي. سيتم التواصل مع الفائز خلال 24 ساعة لإتمام عملية الشراء بأمان.</p>
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
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <div className="flex justify-between text-sm mt-1">
                    <span>الحد الأدنى: {formatPrice(itemDetails.nextMinBid)} ريال</span>
                    <span className="text-gray-500">زيادة: {formatPrice(itemDetails.bidIncrement)} ريال+</span>
                  </div>
                </div>

                <button className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition">
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
                    {itemDetails.seller.name}
                    {itemDetails.seller.verified && (
                      <span className="mr-2 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">موثق</span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="flex items-center text-amber-500 ml-1">
                      {itemDetails.seller.rating} ★
                    </span>
                    <span className="mx-1">•</span>
                    <span>{itemDetails.seller.transactions} عملية</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-5">
                <div className="flex items-center text-gray-600">
                  <MapPin size={16} className="ml-2" />
                  <span>{itemDetails.seller.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar size={16} className="ml-2" />
                  <span>عضو منذ {itemDetails.seller.joined}</span>
                </div>
              </div>
              
              <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition mb-2">
                طلب معلومات إضافية
              </button>
              <button className="w-full py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition">
                طلب معاينة
              </button>
            </div>

            {/* سجل المزايدات */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">سجل المزايدات</h2>
              
              {itemDetails.bids.length > 0 ? (
                <ul className="space-y-3">
                  {itemDetails.bids.map((bid, index) => (
                    <li key={index} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between">
                        <span className="font-medium">{bid.user}</span>
                        <span className="text-amber-600 font-bold">{formatPrice(bid.amount)} ريال</span>
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

      {/* قسم قطع مشابهة */}
      <div className="container mx-auto px-4 mt-16">
        <h2 className="text-2xl font-bold mb-6">قطع نادرة مشابهة قد تعجبك</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {itemDetails.similarItems.map((item) => (
            <Link 
              key={item.id} 
              href={`/auctions/auctions-4special/precious/${item.id}`}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group"
            >
              <div className="relative h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="text-lg font-bold group-hover:text-amber-600 transition">{item.title}</div>
                <div className="text-lg font-bold text-amber-600 mt-2">
                  {formatPrice(item.price)} ريال
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 