
'use client'

import Link from 'next/link'
import { BellOff } from 'lucide-react'
import CountdownTimer from '@/components/CountdownTimer'
import AuctionDropdown from '@/components/shared/AuctionDropdown'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'

export default function Page() {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    if (slug) router.push(`/auctions/${slug}`);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#e0f7f5] to-[#f3fdfc] text-gray-800 px-4 py-8" dir="rtl">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold">
            <span className="text-yellow-500 text-5xl">من قلب الحدث</span>{' '}
            <span className="text-sky-700 text-5xl">للمزادات التفاعلية</span>
          </h1>
          <p className="text-3xl text-black font-extrabold mt-2">Auctioneer Live Broadcast</p>
          <div className="mt-6">
            <CountdownTimer />
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {/* المزاد الصامت */}
          <Link href="/auctions/silent" className="block h-full">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition text-center border flex flex-col h-full">
              <div className="bg-green-100 text-green-800 font-bold py-1 rounded-full w-full mb-2">المزاد الصامت</div>
              <div className="w-full h-48 mb-3">
                <img 
                  src="/showroom.png" 
                  alt="صالة العرض"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <BellOff className="mx-auto text-green-600 mb-3" size={40} />
              <div className="flex-grow flex items-center justify-center">
                <p className="text-sm text-gray-600">مزاد صامت مكمل للفوري بدون بث</p>
              </div>
              <div className="mt-4">
                <div className="bg-gray-100 py-3 px-4 rounded-lg">
                  <p className="text-sm font-bold text-gray-800">
                    من 10:00 مساءً إلى 7:00 مساءً اليوم التالي
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* المزاد الفوري */}
          <Link href="/auctions/instant" className="block h-full">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition text-center border flex flex-col h-full">
              <div className="bg-blue-100 text-blue-800 font-bold py-1 rounded-full w-full mb-2">المزاد الفوري</div>
              <div className="w-full h-48 mb-3">
                <img 
                  src="/grok auctioneer.jpg" 
                  alt="مذيع المزاد"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="flex-grow flex items-center justify-center">
                <p className="text-sm text-gray-600">مزايدة تفاعلية مع بث مباشر</p>
              </div>
              <div className="mt-4">
                <div className="bg-gray-100 py-3 px-4 rounded-lg">
                  <p className="text-sm font-bold text-gray-800">
                    من 7:00 مساءً إلى 10:00 مساءً
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* الحراج المباشر */}
          <Link href="/auctions/live-market" className="block h-full">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition text-center border flex flex-col h-full">
              <div className="bg-red-100 text-red-800 font-bold py-1 rounded-full w-full mb-2">الحراج المباشر</div>
              <div className="w-full h-48 mb-3 relative">
                <video
                  src="/live-auction.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="flex-grow flex items-center justify-center">
                <p className="text-sm text-gray-600">بث مباشر للمزايدة مع البائع والمشتري وعملاء المنصة</p>
              </div>
              <div className="mt-4">
                <div className="bg-gray-100 py-3 px-4 rounded-lg">
                  <p className="text-sm font-bold text-gray-800">
                    من 4:00 عصراً إلى 7:00 مساءً كل يوم
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* إدخال بيانات السيارة */}
        <section className="max-w-5xl mx-auto mt-16 px-4">
          <div className="text-center mb-6">
            <p className="text-xl font-semibold text-gray-800">مزادات متخصصة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div></div>
            <div className="flex justify-center">
              <AuctionDropdown />
            </div>
            <div className="flex justify-center">
              <a
                href="/carDetails"
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-full transition whitespace-nowrap text-lg"
              >
                ادخل بيانات سيارتك
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
