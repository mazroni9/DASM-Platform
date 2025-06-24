'use client';

import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { useEffect, useMemo, useState } from 'react';
import { Package, DollarSign, Truck, CheckCircle, MessageSquare, Loader2, Route } from 'lucide-react';
import { useAuth } from "@/hooks/useAuth";
import { redirect, useRouter  } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {Pagination} from 'react-laravel-paginex'
import axios from "axios";
import { PagesOutlined } from "@mui/icons-material";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Car } from "@/types/types";



export default function MyCarsPage() {

const getAuctionStatusTextAndIcon = (status: string) => {
  switch (status) {
    case 'available':
      return { text: 'متوفر', color: 'text-orange-600', icon: <DollarSign size={16} /> };
    case 'in_auction':
      return { text: 'في المزاد', color: 'text-orange-600', icon: <DollarSign size={16} /> };
    default:
      return { text: status, color: 'text-gray-500', icon: null };
  }
}

    const [loading, setLoading] = useState(true);
    const [PaginationData,setPagination]=useState([])
    const [cars, setCars] = useState<Car[]>([]);
    const { user, isLoggedIn } = useAuth();
    const [processingCarId, setProcessingCarId] = useState<number | null>(
        null
    );
    const router = useRouter();
    let options={
    containerClass: "pagination-container",
    prevButtonClass: "prev-button-class",
    nextButtonText: "التالي",
    prevButtonText: "السابق"
}
         const getData=(PaginationData)=>{
           axios.get('/api/cars?page=' + PaginationData.page).then(response => {
             const carsData = response.data.data.data || response.data.data;
                  setPagination(response.data.data)
                  setCars(carsData);
        });
        }


      // Verify user is authenticated
      useEffect(() => {
          if (!isLoggedIn) {
              router.push("/auth/login?returnUrl=/dashboard/profile");
          }
        }, [isLoggedIn, router]);


      // Fetch user profile data
  useEffect(() => {
      async function fetchCars() {
          if (!isLoggedIn) return;
          try {
              const response = await api.get("/api/cars");
              if (response.data.data || response.data.data) {
                  const carsData = response.data.data.data || response.data.data;
                  setPagination(response.data.data)
                  setCars(carsData);
                  console.log(carsData);
              }
                  
          } catch (error) {
              console.error("Error fetching profile:", error);
              toast.error("حدث خطأ أثناء تحميل بيانات الملف الشخصي");
          } finally {
              setLoading(false);
          }
      }

      fetchCars();
      
  }, []);



    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <span className="mr-2 text-xl">جاري تحميل البيانات...</span>
            </div>
        );
    }

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen" dir="rtl">
      
      {/* زر العودة إلى لوحة التحكم */}
      <BackToDashboard />

      <h1 className="text-3xl font-bold mb-4 text-center text-gray-800"> سيارتي ({cars.length}) </h1>

                   {cars.length === 0 ? (
  <p className="text-center text-gray-500">لم تقم بإضافة أي عناصر بعد.</p>
) : (
  
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">    {cars.map((car) => (
      <div key={car.id} className="bg-white rounded-lg shadow border border-gray-200 p-4 flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
           onClick={() => router.push(`/dashboard/mycars/${car.id}`)}>
          {/* صورة السيارة */}
        <div className="h-40 bg-gray-100 rounded mb-4 flex items-center justify-center overflow-hidden">
          
          <img
            src={
              (car.images && car.images.length > 0) ? car.images[0] :
              "https://cdn.pixabay.com/photo/2012/05/29/00/43/car-49278_1280.jpg"
            }
            alt={`${car.make} ${car.year}`}
            className="object-cover h-full w-full"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://via.placeholder.com/300x200?text=No+Image";
            }}
          />
        </div>

        {/* بيانات السيارة */}
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          {car.make} - {car.year} 
        </h2>
        <p className="text-sm text-gray-500 mb-1">العداد: {car.odometer}</p>
        <p className="text-sm text-gray-500 mb-1">المحرك: {car.engine}</p>        <p className="text-sm text-gray-500 mb-1">القير: {car.transmission}</p>
        <p className="text-sm text-gray-500 mb-1">المحرك: {car.engine}</p>
        <p className="text-sm text-gray-500 mb-1">القير: {car.transmission}</p>
        <p className="text-gray-500">هل تمت الموافقة ؟
          {car.auctions[0]?.control_room_approved ? (
            <span className="text-green-600">تمت الموافقة للمزاد </span>
          ) : (
            <span className="text-red-600">تحت المعالجة </span>
          )}
        </p> 
        <p className="text-sm text-gray-500 mb-1">حالة المزاد: {getAuctionStatusTextAndIcon(car.auction_status).text}</p>
        <p className="text-sm text-gray-500 mb-1">الوصف: {car.description}</p>
        <p className="text-sm font-medium mt-2">
          سعر التقييم: <span className="text-blue-600">{car.evaluation_price.toLocaleString('ar-EG')} ريال</span>
        </p>
        <br/>
        {
          car.auction_status == "available" &&
           <Link  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-center inline-block" 
                  href={`/add/auction/${car.id}`}
                  onClick={(e) => e.stopPropagation()}
                  key={`link-${car.id}`}>
            <label htmlFor="">إضافة للمزاد</label>
          </Link>
        }
                 {car.auction_status == "in_auction" && car.auctions[0].control_room_approved ? (
            <Link target="_blank" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-center inline-block" 
                  href={`/carDetails/${car.id}`}
                  onClick={(e) => e.stopPropagation()}
                  key={`link-${car.id}`}>
            <label htmlFor="">عرض السيارة</label>
          </Link>
          ) : (
            <span className="text-red-600"></span>
          )}

                        {car.auction_status == "sold" && car.auctions[0].control_room_approved ? (
            <Link className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-center inline-block" 
                  href={`#`}
                  onClick={(e) => e.stopPropagation()}
                  key={`link-${car.id}`}>
            <label htmlFor=""> تم بيع السيارة</label>
          </Link>
          ) : (
            <span className="text-red-600"></span>
          )}

      </div>
    ))}
  </div>
)}


 <Pagination  data={PaginationData} options={options} page={PaginationData} pageSize={PaginationData} changePage={getData} />

    </main>
  );
}
