'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

export default function CaravanAuctionsPage() {
  const currentPageUrl = '/auctions/auctions-car/caravan';
  // قائمة أسواق الكرفانات مع الصور المتعددة
  const caravanAuctions = [
    {
      id: 1,
      title: 'كرفان فاخر موديل 2023',
      description: 'كرفان جديد مع كافة المميزات الحديثة ومساحة داخلية واسعة',
      image: '/auctionsPIC/car-caravanPIC/caravan-1.jpg',
      images: [
        '/auctionsPIC/car-caravanPIC/caravan-1.jpg',
        '/auctionsPIC/car-caravanPIC/caravan-2.jpg',
        '/auctionsPIC/car-caravanPIC/caravan-3.jpg',
      ],
      price: '120,000',
      location: 'الرياض',
      date: '15 سبتمبر 2023',
      capacity: '6 أشخاص'
    },
    {
      id: 2,
      title: 'كرفان سياحي متعدد الاستخدامات',
      description: 'مناسب للرحلات الطويلة مع تجهيزات كاملة وتصميم عملي',
      image: '/auctionsPIC/car-caravanPIC/caravan-2.jpg',
      images: [
        '/auctionsPIC/car-caravanPIC/caravan-2.jpg',
        '/auctionsPIC/car-caravanPIC/caravan-1.jpg',
        '/auctionsPIC/car-caravanPIC/caravan-3.jpg',
      ],
      price: '95,000',
      location: 'جدة',
      date: '20 سبتمبر 2023',
      capacity: '4 أشخاص'
    },
    {
      id: 3,
      title: 'كرفان صحراوي مجهز بالكامل',
      description: 'تصميم متين مناسب للطرق الوعرة مع تجهيزات للرحلات البرية',
      image: '/auctionsPIC/car-caravanPIC/caravan-3.jpg',
      images: [
        '/auctionsPIC/car-caravanPIC/caravan-3.jpg',
        '/auctionsPIC/car-caravanPIC/caravan-1.jpg',
        '/auctionsPIC/car-caravanPIC/caravan-2.jpg',
      ],
      price: '150,000',
      location: 'الدمام',
      date: '25 سبتمبر 2023',
      capacity: '5 أشخاص'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* رأس الصفحة */}
      <PageHeader 
        title="سوق الكرفانات"
        backUrl="/auctions/auctions-car"
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
          {caravanAuctions.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="relative h-60">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <div className="text-xl font-bold text-green-600 mb-4">{item.price} ريال</div>
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center text-gray-500">
                    <MapPin size={18} className="ml-2" />
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Calendar size={18} className="ml-2" />
                    <span>{item.date}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Users size={18} className="ml-2" />
                    <span>{item.capacity}</span>
                  </div>
                </div>
                <Link 
                  href={`/auctions/auctions-car/caravan/bid/${item.id}?from=${currentPageUrl}`}
                  className="block w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition text-center"
                >
                  قدم عرضك
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* قسم إضافة كرفان للسوق */}
      <div className="bg-green-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">هل لديك كرفان للبيع في السوق؟</h2>
            <p className="text-gray-600 mb-8">
              نحن نبحث دائمًا عن كرفانات مميزة لعرضها في منصتنا. سجل بياناتك وسنتواصل معك لإتمام عملية التسجيل.
            </p>
            <Link 
              href="/auctions/auctions-car/caravan/register"
              className="inline-block px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
            >
              تسجيل كرفان للسوق
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 