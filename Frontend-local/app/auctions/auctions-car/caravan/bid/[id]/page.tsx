'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Calendar, Users, DollarSign, ThumbsUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CaravanBidPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const caravanId = params.id as string;
  
  // Get the referrer URL if it exists
  const referrer = searchParams.get('from');
  const backUrl = referrer || '/auctions/auctions-car/caravan';
  
  // Determine the back button text based on the URL
  const getBackButtonText = () => {
    if (referrer?.includes('auctions-special/jewelry')) {
      return 'العودة إلى مزادات المجوهرات والحلي';
    } else if (referrer?.includes('auctions-main')) {
      return 'العودة إلى المزادات الرئيسية';
    } else {
      return 'العودة إلى سوق الكرفانات';
    }
  };
  
  const [caravan, setCaravan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bidResult, setBidResult] = useState<{success: boolean; message: string} | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // بيانات الكرفانات الوهمية - في التطبيق الحقيقي ستأتي من API
  const caravanData = [
    {
      id: "1",
      title: 'كرفان فاخر موديل 2023',
      description: 'كرفان جديد مع كافة المميزات الحديثة ومساحة داخلية واسعة',
      fullDescription: 'كرفان جديد مع كافة المميزات الحديثة ومساحة داخلية واسعة، يحتوي على مميزات متعددة ومطبخ مجهز بالكامل ومكيف وتدفئة وحمام متكامل. مناسب للعائلات والرحلات الطويلة.',
      image: '/auctionsPIC/car-caravanPIC/caravan-1.jpg',
      images: [
        '/auctionsPIC/car-caravanPIC/caravan-1.jpg',
        '/auctionsPIC/car-caravanPIC/caravan-2.jpg',
        '/auctionsPIC/car-caravanPIC/caravan-3.jpg',
      ],
      price: '120,000',
      minBid: '120,000',
      currentBid: '125,000',
      location: 'الرياض',
      date: '15 سبتمبر 2023',
      capacity: '6 أشخاص',
      features: ['مطبخ', 'حمام', 'تدفئة', 'مكيف', 'شاشة تلفزيون', 'ثلاجة'],
      specs: {
        model: '2023',
        make: 'فيات دوكاتو',
        length: '6.5 متر',
        width: '2.3 متر',
        height: '2.8 متر',
        weight: '3500 كجم',
        engine: '2.3 لتر ديزل',
        fuel: 'ديزل',
        transmission: 'أوتوماتيك',
        drive: 'دفع خلفي',
        mileage: '0 كم',
        condition: 'جديد'
      }
    },
    {
      id: "2",
      title: 'كرفان سياحي متعدد الاستخدامات',
      description: 'مناسب للرحلات الطويلة مع تجهيزات كاملة وتصميم عملي',
      fullDescription: 'كرفان عملي ومريح مجهز بكافة وسائل الراحة للرحلات الطويلة، يناسب العائلات الصغيرة. مستورد حديثًا بحالة ممتازة. يأتي مع ضمان لمدة سنة على المحرك والتجهيزات الداخلية.',
      image: '/auctionsPIC/car-caravanPIC/caravan-2.jpg',
      images: [
        '/auctionsPIC/car-caravanPIC/caravan-2.jpg',
        '/auctionsPIC/car-caravanPIC/caravan-1.jpg',
        '/auctionsPIC/car-caravanPIC/caravan-3.jpg',
      ],
      price: '95,000',
      minBid: '95,000',
      currentBid: '98,000',
      location: 'جدة',
      date: '20 سبتمبر 2023',
      capacity: '4 أشخاص',
      features: ['مطبخ مصغر', 'حمام', 'سخان ماء', 'ثلاجة', 'مكيف'],
      specs: {
        model: '2020',
        make: 'فيات دوكاتو',
        length: '5.9 متر',
        width: '2.1 متر',
        height: '2.7 متر',
        weight: '3200 كجم',
        engine: '2.0 لتر ديزل',
        fuel: 'ديزل',
        transmission: 'يدوي',
        drive: 'دفع أمامي',
        mileage: '45,000 كم',
        condition: 'ممتاز'
      }
    },
    {
      id: "3",
      title: 'كرفان صحراوي مجهز بالكامل',
      description: 'تصميم متين مناسب للطرق الوعرة مع تجهيزات للرحلات البرية',
      fullDescription: 'كرفان خاص للطرق الوعرة والرحلات البرية. مجهز بإطارات خاصة وأنظمة تعليق متطورة تناسب الطرق الصحراوية. يحتوي على ألواح طاقة شمسية لإمدادات الكهرباء المستمرة ومولد احتياطي.',
      image: '/auctionsPIC/car-caravanPIC/caravan-3.jpg',
      images: [
        '/auctionsPIC/car-caravanPIC/caravan-3.jpg',
        '/auctionsPIC/car-caravanPIC/caravan-1.jpg',
        '/auctionsPIC/car-caravanPIC/caravan-2.jpg',
      ],
      price: '150,000',
      minBid: '150,000',
      currentBid: '155,000',
      location: 'الدمام',
      date: '25 سبتمبر 2023',
      capacity: '5 أشخاص',
      features: ['مطبخ', 'حمام', 'نظام تدفئة', 'ألواح شمسية', 'خزان مياه كبير', 'مولد كهرباء'],
      specs: {
        model: '2021',
        make: 'مرسيدس سبرينتر',
        length: '7.0 متر',
        width: '2.5 متر',
        height: '3.0 متر',
        weight: '3800 كجم',
        engine: '3.0 لتر ديزل',
        fuel: 'ديزل',
        transmission: 'أوتوماتيك',
        drive: 'دفع رباعي',
        mileage: '25,000 كم',
        condition: 'ممتاز'
      }
    }
  ];

  useEffect(() => {
    // محاكاة جلب البيانات من الخادم
    setLoading(true);
    
    // البحث عن الكرفان بالمعرف
    const foundCaravan = caravanData.find(item => item.id === caravanId);
    
    if (foundCaravan) {
      setCaravan(foundCaravan);
    } else {
      // إذا لم يتم العثور على الكرفان، نعود إلى صفحة المصدر أو الكرفانات الافتراضية
      router.push(backUrl);
    }
    
    setLoading(false);
  }, [caravanId, router, backUrl]);

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // التحقق من قيمة المزايدة
    const bidValue = parseInt(bidAmount.replace(/,/g, ''));
    const currentBidValue = parseInt(caravan.currentBid.replace(/,/g, ''));
    
    if (isNaN(bidValue) || bidValue <= currentBidValue) {
      setBidResult({
        success: false,
        message: 'يجب أن تكون قيمة العرض أعلى من السعر الحالي'
      });
      setSubmitting(false);
      return;
    }

    // محاكاة إرسال المزايدة للخادم
    setTimeout(() => {
      setSubmitting(false);
      setBidResult({
        success: true,
        message: 'تم تقديم العرض بنجاح! سنقوم بإخطارك إذا تم قبول عرضك.'
      });
      
      // تحديث السعر الحالي (هذا محاكاة فقط)
      setCaravan({
        ...caravan,
        currentBid: bidValue.toLocaleString()
      });
      
      // إعادة تعيين قيمة المزايدة
      setBidAmount('');
    }, 1500);
  };
  
  // التنقل بين الصور
  const nextImage = () => {
    if (!caravan || !caravan.images) return;
    setCurrentImageIndex((prev) => (prev === caravan.images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    if (!caravan || !caravan.images) return;
    setCurrentImageIndex((prev) => (prev === 0 ? caravan.images.length - 1 : prev - 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!caravan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">لم يتم العثور على الكرفان</h2>
          <button
            onClick={() => router.push(backUrl)}
            className="inline-block px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition"
          >
            {getBackButtonText()}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link 
              href={backUrl} 
              className="flex items-center text-white hover:text-white/90 transition"
            >
              <span className="ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </span>
              <span>{getBackButtonText()}</span>
            </Link>
            
            <h1 className="text-2xl md:text-3xl font-bold text-white text-center flex-1">{caravan.title}</h1>
            
            {/* عنصر فارغ للحفاظ على المحاذاة */}
            <div className="w-[100px]"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* صور وتفاصيل الكرفان */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              {/* معرض الصور */}
              <div className="p-4">
                <div className="relative aspect-[16/9] mb-2 overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={caravan.images[currentImageIndex]}
                    alt={caravan.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  
                  {/* زر السابق */}
                  {caravan.images.length > 1 && (
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 p-2 rounded-full text-white transition"
                      aria-label="الصورة السابقة"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6"/>
                      </svg>
                    </button>
                  )}
                  
                  {/* زر التالي */}
                  {caravan.images.length > 1 && (
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 p-2 rounded-full text-white transition"
                      aria-label="الصورة التالية"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </button>
                  )}
                  
                  {/* مؤشر الصورة الحالية */}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                    <div className="bg-black/40 px-3 py-1 rounded-full text-white text-xs">
                      {currentImageIndex + 1} / {caravan.images.length}
                    </div>
                  </div>
                </div>
                
                {/* الصور المصغرة */}
                {caravan.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {caravan.images.map((image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden ${
                          index === currentImageIndex ? 'ring-2 ring-orange-500' : 'ring-1 ring-gray-300'
                        }`}
                        aria-label={`عرض صورة ${index + 1}`}
                      >
                        <Image
                          src={image}
                          alt={`صورة مصغرة ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">{caravan.title}</h2>
                <p className="text-gray-600 mb-6">{caravan.fullDescription}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center text-gray-600">
                    <MapPin size={18} className="ml-2 text-orange-500" />
                    <span>الموقع: {caravan.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar size={18} className="ml-2 text-orange-500" />
                    <span>التاريخ: {caravan.date}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users size={18} className="ml-2 text-orange-500" />
                    <span>السعة: {caravan.capacity}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <DollarSign size={18} className="ml-2 text-orange-500" />
                    <span>السعر الحالي: {caravan.currentBid} ريال</span>
                  </div>
                </div>
                
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">المواصفات</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(caravan.specs).map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        <span className="text-gray-500 ml-2">
                          {key === 'model' ? 'الموديل:' :
                          key === 'make' ? 'الصانع:' :
                          key === 'length' ? 'الطول:' :
                          key === 'width' ? 'العرض:' :
                          key === 'height' ? 'الارتفاع:' :
                          key === 'weight' ? 'الوزن:' :
                          key === 'engine' ? 'المحرك:' :
                          key === 'fuel' ? 'الوقود:' :
                          key === 'transmission' ? 'ناقل الحركة:' :
                          key === 'drive' ? 'نظام الدفع:' :
                          key === 'mileage' ? 'المسافة المقطوعة:' :
                          key === 'condition' ? 'الحالة:' : key + ':'}
                        </span>
                        <span className="text-gray-800">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">المميزات</h3>
                  <div className="flex flex-wrap gap-2">
                    {caravan.features.map((feature: string) => (
                      <span 
                        key={feature} 
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* نموذج تقديم العرض */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">قدم عرضك</h3>
              
              <div className="mb-6">
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>السعر الأساسي:</span>
                  <span className="font-semibold">{caravan.price} ريال</span>
                </div>
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>أقل سعر مقبول:</span>
                  <span className="font-semibold">{caravan.minBid} ريال</span>
                </div>
                <div className="flex justify-between text-gray-600 mb-4">
                  <span>السعر الحالي:</span>
                  <span className="font-semibold text-orange-600">{caravan.currentBid} ريال</span>
                </div>
              </div>
              
              {bidResult && (
                <div className={`mb-6 p-4 rounded-lg ${bidResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <div className="flex items-start">
                    {bidResult.success ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                    )}
                    <p>{bidResult.message}</p>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmitBid}>
                <div className="mb-6">
                  <label htmlFor="bidAmount" className="block text-gray-700 mb-2">قيمة العرض (ريال)</label>
                  <input
                    type="text"
                    id="bidAmount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`أكثر من ${caravan.currentBid} ريال`}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3 rounded-lg font-medium ${
                    submitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  } transition-colors`}
                >
                  {submitting ? 'جاري تقديم العرض...' : 'قدم عرضك'}
                </button>
              </form>
              
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-start text-gray-600 text-sm">
                  <ThumbsUp size={16} className="ml-2 flex-shrink-0 mt-1" />
                  <p>بتقديم عرضك فأنت توافق على شروط وأحكام السوق، وتقر بأنك اطلعت على تفاصيل الكرفان ومواصفاته.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 