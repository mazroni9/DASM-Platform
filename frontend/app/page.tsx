// =============================================================
// 🏗️ الملف: الصفحة الرئيسية لأسواق المزادات الرقمية المتخصصة
// 📁 المسار: Frontend-local/app/(market)/page.tsx
// -------------------------------------------------------------
// ✅ الوظيفة:
//   - عرض العنوان الرئيسي للمنصة والعداد التنازلي لانطلاقة الأسواق.
//   - تضمين شريط تنقل الأسواق (MarketTypeNav).
//   - واجهة اختيار السوق عبر AuctionDropdown.
//   - زر إدخال سيارة جديدة إلى نظام المزاد.
//
// 🔗 يرتبط مع:
//   - Navbar.tsx و Footer.tsx لهيكل الصفحة العام.
//   - MarketTypeNav.tsx لقائمة الأسواق الرقمية.
//   - CountdownTimer (مضمن داخليًا) للعد التنازلي.
//   - API مزادات السيارات: https://api.mazbrothers.com/api/auctions
//
// 🧠 ملاحظات:
//   - يتم التحكم في وقت الانطلاق عبر المتغير `targetDate`.
//   - التصميم يعكس رؤية منصة "دسام" كسوق وطني رقمي شامل.
//
// ✍️ المطوران المسؤولان: محمد الزهراني وضياء الدين العزيز
// =============================================================

"use client";
import React, { useEffect, useState } from "react";
import {
    Typography,
    Button,
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Stack,
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import DevicesIcon from "@mui/icons-material/Devices";
import WeekendIcon from "@mui/icons-material/Weekend";
import HomeIcon from "@mui/icons-material/Home";
import WatchIcon from "@mui/icons-material/Watch";
import BrushIcon from "@mui/icons-material/Brush";
import {
    Car,
    Tv,
    Sofa,
    Home as HomeIconLucide,
    Watch as WatchIconLucide,
    Paintbrush,
    Clock,
} from "lucide-react";

import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import AuctionDropdown from "@/components/shared/AuctionDropdown";
import MarketTypeNav from "@/components/shared/MarketTypeNav";

// مكون العداد التنازلي
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

        // Initial calculation
        setTimeLeft(calculateTimeLeft());

        // Update every second
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center">
                <span className="text-xl font-bold">...</span>
            </div>
        );
    }

    if (!timeLeft) {
        return (
            <div className="flex items-center justify-center">
                <span>انتهى الوقت!</span>
            </div>
        );
    }

    const timerComponents = [];

    Object.keys(timeLeft).forEach((interval, index) => {
        if (!timeLeft[interval]) {
            return;
        }

        timerComponents.push(
            <span key={index} className="flex flex-col items-center mx-1">
                <span className="text-xl font-bold">{timeLeft[interval]}</span>
                <span className="text-xs">{interval}</span>
            </span>
        );

        // إضافة فاصل إذا لم تكن النهاية
        if (index < Object.keys(timeLeft).length - 1) {
            timerComponents.push(
                <span key={`sep-${index}`} className="mx-1 text-xl">
                    :
                </span>
            );
        }
    });

    return (
        <div className="flex items-center justify-center">
            {timerComponents.length ? (
                timerComponents
            ) : (
                <span>انتهى الوقت!</span>
            )}
        </div>
    );
};

export default function Page() {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // تاريخ 1 يونيو 2025 الساعة 7 صباحًا
    const targetDate = "June 1, 2025 07:00:00";

    useEffect(() => {
        // التعامل مع البيانات بدون استدعاء alert
        const fetchData = async () => {
            try {
                
                setAuctions(data);
                setAuctions([]); // Temporary empty array until API is ready
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
            <Box sx={{ bgcolor: "#f5f6fa", minHeight: "100vh" }}>
                <Box
                    sx={{
                        background:
                            "linear-gradient(120deg, #1976d2 60%, #fff 100%)",
                        color: "#fff",
                        py: 7,
                        mb: 4,
                        textAlign: "center",
                        // إعادة صورة الجبال الأصلية
                        backgroundImage:
                            "url('https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1200&q=80')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        position: "relative",
                    }}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            bgcolor: "rgba(25, 118, 210, 0.7)",
                            zIndex: 1,
                        }}
                    />
                    <Container sx={{ position: "relative", zIndex: 2 }}>
                        {/* إضافة العنوان الإنجليزي داخل صورة الجبال */}
                        <Typography
                            variant="h3"
                            sx={{
                                color: "#ffffff",
                                letterSpacing: "1px",
                                fontWeight: 700,
                                margin: "0 auto 1.5rem auto",
                                textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            }}
                        >
                            Digital Auctions Sectors Market
                        </Typography>

                        <Typography
                            variant="h5"
                            fontWeight="medium"
                            gutterBottom
                        >
                            اخترنا لك نخبة من الأسواق الرقمية التي تلبي
                            احتياجاتك وتمنحك فرصًا لا تجدها في مكان آخر.
                        </Typography>
                        <Typography variant="h6" sx={{ mb: 3 }}>
                            كل ما تبحث عنه من الأصول والمنتجات المستعملة
                            والمجددة – في منصة واحدة.!
                            <br />
                            <span
                                style={{ display: "block", marginTop: "8px" }}
                            ></span>
                        </Typography>
                        <div
                            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-5 rounded inline-flex items-center justify-center transition-colors duration-200 mx-auto"
                            style={{ minWidth: "220px" }}
                        >
                            <Clock className="w-5 h-5 mr-2" />
                            <CountdownTimer targetDate={targetDate} />
                        </div>
                    </Container>
                </Box>

                <Container sx={{ mb: 5 }}>
                    <MarketTypeNav />
                </Container>

                {/* إبقاء قسم مزادات متخصصة بالتنسيق المطلوب */}
                <Container sx={{ mb: 4 }} maxWidth="md">
                    <div className="mt-16 mb-10 border-t pt-10 relative">
                        <div className="absolute -top-3 left-0 right-0 text-center">
                            {/* تغيير العنوان العلوي من الأسواق المتنوعة إلى الأسواق العامة */}
                            <span className="bg-white px-4 py-1 text-xl font-bold text-blue-700"></span>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-8">
                            <div className="w-full md:w-auto flex justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span
                                            className="text-purple-600 text-sm font-bold bg-white px-6 py-3 rounded-full shadow-sm"
                                            style={{
                                                textShadow: "none",
                                                border: "1px solid #f0f0f0",
                                                height: "100%",
                                                width: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            استكشف الأسواق الرقمية
                                        </span>
                                    </div>
                                    <AuctionDropdown />
                                </div>
                            </div>

                            <a
                                href="/add/Car"
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition text-center whitespace-nowrap w-64 md:w-auto"
                            >
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
