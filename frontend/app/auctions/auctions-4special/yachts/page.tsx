'use client';

import LoadingLink from "@/components/LoadingLink";
import Image from 'next/image';
import { ArrowLeft, Anchor, Navigation, Calendar, Ruler } from 'lucide-react';

export default function YachtAuctionsPage() {
  // قائمة مزادات اليخوت
  const yachtAuctions = [
    {
      id: 1,
      title: 'يخت سياحي فاخر 2023',
      description: 'يخت حديث بتجهيزات فاخرة وتصميم داخلي أنيق مناسب للرحلات البحرية الطويلة',
      image: '/placeholder-yacht-1.jpg',
      price: '4,500,000',
      length: '38 متر',
      year: '2023',
      location: 'مرسى جدة'
    },
    {
      id: 2,
      title: 'يخت رياضي سريع',
      description: 'يخت رياضي بمحركات قوية وتصميم انسيابي مثالي لمحبي السرعة والإثارة',
      image: '/placeholder-yacht-2.jpg',
      price: '2,800,000',
      length: '24 متر',
      year: '2021',
      location: 'مرسى الدمام'
    },
    {
      id: 3,
      title: 'يخت كلاسيكي مجدد',
      description: 'يخت بتصميم كلاسيكي أصيل مع تجديدات حديثة وتجهيزات عصرية',
      image: '/placeholder-yacht-3.jpg',
      price: '3,200,000',
      length: '32 متر',
      year: '2018 (مجدد 2022)',
      location: 'مرسى البحر الأحمر'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* بانر الصفحة */}
      <div className="relative h-80 bg-gradient-to-r from-cyan-800 to-blue-500 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
          <LoadingLink href="/auctions/auctions-4special" className="flex items-center text-white/80 hover:text-white mb-6 transition">
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى الأسواق المتخصصة</span>
          </LoadingLink>
          <h1 className="text-5xl font-bold text-white mb-4">سوق اليخوت والقوارب المستعملة</h1>
          <p className="text-xl text-white/90 max-w-2xl">
            استكشف مجموعة متنوعة من اليخوت الفاخرة للاستخدام الشخصي أو الاستثمار
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
          {yachtAuctions.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="relative h-60">
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">صورة اليخت</span>
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
                <div className="text-xl font-bold text-cyan-600 mb-4">{item.price} ريال</div>
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center text-gray-500">
                    <Ruler size={18} className="ml-2" />
                    <span>{item.length}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Calendar size={18} className="ml-2" />
                    <span>{item.year}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Anchor size={18} className="ml-2" />
                    <span>{item.location}</span>
                  </div>
                </div>
                <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition">
                  قدم عرضك
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* قسم إضافة يخت للمزاد */}
      <div className="bg-cyan-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">هل لديك قارب أو يخت ترغب في بيعه؟</h2>
            <p className="text-gray-600 mb-8">
              سجل بيانات يختك في منصتنا ليتم عرضه في المزادات القادمة. نوفر خدمة تقييم مجانية وعرض احترافي يضمن أعلى سعر ممكن.
            </p>
            <LoadingLink 
              href="/add/yacht"
              className="inline-block px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition"
            >
              سجل البيانات
            </LoadingLink>
          </div>
        </div>
      </div>
    </div>
  );
} 