// =============================================================
// 🏗️ الملف: الصفحة الرئيسية لأسواق المزادات الرقمية المتخصصة
// 📁 المسار: Frontend/app/page.tsx
// -------------------------------------------------------------
// ✅ الوظيفة:
//   - عرض العنوان الرئيسي للمنصة والعداد التنازلي لانطلاقة الأسواق.
//   - تضمين شريط تنقل الأسواق (MarketTypeNav).
//   - واجهة اختيار السوق عبر AuctionDropdown.
//   - زر إدخال سيارة جديدة إلى نظام المزاد.
// 🔗 يرتبط مع:
//   - Navbar.tsx و Footer.tsx لهيكل الصفحة العام.
//   - MarketTypeNav.tsx لقائمة الأسواق الرقمية.
//   - CountdownTimer (مضمن داخليًا) للعد التنازلي.
//   -  مزادات السيارات: https://mazbrothers.com/auctions
// 🧠 ملاحظات:
//   - يتم التحكم في وقت الانطلاق عبر المتغير `targetDate`.
//   - التصميم يعكس رؤية منصة "داسم" كسوق وطني رقمي شامل.
// ✍️ المطورون : محمد احمد الزهراني المؤسس والمالك للمنصة ويساعدة برمجيا كل من جاسم الحجاب وضياء الدين العزيز
// =============================================================

"use client";
import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Container,
} from "@mui/material";
import {
  Clock,
} from "lucide-react";

import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import AuctionDropdown from "@/components/shared/AuctionDropdown";
import MarketTypeNav from "@/components/shared/MarketTypeNav";

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let timeLeft = {};

      if (difference > 0) {
        timeLeft = {
          أيام: Math.floor(difference / (1000 * 60 * 60 * 24)),
          ساعات: Math.floor((difference / (1000 * 60 * 60)) % 24),
          دقائق: Math.floor((difference / 1000 / 60) % 60),
          ثواني: Math.floor((difference / 1000) % 60),
        };
      }

      return timeLeft;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) return <div className="flex items-center justify-center"><span className="text-xl font-bold">...</span></div>;
  if (!timeLeft) return <div className="flex items-center justify-center"><span>انتهى الوقت!</span></div>;

  const timerComponents = Object.keys(timeLeft).flatMap((interval, index) => [
    <span key={index} className="flex flex-col items-center mx-1">
      <span className="text-xl font-bold">{timeLeft[interval]}</span>
      <span className="text-xs">{interval}</span>
    </span>,
    index < Object.keys(timeLeft).length - 1 && <span key={`sep-${index}`} className="mx-1 text-xl">:</span>
  ]);

  return <div className="flex items-center justify-center">{timerComponents}</div>;
};

export default function Page() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const targetDate = "July 1, 2025 01:00:00";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setAuctions([]);
      } catch (err) {
        console.error("Error fetching auctions:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Navbar />
      <Box sx={{ bgcolor: "#f5f6fa", minHeight: "100vh" }}>
        <Box sx={{
          backgroundImage: "url('https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1200&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          py: 7,
          mb: 4,
          textAlign: "center"
        }}>
          <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(25, 118, 210, 0.7)", zIndex: 1 }} />
          <Container sx={{ position: "relative", zIndex: 2 }}>
            <Typography variant="h3" sx={{ color: "#ffffff", fontWeight: 700, textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
              Digital Auctions specialists Markets & e-Commerce
            </Typography>
            <Typography variant="h5" fontWeight="medium" gutterBottom>
              اخترنا لك نخبة من الأسواق الرقمية التي تلبي احتياجاتك وتمنحك فرصًا لا تجدها في مكان آخر.
            </Typography>
            <Typography variant="h6" sx={{ mb: 3 }}>
              كل ما تبحث عنه من الأصول والمنتجات المستعملة والمجددة – في منصة واحدة.!
            </Typography>
            <div className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-5 rounded inline-flex items-center justify-center mx-auto" style={{ minWidth: "220px" }}>
              <Clock className="w-5 h-5 mr-2" />
              <CountdownTimer targetDate={targetDate} />
            </div>
          </Container>
        </Box>

        <Container sx={{ mb: 5 }}>
          <MarketTypeNav />
        </Container>

        <Container sx={{ mb: 6, maxWidth: 'lg' }}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 1 }}>
              القناة الرئيسية لمنصة DASM-e
            </Typography>
            <Typography variant="body1" sx={{ color: '#8e24aa', fontSize: '18px', mb: 1 }}>
              في قناتنا خيط رفيع يفصل بين الترفيه والمتعة... وبين البزنس الجاد والمزادات الرقمية الدقيقة.
            </Typography>
          </Box>

          <Box sx={{
            position: 'relative',
            width: '100%',
            height: { xs: '225px', sm: '315px', md: '360px', lg: '405px', xl: '450px' },
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            mx: 'auto',
            maxWidth: '900px',
            mb: 5
          }}>
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/ZSxZeM9Mcwk?autoplay=1"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          </Box>

          <Typography variant="body1" sx={{ color: '#2e2e2e', fontSize: '18px', mb: 6, textAlign: 'center' }}>
            نقدم لكم تجارب مباشرة من قلب السوق الكبير – حيث تُعرض المنتجات، وتُعقد الصفقات، وتُكشف الفرص. تابعنا لتفهم الفارق، وتحجز مكانك في مستقبل التجارة التفاعلية.
          </Typography>
        </Container>

        <Container sx={{ mb: 4 }} maxWidth="md">
          <div className="mt-16 mb-10 border-t pt-10 relative">
            <div className="relative -top-3 left-0 right-0 text-center">
              <span className="bg-white px-4 py-1 text-xl font-bold text-blue-700"></span>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-8">
              <div className="w-full md:w-auto flex justify-center">
                <div className="relative">
                  <AuctionDropdown />
                </div>
              </div>
              <a href="/add/Car" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition text-center whitespace-nowrap w-64 md:w-auto">
                ادخل بيانات سيارتك
              </a>
            </div>
          </div>
        </Container>
      </Box>
      <Footer />
    </>
  );
}
