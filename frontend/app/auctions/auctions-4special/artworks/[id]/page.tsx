'use client';

import { useState, useEffect } from 'react';
import LoadingLink from "@/components/LoadingLink";
import Image from 'next/image';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Shield, 
  Award, 
  Heart, 
  Share2, 
  User, 
  MapPin, 
  Info, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Search
} from 'lucide-react';

// بيانات مؤقتة للقطع الفنية (ستأتي من API في التطبيق الفعلي)
const artworksData = [
  {
    id: 'a1',
    title: 'لوحة الصحراء العربية',
    artist: 'محمد العبدالله',
    year: '2018',
    description: 'لوحة زيتية تصور الصحراء العربية بألوان دافئة ومناظر طبيعية خلابة، تُظهر اللوحة جمال الكثبان الرملية وقت غروب الشمس، مع قافلة من الإبل في المشهد البعيد. استخدم الفنان تقنيات متميزة في مزج الألوان وإظهار تدرجات الضوء والظل لإضفاء عمق استثنائي على المشهد.',
    category: 'لوحات',
    medium: 'زيت على قماش',
    dimensions: '120 × 80 سم',
    weight: '4.5 كجم (مع الإطار)',
    frame: 'إطار خشبي مذهب',
    condition: 'ممتازة',
    estimatedPrice: '25,000 - 35,000',
    startPrice: '25,000',
    currentBid: '27,500',
    nextMinBid: '28,000',
    bids: [
      { amount: '27,500', bidder: 'المشتري #4327', time: '2025-07-12 14:30' },
      { amount: '27,000', bidder: 'المشتري #1856', time: '2025-07-12 10:15' },
      { amount: '26,000', bidder: 'المشتري #3298', time: '2025-07-11 18:40' },
      { amount: '25,500', bidder: 'المشتري #2175', time: '2025-07-11 09:22' },
      { amount: '25,000', bidder: 'المشتري #4327', time: '2025-07-10 16:05' },
    ],
    bidCount: 8,
    endDate: '2025-07-15',
    provenance: 'معرض الرياض للفنون، المجموعة الخاصة للأمير سلطان بن فهد',
    certificate: 'شهادة أصالة من اتحاد الفنانين العرب، مرفقة مع اللوحة',
    history: 'رُسمت هذه اللوحة بتكليف خاص للمعرض السنوي للفنون العربية في دبي عام 2018، وحصلت على جائزة لجنة التحكيم الخاصة. قام الفنان بإنتاج ثلاث نسخ فقط من هذا العمل، وهذه هي النسخة الأولى.',
    images: ['/artwork1.jpg', '/artwork1-detail1.jpg', '/artwork1-detail2.jpg', '/artwork1-certificate.jpg'],
    seller: {
      name: 'المعرض الوطني للفنون',
      rating: 4.9,
      sales: 123,
      location: 'الرياض، المملكة العربية السعودية',
      verified: true
    },
    similarItems: [
      { id: 'a3', title: 'الخط العربي - آية الكرسي', image: '/artwork3.jpg', price: '28,000' },
      { id: 'a5', title: 'سجادة فارسية أنتيكة', image: '/artwork5.jpg', price: '130,000' }
    ]
  },
  // يمكن إضافة المزيد من القطع الفنية هنا
];

export default function ArtworkDetailsPage({ params }) {
  const { id } = params;
  const [artwork, setArtwork] = useState<typeof artworksData[0] | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  
  useEffect(() => {
    // محاكاة جلب البيانات من API
    const fetchArtwork = () => {
      setTimeout(() => {
        const foundArtwork = artworksData.find(item => item.id === id);
        if (foundArtwork) {
          setArtwork(foundArtwork);
          setBidAmount(foundArtwork.nextMinBid);
        }
        setLoading(false);
      }, 500);
    };
    
    fetchArtwork();
  }, [id]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-purple-600 text-xl">جاري تحميل بيانات القطعة الفنية...</div>
      </div>
    );
  }
  
  if (!artwork) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">عذراً، القطعة الفنية غير موجودة</div>
          <LoadingLink 
            href="/auctions/auctions-special/artworks" 
            className="inline-flex items-center text-purple-600 hover:text-purple-800"
          >
            <ArrowLeft size={16} className="ml-1" />
            <span>العودة إلى معرض الفنون</span>
          </LoadingLink>
        </div>
      </div>
    );
  }
  
  const handleBid = (e) => {
    e.preventDefault();
    alert(`تم تسجيل مزايدتك بمبلغ ${bidAmount} ريال. سنقوم بالتواصل معك للتأكيد.`);
  };
  
  const nextImage = () => {
    setActiveImage((prev) => (prev === artwork.images.length - 1 ? 0 : prev + 1));
  };
  
  const prevImage = () => {
    setActiveImage((prev) => (prev === 0 ? artwork.images.length - 1 : prev - 1));
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 py-6">
        <div className="container mx-auto px-4">
          <LoadingLink 
            href="/auctions/auctions-special/artworks" 
            className="inline-flex items-center text-white/90 hover:text-white transition"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى معرض الفنون</span>
          </LoadingLink>
          <h1 className="text-3xl font-bold text-white mt-2">{artwork.title}</h1>
          <div className="flex items-center text-white/80 mt-1">
            <User size={16} className="ml-1" />
            <span className="ml-1">الفنان: {artwork.artist}</span>
            <span className="mx-2">•</span>
            <span>{artwork.year}</span>
          </div>
        </div>
      </div>
      
      {/* عارض الصور والمزاد */}
      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* قسم الصور - عمود واحد على الأجهزة الصغيرة، عمودان على الأجهزة الكبيرة */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* الصورة الرئيسية */}
              <div className="relative h-[400px] md:h-[500px] bg-gray-100">
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">صورة القطعة الفنية</span>
                </div>
                
                {/* أزرار التنقل */}
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition"
                  aria-label="الصورة السابقة"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition"
                  aria-label="الصورة التالية"
                >
                  <ChevronRight size={24} />
                </button>
                
                {/* زر التكبير */}
                <button 
                  onClick={() => setShowZoom(true)}
                  className="absolute bottom-4 left-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition"
                  aria-label="تكبير الصورة"
                >
                  <Search size={20} />
                </button>
              </div>
              
              {/* مصغرات الصور */}
              <div className="flex p-4 gap-2 overflow-x-auto">
                {artwork.images.map((image, index) => (
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
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">وصف القطعة الفنية</h2>
              <p className="text-gray-700 leading-relaxed">{artwork.description}</p>
            </div>
            
            {/* التفاصيل التقنية */}
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">المواصفات التفصيلية</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">الفئة</span>
                  <span className="font-medium">{artwork.category}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">الوسيط</span>
                  <span className="font-medium">{artwork.medium}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">الأبعاد</span>
                  <span className="font-medium">{artwork.dimensions}</span>
                </div>
                <div className="flex flex-col border-b pb-2">
                  <span className="text-gray-500 text-sm">الحالة</span>
                  <span className="font-medium">{artwork.condition}</span>
                </div>
                {artwork.weight && (
                  <div className="flex flex-col border-b pb-2">
                    <span className="text-gray-500 text-sm">الوزن</span>
                    <span className="font-medium">{artwork.weight}</span>
                  </div>
                )}
                {artwork.frame && (
                  <div className="flex flex-col border-b pb-2">
                    <span className="text-gray-500 text-sm">الإطار</span>
                    <span className="font-medium">{artwork.frame}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* تاريخ وأصالة القطعة */}
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">تاريخ وأصالة القطعة</h2>
              
              {artwork.history && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">تاريخ القطعة</h3>
                  <p className="text-gray-600">{artwork.history}</p>
                </div>
              )}
              
              {artwork.provenance && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">مصدر القطعة</h3>
                  <p className="text-gray-600">{artwork.provenance}</p>
                </div>
              )}
              
              {artwork.certificate && (
                <div className="mt-4 bg-purple-50 p-4 rounded-lg flex items-start">
                  <Shield className="text-purple-600 ml-3 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-purple-800 mb-1">شهادة الأصالة</h3>
                    <p className="text-purple-700 text-sm">{artwork.certificate}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* قسم المزاد - عمود واحد */}
          <div className="space-y-6">
            {/* معلومات المزاد */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="text-sm text-gray-500">المزايدة الحالية</div>
                  <div className="text-3xl font-bold text-purple-700">{artwork.currentBid} ريال</div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500">ينتهي في</div>
                  <div className="flex items-center text-red-600 font-semibold">
                    <Clock size={16} className="ml-1" />
                    <span>{artwork.endDate}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>السعر التقديري:</span>
                  <span>{artwork.estimatedPrice} ريال</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mb-3">
                  <span>الحد الأدنى للمزايدة:</span>
                  <span>{artwork.nextMinBid} ريال</span>
                </div>
              </div>
              
              <form onSubmit={handleBid} className="space-y-4">
                <div>
                  <label htmlFor="bid-amount" className="block text-sm text-gray-600 mb-1">قم بإدخال قيمة مزايدتك (بالريال)</label>
                  <input 
                    type="number" 
                    id="bid-amount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min={artwork.nextMinBid}
                    step="500"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                    placeholder="أدخل مبلغ المزايدة"
                  />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition"
                >
                  تقديم المزايدة
                </button>
              </form>
              
              <div className="flex gap-2 mt-4">
                <button className="flex-1 flex justify-center items-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                  <Heart size={18} />
                  <span>المفضلة</span>
                </button>
                <button className="flex-1 flex justify-center items-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                  <Share2 size={18} />
                  <span>مشاركة</span>
                </button>
              </div>
            </div>
            
            {/* معلومات البائع */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">معلومات البائع</h2>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div className="mr-3">
                  <div className="font-bold flex items-center">
                    {artwork.seller.name}
                    {artwork.seller.verified && (
                      <Check size={14} className="mr-1 text-blue-500" />
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="text-amber-500 ml-1">★ {artwork.seller.rating}</span>
                    <span className="mx-1">•</span>
                    <span>{artwork.seller.sales} عملية بيع</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center text-gray-600 mb-6">
                <MapPin size={16} className="ml-2" />
                <span>{artwork.seller.location}</span>
              </div>
              
              <button className="w-full py-2.5 border border-purple-600 text-purple-600 hover:bg-purple-50 rounded-lg transition">
                تواصل مع البائع
              </button>
            </div>
            
            {/* سجل المزايدات */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">سجل المزايدات</h2>
              
              <ul className="space-y-3">
                {artwork.bids && artwork.bids.map((bid, index) => (
                  <li key={index} className="border-b pb-2 last:border-0">
                    <div className="flex justify-between">
                      <span>{bid.bidder}</span>
                      <span className="font-bold text-purple-600">{bid.amount} ريال</span>
                    </div>
                    <div className="text-xs text-gray-500">{bid.time}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* قطع مشابهة */}
      {artwork.similarItems && artwork.similarItems.length > 0 && (
        <div className="container mx-auto px-4 mt-16">
          <h2 className="text-2xl font-bold mb-6">قطع فنية مشابهة قد تعجبك</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {artwork.similarItems.map(item => (
              <LoadingLink 
                key={item.id} 
                href={`/auctions/auctions-special/artworks/${item.id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group"
              >
                <div className="relative h-48 bg-gray-200">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-gray-400">صورة القطعة</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold group-hover:text-purple-600 transition">{item.title}</h3>
                  <div className="mt-2 font-semibold text-purple-600">{item.price} ريال</div>
                </div>
              </LoadingLink>
            ))}
          </div>
        </div>
      )}
      
      {/* مشاهدة الصورة بشكل مكبر */}
      {showZoom && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" 
          onClick={() => setShowZoom(false)}
        >
          <div className="relative w-full max-w-4xl h-4/5">
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">صورة مكبرة للقطعة الفنية</span>
            </div>
            <button 
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
              onClick={() => setShowZoom(false)}
              aria-label="إغلاق"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 