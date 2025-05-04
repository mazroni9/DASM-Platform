'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin, Home, Ruler, Building } from 'lucide-react';

export default function RealEstateAuctionsPage() {
  // قائمة مزادات العقارات التجارية والمميزة
  const realEstateAuctions = [
    {
      id: 1,
      title: 'فيلا فاخرة في حي الياسمين',
      description: 'فيلا مودرن بتصميم عصري وإطلالة مميزة على الحديقة العامة',
      image: '/placeholder-realestate-1.jpg',
      price: '3,500,000',
      location: 'الرياض، حي الياسمين',
      area: '450 متر مربع',
      type: 'فيلا سكنية'
    },
    {
      id: 2,
      title: 'أرض تجارية على طريق رئيسي',
      description: 'أرض استثمارية بموقع استراتيجي مناسبة لإنشاء مجمع تجاري',
      image: '/placeholder-realestate-2.jpg',
      price: '5,200,000',
      location: 'جدة، طريق الملك عبدالله',
      area: '1200 متر مربع',
      type: 'أرض تجارية'
    },
    {
      id: 3,
      title: 'عمارة سكنية استثمارية',
      description: 'عمارة مكونة من 12 شقة مؤجرة بالكامل بعائد استثماري ممتاز',
      image: '/placeholder-realestate-3.jpg',
      price: '8,700,000',
      location: 'الدمام، حي الشاطئ',
      area: '950 متر مربع',
      type: 'عمارة سكنية'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* بانر الصفحة */}
      <div className="relative h-80 bg-gradient-to-r from-blue-700 to-blue-500 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
          <Link href="/auctions-special" className="flex items-center text-white/80 hover:text-white mb-6 transition">
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى المزادات الخاصة</span>
          </Link>
          <h1 className="text-5xl font-bold text-white mb-4">مزادات العقارات</h1>
          <p className="text-xl text-white/90 max-w-2xl">
            استثمر في افضل العقارات السكنية والتجارية عبر منصة مزادات موثوقة وشفافة
          </p>
        </div>
      </div>

      {/* نص توضيحي حول آلية المزاد */}
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-700">
            نلغي لعبة التقييمات الجائرة عبر مزايدة عادلة بسعر بائع مخفي. المنافسة تعتمد على العرض والطلب الطبيعي، مع تدخلنا كوسيط لموازنة التوقعات وضمان بيئة موثوقة لكل الأطراف
          </p>
        </div>
      </div>

      {/* قائمة المزادات */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {realEstateAuctions.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="relative h-60">
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">صورة العقار</span>
                </div>
                {/* <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                /> */}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <div className="text-xl font-bold text-blue-600 mb-4">{item.price} ريال</div>
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center text-gray-500">
                    <MapPin size={18} className="ml-2" />
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Ruler size={18} className="ml-2" />
                    <span>{item.area}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Building size={18} className="ml-2" />
                    <span>{item.type}</span>
                  </div>
                </div>
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
                  المشاركة في المزاد
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* قسم إضافة عقار للمزاد */}
      <div className="bg-blue-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">هل لديك عقار للبيع في المزاد؟</h2>
            <p className="text-gray-600 mb-8">
              سجل عقارك الآن في منصتنا ليتم عرضه في المزادات القادمة. فريقنا سيتواصل معك لتقييم العقار وإتمام إجراءات البيع.
            </p>
            <Link 
              href="/forms/real-estate-auction-request"
              className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              تسجيل عقار للمزاد
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 