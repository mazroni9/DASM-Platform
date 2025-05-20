'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Download,
  MapPin,
  MessageCircle,
  ShoppingBag,
  Heart as HeartIcon,
  Share2,
  Shield,
  Clock
} from 'lucide-react';

export default function WatchDetailPage({ params }) {
  const { id } = params;
  
  // سيتم استبدال هذا لاحقًا بجلب البيانات من قاعدة البيانات
  const watchDetails = {
    id: id,
    title: 'Rolex Daytona Cosmograph',
    reference: '116500LN',
    brand: 'Rolex',
    description: 'ساعة رولكس دايتونا كوزموغراف موديل 116500LN، بحالة ممتازة كالجديدة. تم شراؤها من وكيل رولكس الرسمي في دبي عام 2021، ولم تستخدم إلا نادرًا. الساعة مصنوعة من الستانلس ستيل 904L مع إطار سيراميك أسود ومينا أبيض. تحتوي على ميزة الكرونوغراف وعداد تاكيميتر. تأتي مع العلبة الأصلية وجميع الأوراق والضمان الدولي.',
    price: 290000,
    minBid: 295000,
    currentBid: 310000,
    condition: 'ممتازة (كالجديدة)',
    year: '2021',
    bidCount: 8,
    endDate: new Date('2023-12-30'),
    hasBox: true,
    hasWarranty: true,
    hasPapers: true,
    movement: 'أوتوماتيكي (Caliber 4130)',
    case: 'ستانلس ستيل 904L',
    bezel: 'سيراميك أسود',
    dial: 'أبيض',
    bracelet: 'أويستر - ستانلس ستيل',
    diameter: '40mm',
    thickness: '12.5mm',
    waterResistance: '100 متر',
    certificate: '/reports/rolex-certificate.pdf',
    seller: {
      name: 'خالد الأحمد',
      rating: 4.9,
      transactions: 24,
      location: 'الرياض، السعودية',
      joined: '2020',
    },
    images: [
      '/watches/rolex-daytona-1.jpg',
      '/watches/rolex-daytona-2.jpg',
      '/watches/rolex-daytona-3.jpg',
      '/watches/rolex-daytona-4.jpg',
      '/watches/rolex-daytona-5.jpg',
    ],
    bids: [
      { amount: 310000, user: 'محمد س.', date: '2023-12-10 14:23' },
      { amount: 305000, user: 'أحمد ع.', date: '2023-12-09 16:45' },
      { amount: 300000, user: 'سلطان م.', date: '2023-12-08 10:12' },
      { amount: 295000, user: 'عبدالله خ.', date: '2023-12-07 09:34' },
    ]
  };

  const [activeImage, setActiveImage] = useState(0);
  const [bidAmount, setBidAmount] = useState(watchDetails.currentBid + 5000);

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const calculateTimeLeft = () => {
    const now = new Date();
    const difference = watchDetails.endDate.getTime() - now.getTime();
    
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
      <div className="bg-gradient-to-r from-yellow-700 to-amber-600 py-6">
        <div className="container mx-auto px-4">
          <Link 
            href="/auctions/auctions-4special/watches" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى سوق الساعات الفاخرة</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">{watchDetails.title}</h1>
          <div className="flex items-center mt-2 text-white/80">
            <span>الرقم المرجعي: {watchDetails.reference}</span>
            <span className="mx-2">•</span>
            <span>الماركة: {watchDetails.brand}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* قسم الصور والتفاصيل - 3 أعمدة */}
          <div className="lg:col-span-3 space-y-8">
            {/* عارض الصور */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="relative h-[400px] md:h-[500px] bg-gray-100">
                {/* الصورة الرئيسية */}
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">صورة الساعة {activeImage + 1}</span>
                </div>
                
                {/* أزرار التنقل */}
                <button 
                  onClick={() => setActiveImage((prev) => (prev === 0 ? watchDetails.images.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition"
                  aria-label="الصورة السابقة"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={() => setActiveImage((prev) => (prev === watchDetails.images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition"
                  aria-label="الصورة التالية"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
              
              {/* معرض الصور المصغر */}
              <div className="flex p-4 gap-2 overflow-x-auto">
                {watchDetails.images.map((image, index) => (
                  <button 
                    key={index} 
                    onClick={() => setActiveImage(index)}
                    className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                      activeImage === index ? 'border-yellow-600' : 'border-transparent'
                    }`}
                  >
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-400">{index + 1}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* وصف الساعة */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">وصف الساعة</h2>
              <p className="text-gray-700 leading-relaxed">{watchDetails.description}</p>
            </div>

            {/* المواصفات الفنية */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">المواصفات الفنية</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">الحركة</span>
                  <span className="font-medium">{watchDetails.movement}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">العلبة</span>
                  <span className="font-medium">{watchDetails.case}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">الإطار</span>
                  <span className="font-medium">{watchDetails.bezel}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">المينا</span>
                  <span className="font-medium">{watchDetails.dial}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">السوار</span>
                  <span className="font-medium">{watchDetails.bracelet}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">القطر</span>
                  <span className="font-medium">{watchDetails.diameter}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">السماكة</span>
                  <span className="font-medium">{watchDetails.thickness}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">مقاومة الماء</span>
                  <span className="font-medium">{watchDetails.waterResistance}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">سنة الإنتاج</span>
                  <span className="font-medium">{watchDetails.year}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">الحالة</span>
                  <span className="font-medium">{watchDetails.condition}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                {watchDetails.hasBox && (
                  <div className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                    <Shield size={16} className="ml-1.5" />
                    <span>مع العلبة الأصلية</span>
                  </div>
                )}
                {watchDetails.hasWarranty && (
                  <div className="flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
                    <FileText size={16} className="ml-1.5" />
                    <span>مع بطاقة الضمان</span>
                  </div>
                )}
                {watchDetails.hasPapers && (
                  <div className="flex items-center px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-sm">
                    <FileText size={16} className="ml-1.5" />
                    <span>مع الأوراق الرسمية</span>
                  </div>
                )}
              </div>
            </div>

            {/* شهادة الفحص */}
            {watchDetails.certificate && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">شهادة الفحص والأصالة</h2>
                <p className="text-gray-700 mb-4">
                  تم فحص هذه الساعة والتحقق من أصالتها بواسطة خبراء معتمدين في مجال الساعات الفاخرة.
                </p>
                <Link href={watchDetails.certificate} className="flex items-center text-yellow-600 hover:text-yellow-700">
                  <Download size={18} className="ml-2" />
                  <span>تحميل شهادة الفحص والأصالة</span>
                </Link>
              </div>
            )}
          </div>

          {/* قسم المزايدة والبائع - 2 أعمدة */}
          <div className="lg:col-span-2 space-y-6">
            {/* معلومات المزايدة */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="text-sm text-gray-500">المزايدة الحالية</div>
                  <div className="text-3xl font-bold text-yellow-600">{formatPrice(watchDetails.currentBid)} ريال</div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500">المزاد ينتهي في</div>
                  <div className="flex items-center text-red-600 font-semibold">
                    <Clock size={16} className="ml-1" />
                    <span>{calculateTimeLeft()}</span>
                  </div>
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
                    min={watchDetails.currentBid + 1000}
                    step={1000}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                  <div className="flex justify-between text-sm mt-1">
                    <span>الحد الأدنى: {formatPrice(watchDetails.currentBid + 1000)} ريال</span>
                    <span className="text-gray-500">زيادة: 1,000 ريال+</span>
                  </div>
                </div>

                <button className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition">
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
                  <div className="font-bold">{watchDetails.seller.name}</div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="flex items-center text-yellow-500 ml-1">
                      {watchDetails.seller.rating} ★
                    </span>
                    <span className="mx-1">•</span>
                    <span>{watchDetails.seller.transactions} عملية</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-5">
                <div className="flex items-center text-gray-600">
                  <MapPin size={16} className="ml-2" />
                  <span>{watchDetails.seller.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar size={16} className="ml-2" />
                  <span>عضو منذ {watchDetails.seller.joined}</span>
                </div>
              </div>
              
              <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition mb-2">
                تواصل مع البائع
              </button>
              <button className="w-full py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition">
                طلب معاينة
              </button>
            </div>

            {/* سجل المزايدات */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">سجل المزايدات</h2>
              
              {watchDetails.bids.length > 0 ? (
                <ul className="space-y-3">
                  {watchDetails.bids.map((bid, index) => (
                    <li key={index} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between">
                        <span className="font-medium">{bid.user}</span>
                        <span className="text-yellow-600 font-bold">{formatPrice(bid.amount)} ريال</span>
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

      {/* قسم ساعات مشابهة */}
      <div className="container mx-auto px-4 mt-16">
        <h2 className="text-2xl font-bold mb-6">ساعات مشابهة قد تعجبك</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* ساعات مشابهة ستأتي من قاعدة البيانات */}
          {/* هذه نماذج توضيحية */}
          {[1, 2, 3, 4].map((item) => (
            <Link 
              key={item} 
              href={`/auctions/auctions-4special/watches/${item}`}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group"
            >
              <div className="relative h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="text-lg font-bold group-hover:text-yellow-600 transition">ساعة مشابهة {item}</div>
                <div className="text-gray-600 text-sm mb-2">Rolex / Patek Philippe / AP</div>
                <div className="text-lg font-bold text-yellow-600 mt-2">
                  {formatPrice(Math.floor(Math.random() * 500000) + 50000)} ريال
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 