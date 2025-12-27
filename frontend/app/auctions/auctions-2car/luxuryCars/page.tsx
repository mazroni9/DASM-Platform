/**
 * 📝 الصفحة: مزادات السيارات الفاخرة
 * 📁 المسار: Frontend-local/app/auctions/auctions-2car/luxuryCars/page.tsx
 *
 * ✅ الوظيفة:
 * - عرض قائمة السيارات الفاخرة المتاحة للمزاد
 * - تصفية السيارات حسب الفئة والماركة والسعر
 * - عرض تفاصيل أولية وصور للسيارات
 *
 * 🔄 الارتباطات:
 * - تنتقل من: الصفحة الرئيسية لمزادات السيارات
 * - يتم التنقل إلى: صفحات تفاصيل السيارات الفردية
 */

"use client";

import React, { useEffect, useState } from "react";
// استيراد مكون AuctionCard من المسار الصحيح
import AuctionCard from "@/components/AuctionCard";
import LoadingLink from "@/components/LoadingLink";
import api from "@/lib/axios";
import { ChevronRight } from "lucide-react";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import PaginationItem from '@mui/material/PaginationItem';
import Skeleton from '@mui/material/Skeleton';
import PageHeader from '@/components/shared/PageHeader';

import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export default function LuxuryCarsPage() {
  const [cars, setCars] = useState([]);
  const [pagination, setPagination] = useState({total:0,last_page:1});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
      api
      .get(`/api/cars/in-auctions?market_category=luxuryCars&page=${page}`)
      .then((res) => res.data)
      .then((data) => {
        setCars(data.data);
        setPagination(data.pagination);
      })
      .catch((err) => console.error("فشل في تحميل السيارات الفاخرة:", err))
      .finally(() => setLoading(false));
     
}, [page]);

  return (
    <div className="min-h-screen  from-gray-900  py-12 px-6">
       <PageHeader 
       color="indigo"
        title="سوق السيارات الفارهة"
        description="اكتشف مجموعتنا المميزة من السيارات الفارهة بأسعار تنافسية وخيارات فاخرة لا مثيل لها."
        backUrl="/auctions/auctions-2car"
        backLabel="العودة إلى سوق السيارات"
        gradient={true}
      />
      <div className="max-w-7xl mt-10 mx-auto">
       
        {/* عرض المحتوى مع skeleton loading */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            // عرض skeleton cards أثناء التحميل
            Array.from(new Array(6)).map((_, index) => (
              <AuctionCard key={index} loading={true} />
            ))
          ) : cars.length === 0 ? (
            // عرض رسالة عدم وجود سيارات
            <div className="col-span-full">
              <p className="text-center text-gray-300">
                لا توجد سيارات فاخرة حالياً.
              </p>
            </div>
          ) : (
            // عرض البيانات الحقيقية
            cars.map((item: any) => (
              <AuctionCard car={item} key={item.id} loading={false} />
            ))
          )}
        </div>

        {/* عرض Pagination فقط عند عدم التحميل ووجود بيانات */}
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
      </div>
    </div>
  );
}
