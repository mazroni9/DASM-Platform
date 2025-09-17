"use client";

import LoadingLink from "@/components/LoadingLink";
import {
  Timer,
  BellOff,
  Video,
  Tv,
  ArrowUpDown,
  Eye,
  Settings,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import OtherVenuesGrid from "@/components/broadcast/OtherVenuesGrid";
import api from "@/lib/axios";
import Countdown from "@components/Countdown"; // adjust the path to where you saved it
import AuctionsFinished from "@components/AuctionsFinished"; // adjust the path to where you saved it
import { formatCurrency } from "@/utils/formatCurrency";

export default function AuctionsMainPage() {
  const [showPresenterPanel, setShowPresenterPanel] = useState(false);
  const [currentAuction, setCurrentAuction] = useState("");

  // مزادات المجلد الأول: auctions-main
  const auctionsMain = [
    {
      currentPage: "live_auction",
      name: "الحراج المباشر",
      slug: "live-market",
      description: "بث مباشر للمزايدة مع البائع والمشتري وعملاء المنصة",
      time: "من الرابعة عصرا إلى السابعة مساء  ",
      icon: Video,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      currentPage: "instant_auction",
      name: "السوق الفوري المباشر",
      slug: "instant",
      description:
        "نظام المزايدات المفتوحه صعودا وهبوطا بحسب ما يراه المشتري لمصلحته",
      time: "من السابعة مساء إلى العاشرة مساء  ",
      icon: Timer,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      currentPage: "late_auction",
      name: "السوق المتأخر",
      slug: "silent",
      description:
        " مكمل للمزاد الفوري ولكن بدون بث ولا يطلع المزايدين على عروض بعض",
      time: "من العاشرة مساء إلى الرابعة عصرا  ",
      icon: BellOff,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          الأسواق الرئيسية الثلاثة
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowPresenterPanel(!showPresenterPanel)}
            className="flex items-center px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-md transition-colors"
          >
            <Tv className="h-5 w-5 ml-2" />
            <span>شاشة المعلق</span>
          </button>
          <LoadingLink
            href="/auctions"
            className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <span className="ml-2">العودة لجميع الأسواق</span>
          </LoadingLink>
        </div>
      </div>

      {showPresenterPanel && (
        <div className="mb-8 p-5 bg-gray-900 text-white rounded-lg shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">شاشة المعلق - لوحة التحكم</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPresenterPanel(false)}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
                title="إغلاق لوحة التحكم"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-300">
                المزاد الحالي
              </h3>
              <select
                value={currentAuction}
                onChange={(e) => setCurrentAuction(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="اختيار المزاد الحالي"
              >
                <option value="">اختر المزاد</option>
                {auctionsMain.map((auction) => (
                  <option key={auction.slug} value={auction.slug}>
                    {auction.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-300">عرض البيانات</h3>
              <div className="flex gap-2">
                <button className="flex-1 p-2 bg-blue-600 hover:bg-blue-700 rounded">
                  <ArrowUpDown className="h-4 w-4 mx-auto" />
                  <span className="text-sm">جدول المزاد</span>
                </button>
                <button className="flex-1 p-2 bg-green-600 hover:bg-green-700 rounded">
                  <Eye className="h-4 w-4 mx-auto" />
                  <span className="text-sm">تفاصيل السيارة</span>
                </button>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-300">روابط سريعة</h3>
              {currentAuction && (
                <LoadingLink
                  href={`/auctions/auctions-1main/${currentAuction}`}
                  target="_blank"
                  className="flex items-center justify-center gap-1 p-2 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>فتح في نافذة جديدة</span>
                </LoadingLink>
              )}
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-gray-300">معاينة البث</h3>
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-gray-500">
              {currentAuction ? (
                <iframe
                  className="w-full h-full rounded"
                  src="https://www.youtube.com/embed/live_stream?channel=UCxiLyu5z-T0FanDNotwTJcg&autoplay=0"
                  title="معاينة البث المباشر"
                  frameBorder="0"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="text-center">
                  <Tv className="h-10 w-10 mx-auto mb-2" />
                  <p>يرجى اختيار المزاد لعرض البث</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-normal mb-4">
          نلغي لعبة التقييمات الجائرة عبر مزايدة عادلة بسعر بائع مخفي
        </h3>
        <p className="text-gray-600">
          المنافسة تعتمد على العرض والطلب الطبيعي، مع تدخلنا كوسيط لموازنة
          التوقعات وضمان بيئة موثوقة لكل الأطراف.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {auctionsMain.map((auction) => {
          const Icon = auction.icon;
          return (
            <LoadingLink
              key={auction.slug}
              href={`/auctions/auctions-1main/${auction.slug}`}
              className={`group flex flex-col border rounded-xl shadow hover:shadow-lg p-4 ${auction.bgColor} hover:bg-white transition-all duration-300 h-auto relative overflow-hidden`}
            >
              {/* إضافة صورة الخلفية حسب نوع المزاد */}
              {auction.slug === "live-market" && (
                <div
                  className="absolute inset-0 opacity-10 bg-contain bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url('/showroom.jpg')`,
                    width: "100%",
                    height: "100%",
                  }}
                ></div>
              )}
              {auction.slug === "instant" && (
                <div
                  className="absolute inset-0 opacity-60 bg-contain bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url('/grok auctioneer.jpg')`,
                    width: "100%",
                    height: "100%",
                  }}
                ></div>
              )}
              {auction.slug === "silent" && (
                <div
                  className="absolute inset-0 opacity-60 bg-contain bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url('/late_auction.jpg')`,
                    width: "100%",
                    height: "100%",
                  }}
                ></div>
              )}

              {/* العنوان والأيقونة بجانب بعضهما */}
              <div className="flex justify-center items-center mb-3 relative z-10">
                <h3
                  className={`text-xl font-bold ${auction.color} text-center ml-2`}
                >
                  {auction.name}
                </h3>
                <div className={`p-2 rounded-full ${auction.color} bg-white`}>
                  <Icon size={20} />
                </div>
              </div>

              <p className="text-gray-600 text-sm text-center mb-4 flex-grow relative z-10">
                {auction.description} <br />
                {auction.time}
                <br />
                <br />
                {/*<Countdown page={auction.currentPage as 'live_auction' | 'instant_auction' | 'late_auction'}/>*/}
                <br />
              </p>

              {/* إضافة الفيديو للحراج المباشر - تصغير الحجم */}
              {auction.slug === "live-market" && (
                <div className="w-full max-w-[200px] mb-3 relative z-10 mx-auto">
                  <video
                    className="w-full rounded shadow-md"
                    poster="/showroom.jpg"
                    controls={false}
                    muted
                    loop
                    autoPlay
                    playsInline
                    preload="metadata"
                  >
                    <source src="/live-auction.mp4" type="video/mp4" />
                    متصفحك لا يدعم عنصر الفيديو.
                  </video>
                </div>
              )}

              <div className="mt-auto relative z-10 text-center">
                <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-full bg-white group-hover:bg-blue-500 text-gray-700 group-hover:text-white transition-colors duration-300">
                  اضغط للدخول إلى السوق
                </span>
              </div>
            </LoadingLink>
          );
        })}
      </div>

      <div className="mt-12">
        <h1 className="text-2xl font-bold text-gray-800">المزادات المنتهية</h1>
        <AuctionsFinished></AuctionsFinished>
      </div>
    </main>
  );
}
