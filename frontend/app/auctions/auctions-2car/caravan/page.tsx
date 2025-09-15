'use client';

import LoadingLink from "@/components/LoadingLink";
import React, { useEffect, useState } from "react";
import PageHeader from '@/components/shared/PageHeader';
import CaravanCard from "@/components/CaravanCard";
import api from "@/lib/axios";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import PaginationItem from '@mui/material/PaginationItem';

import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
export default function CaravanAuctionsPage() {

  const [caravanAuctions, setCaravanAuctions] = useState([]);
  const [pagination, setPagination] = useState({total:0,last_page:1});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/cars/in-auctions?market_category=caravan&page=${page}`)
      .then((res) => res.data)
      .then((data) => {
        setCaravanAuctions(data.data);
        setPagination(data.pagination);
      })
      .catch((err) => console.error("فشل في تحميل السيارات الفاخرة:", err))
      .finally(() => setLoading(false));
}, [page]);

  const currentPageUrl = '/auctions/auctions-car/caravan';
  // قائمة أسواق الكرفانات مع الصور المتعددة
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* رأس الصفحة */}
      <PageHeader 
        title="سوق الكرفانات"
        backUrl="/auctions/auctions-2car"
        backLabel="العودة إلى سوق السيارات"
        gradient={true}
      />

      {/* نص توضيحي حول آلية السوق */}
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-700">
            نلغي لعبة التقييمات الجائرة عبر مزايدة عادلة بسعر بائع مخفي. المنافسة تعتمد على العرض والطلب الطبيعي، مع تدخلنا كوسيط لموازنة التوقعات وضمان بيئة موثوقة لكل الأطراف
          </p>
        </div>
      </div>

      {/* قائمة الكرفانات */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            // عرض skeleton cards أثناء التحميل
            Array.from(new Array(6)).map((_, index) => (
              <CaravanCard key={index} loading={true} />
            ))
          ) : caravanAuctions.length === 0 ? (
            // عرض رسالة عدم وجود كرفانات
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">
                لا توجد كرفانات متاحة حالياً.
              </p>
            </div>
          ) : (
            // عرض البيانات الحقيقية
            caravanAuctions.map((item) => (
              <CaravanCard key={item.id} caravan={item} loading={false} />
            ))
          )}
        </div>

        {/* عرض Pagination فقط عند عدم التحميل ووجود بيانات */}
        {!loading && caravanAuctions.length > 0 && (
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
              onChange={(e,page)=>{
                console.log(e,page);
                setPage(page)
              }}
            />
          </Stack>
        )}
      </div>

      {/* قسم إضافة كرفان للسوق */}
      <div className="bg-green-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">هل لديك كرفان للبيع في السوق؟</h2>
            <p className="text-gray-600 mb-8">
              نحن نبحث دائمًا عن كرفانات مميزة لعرضها في منصتنا. سجل بياناتك وسنتواصل معك لإتمام عملية التسجيل.
            </p>
            <LoadingLink 
              href="/auctions/auctions-car/caravan/register"
              className="inline-block px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
            >
              تسجيل كرفان للسوق
            </LoadingLink>
          </div>
        </div>
      </div>
    </div>
  );
} 