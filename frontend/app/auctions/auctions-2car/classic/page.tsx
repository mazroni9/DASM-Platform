'use client';

import { useState, useEffect } from 'react';
import LoadingLink from "@/components/LoadingLink";
import Image from 'next/image';
import { Award, Shield, Star, Users, ArrowLeft, Play } from 'lucide-react';
import ClassicCarCard from '@/components/ClassicCarCard';
import api from '@/lib/axios';
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import PaginationItem from '@mui/material/PaginationItem';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { title } from 'process';

export default function ClassicCarsAuctionPage() {
  const [showVideo, setShowVideo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState([]);
  const [pagination, setPagination] = useState({total: 0, last_page: 1});
  const [page, setPage] = useState(1);

  // تحديث البيانات من API
  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/cars/in-auctions?market_category=classic&page=${page}`)
      .then((res) => res.data)
      .then((data) => {
        setCars(data.data);
        setPagination(data.pagination);
      })
      .catch((err) => console.error("فشل في تحميل السيارات الكلاسيكية:", err))
      .finally(() => setLoading(false));
  }, [page]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* بانر الصفحة */}
      <div className="relative h-80 bg-gradient-to-r from-amber-800 to-amber-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
          <LoadingLink href="/auctions/auctions-2car" className="flex items-center text-white/80 hover:text-white mb-6 transition">
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة لسوق السيارات</span>
          </LoadingLink>
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
      
      {/* قائمة السيارات الكلاسيكية */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">السيارات الكلاسيكية المتاحة</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            // عرض skeleton cards أثناء التحميل
            Array.from(new Array(6)).map((_, index) => (
              <ClassicCarCard key={index} loading={true} />
            ))
          ) : cars.length === 0 ? (
            // عرض رسالة عدم وجود سيارات
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">
                لا توجد سيارات كلاسيكية متاحة حالياً.
              </p>
            </div>
          ) : (
            // عرض البيانات الحقيقية من API
            cars.map((car: any) => {
              // تحويل هيكل البيانات من API إلى هيكل ClassicCarCard
              const transformedCar = {
                id: car.id,
                title: car.title,
                description: car.description || `${car.make} ${car.model} ${car.year}`,
                evaluation_price: car.evaluation_price ? 
                  `${car.evaluation_price.toLocaleString()}` : 
                  'غير محدد',
                image: car.image,
                created_at:  car.created_at,
                status: car.active_auction?.status ,
                //status: 'upcoming' as const
              };
              return (
                <ClassicCarCard key={car.id} car={transformedCar} loading={false} />
              );
            })
          )}
        </div>

        {/* عرض Pagination فقط عند عدم التحميل ووجود بيانات */}
        {!loading && cars.length > 0 && (
          <Stack dir="rtl" spacing={2} className="mt-10 flex justify-center">
            <Pagination
              className="flex justify-center"
              dir="rtl"
              count={pagination.last_page}
              variant="outlined"
              color="primary"
              renderItem={item => (
                <PaginationItem
                slots={{ previous: NavigateNextIcon, next: NavigateBeforeIcon }}
                  {...item}
                />
              )}
              onChange={(e, page) => {
                console.log(e, page);
                setPage(page);
              }}
            />
          </Stack>
        )}
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