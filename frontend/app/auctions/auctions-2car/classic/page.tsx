'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Award, Shield, Star, Users, ChevronLeft, ArrowLeft, Heart, Play } from 'lucide-react';

export default function ClassicCarsAuctionPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showVideo, setShowVideo] = useState(false);
  
  // صور وهمية للسيارات الكلاسيكية
  const classicCars = [
    {
      id: 'c1',
      name: 'فورد موستانج 1967',
      description: 'موستانج فاستباك بحالة استثنائية، لون أصلي، محرك V8',
      estimatedPrice: '280,000 - 320,000',
      image: '/auctionsPIC/car-classicPIC/GpdqKuZXMAArNyp.jpg',
      auctionDate: '15 مايو 2025',
      status: 'upcoming'
    },
    {
      id: 'c2',
      name: 'شيفروليه كورفيت 1963',
      description: 'سبليت ويندو كوبيه، ترميم كامل، محرك أصلي',
      estimatedPrice: '450,000 - 520,000',
      image: '/auctionsPIC/car-classicPIC/1969 Pontiac Grand Prix SJ.png',
      auctionDate: '22 مايو 2025',
      status: 'upcoming'
    },
    {
      id: 'c3',
      name: 'مرسيدس SL 300 1957',
      description: 'نادرة جدًا، مستوردة من ألمانيا، جميع القطع أصلية',
      estimatedPrice: '900,000 - 1,100,000',
      image: '/auctionsPIC/car-classicPIC/1969 Pontiac Grand Prix SJ.png',
      auctionDate: '8 يونيو 2025',
      status: 'upcoming'
    },
    {
      id: 'c4',
      name: 'بورش 911 كاريرا 1973',
      description: 'طراز RS، حالة نادرة، كتالوج صيانة كامل',
      estimatedPrice: '550,000 - 600,000',
      image: '/1969 Pontiac Grand Prix SJ.png',
      auctionDate: 'تم البيع بمبلغ 580,000',
      status: 'past'
    },
    {
      id: 'c5',
      name: 'جاكوار E-Type 1962',
      description: 'سلسلة 1، كوبيه، ترميم حديث، وثائق كاملة',
      estimatedPrice: '700,000 - 750,000',
      image: '/1970 Plum Crazy Dodge Dart Swinger.jpg',
      auctionDate: 'تم البيع بمبلغ 725,000',
      status: 'past'
    }
  ];

  // تصفية السيارات حسب التبويب النشط
  const filteredCars = classicCars.filter(car => car.status === activeTab);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* بانر الصفحة */}
      <div className="relative h-80 bg-gradient-to-r from-amber-800 to-amber-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
          <Link href="/auctions/auctions-2car" className="flex items-center text-white/80 hover:text-white mb-6 transition">
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة لسوق السيارات</span>
          </Link>
          <h1 className="text-5xl font-bold text-white mb-4">سوق السيارات الكلاسيكية</h1>
          <p className="text-xl text-white/90 max-w-2xl">
            سيارات نادرة وأصيلة من الخمسينات والستينات والسبعينات بحالة ممتازة وتاريخ موثق
          </p>
        </div>
      </div>
      
      {/* عرض الفيديو */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold mb-6">متحف السيارات السلطانية</h2>
          
          {showVideo ? (
            <div className="relative pt-[56.25%] rounded-lg overflow-hidden">
              <video 
                className="absolute inset-0 w-full h-full object-cover" 
                controls 
                src="/auctionsPIC/car-classicPIC/متحف السيارات السلطانية.mp4" 
              />
            </div>
          ) : (
            <div 
              className="relative rounded-lg overflow-hidden cursor-pointer" 
              style={{ paddingTop: '56.25%' }} 
              onClick={() => setShowVideo(true)}
            >
              <Image 
                src="/auctionsPIC/car-classicPIC/1969 Pontiac Grand Prix SJ.png" 
                alt="صورة غلاف الفيديو" 
                fill 
                className="object-cover" 
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center">
                  <Play size={36} className="text-amber-600 mr-1" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4">
                <h3 className="text-xl font-bold">متحف السيارات السلطانية</h3>
                <p>اضغط للمشاهدة</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* معرض الصور */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">معرض الصور</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-lg overflow-hidden shadow-md aspect-video relative group">
            <Image src="/auctionsPIC/car-classicPIC/1969 Pontiac Grand Prix SJ.png" alt="سيارة كلاسيكية" fill className="object-cover transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
              <div className="p-4 text-white">
                <p className="font-bold">بونتياك جراند بريكس SJ 1969</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden shadow-md aspect-video relative group">
            <Image src="/auctionsPIC/car-classicPIC/GpdqKuZXMAArNyp.jpg" alt="سيارة كلاسيكية" fill className="object-cover transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
              <div className="p-4 text-white">
                <p className="font-bold">سيارة كلاسيكية</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* المميزات */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">لماذا تشارك في سوق السيارات الكلاسيكية؟</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <Award size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">سيارات نادرة ومعتمدة</h3>
            <p className="text-gray-600">جميع السيارات في سوقنا مُدققة ومعتمدة من خبراء السيارات الكلاسيكية.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <Shield size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">ضمان الأصالة</h3>
            <p className="text-gray-600">نضمن أصالة جميع السيارات وقطعها، مع توثيق كامل لتاريخ وأوراق كل سيارة.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <Star size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">تقييم عادل</h3>
            <p className="text-gray-600">يتم تقييم جميع السيارات بدقة من قبل خبراء مستقلين لضمان سعر عادل.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <Users size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">مجتمع المهتمين</h3>
            <p className="text-gray-600">انضم إلى مجتمع عشاق السيارات الكلاسيكية وشارك شغفك مع الآخرين.</p>
          </div>
        </div>
      </div>
      
      {/* الأسواق القادمة والسابقة */}
      <div className="container mx-auto px-4 py-12">
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex -mb-px space-x-8 justify-center">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-4 px-1 border-b-2 font-medium text-lg ${
                activeTab === 'upcoming'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              الأسواق القادمة
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`py-4 px-1 border-b-2 font-medium text-lg ${
                activeTab === 'past'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              الأسواق السابقة
            </button>
          </nav>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCars.map((car) => (
            <div key={car.id} className="bg-white rounded-xl shadow-md overflow-hidden group">
              <div className="relative h-64 w-full">
                <Image
                  src={car.image}
                  alt={car.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <button 
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-amber-500"
                  title="إضافة للمفضلة"
                  aria-label="إضافة للمفضلة"
                >
                  <Heart size={20} />
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{car.name}</h3>
                <p className="text-gray-600 mb-4">{car.description}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">السعر التقديري</p>
                    <p className="font-semibold text-amber-600">{car.estimatedPrice} ريال</p>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar size={16} className="ml-1" />
                    <span>{car.auctionDate}</span>
                  </div>
                </div>
                <div className="mt-6">
                  {car.status === 'upcoming' ? (
                    <button className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-medium transition">
                      سجل للمشاركة في السوق
                    </button>
                  ) : (
                    <div className="w-full py-2 bg-gray-100 text-gray-700 rounded-md font-medium text-center">
                      تم الانتهاء من السوق
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* للاشتراك */}
      <div className="bg-amber-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">كن أول من يعلم عن الأسواق القادمة</h2>
            <p className="text-gray-700 mb-8">اشترك في قائمتنا البريدية للحصول على إشعارات حول الأسواق الكلاسيكية القادمة والأخبار الحصرية.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                className="flex-1 px-4 py-3 rounded-md border-gray-300 focus:border-amber-500 focus:ring focus:ring-amber-200"
              />
              <button className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-md font-medium transition">
                اشترك الآن
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 