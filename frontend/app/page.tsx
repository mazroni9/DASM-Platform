"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
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
import api from "@/lib/axios";
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

    if (!mounted)
        return (
            <div className="flex items-center justify-center p-2">
                <span className="text-base sm:text-lg md:text-xl font-bold">...</span>
            </div>
        );
    if (!timeLeft)
        return (
            <div className="flex items-center justify-center p-2">
                <span className="text-sm sm:text-base">انتهى الوقت!</span>
            </div>
        );

    const timerComponents = Object.keys(timeLeft).flatMap((interval, index) => [
        <span key={index} className="flex flex-col items-center mx-1 sm:mx-2">
            <span className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold">
                {timeLeft[interval]}
            </span>
            <span className="text-xs sm:text-sm">{interval}</span>
        </span>,
        index < Object.keys(timeLeft).length - 1 && (
            <span key={`sep-${index}`} className="mx-1 text-sm sm:text-lg md:text-xl">
                :
            </span>
        ),
    ]);

    return (
        <div className="flex items-center justify-center flex-wrap">
            {timerComponents}
        </div>
    );
};

export default function Page() {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [broadcast, setBroadcast] = useState(null);
    const targetDate = "July 1, 2025 01:00:00";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setAuctions([]);

                // Fetch the current live broadcast
                try {
                    const response = await api.get("api/broadcast");
                    if (
                        response.data.status === "success" &&
                        response.data.data
                    ) {
                        setBroadcast(response.data.data);
                        console.log(
                            "Live broadcast found:",
                            response.data.data
                        );
                    } else {
                        console.log("No active broadcasts found");
                    }
                } catch (broadcastError) {
                    console.error("Error fetching broadcast:", broadcastError);
                }
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
                {/* Hero Section */}
                <Box
                    sx={{
                        backgroundImage:
                            "url('https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1200&q=80')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundAttachment: { xs: "scroll", md: "fixed" },
                        position: "relative",
                        py: { xs: 4, sm: 6, md: 8, lg: 10 },
                        mb: { xs: 2, sm: 3, md: 4 },
                        textAlign: "center",
                        minHeight: { xs: "60vh", sm: "70vh", md: "80vh" },
                        display: "flex",
                        alignItems: "center",
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
                    <Container 
                        sx={{ 
                            position: "relative", 
                            zIndex: 2,
                            px: { xs: 2, sm: 3, md: 4 }
                        }}
                    >
                        <Typography
                            variant="h3"
                            sx={{
                                color: "#ffffff",
                                fontWeight: 700,
                                textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                fontSize: { 
                                    xs: "1.5rem", 
                                    sm: "2rem", 
                                    md: "2.5rem", 
                                    lg: "3rem" 
                                },
                                mb: { xs: 2, sm: 3 },
                                lineHeight: { xs: 1.2, sm: 1.3 }
                            }}
                        >
                            Digital Auctions specialists Markets & e-Commerce
                        </Typography>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: "medium",
                                color: "#ffffff",
                                fontSize: { 
                                    xs: "1rem", 
                                    sm: "1.25rem", 
                                    md: "1.5rem" 
                                },
                                mb: { xs: 2, sm: 3 },
                                px: { xs: 1, sm: 2 },
                                lineHeight: { xs: 1.4, sm: 1.5 }
                            }}
                        >
                            اخترنا لك نخبة من الأسواق الرقمية التي تلبي
                            احتياجاتك وتمنحك فرصًا لا تجدها في مكان آخر.
                        </Typography>
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                mb: { xs: 3, sm: 4 },
                                color: "#ffffff",
                                fontSize: { 
                                    xs: "0.9rem", 
                                    sm: "1rem", 
                                    md: "1.25rem" 
                                },
                                px: { xs: 1, sm: 2 }
                            }}
                        >
                            كل ما تبحث عنه من الأصول والمنتجات المستعملة
                            والمجددة – في منصة واحدة.!
                        </Typography>
                        <div
                            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 sm:py-3 px-3 sm:px-5 rounded inline-flex items-center justify-center mx-auto transition-all duration-300 hover:scale-105"
                            style={{ 
                                minWidth: "200px",
                                maxWidth: "90%",
                                fontSize: "clamp(0.875rem, 2vw, 1rem)"
                            }}
                        >
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                            <CountdownTimer targetDate={targetDate} />
                        </div>
                    </Container>
                </Box>

                {/* Market Type Navigation */}
                <Container sx={{ 
                    mb: { xs: 3, sm: 4, md: 5 },
                    px: { xs: 1, sm: 2, md: 3 }
                }}>
                    <MarketTypeNav />
                </Container>

                {/* Broadcast Section */}
                <Container sx={{ 
                    mb: { xs: 4, sm: 5, md: 6 }, 
                    maxWidth: "lg",
                    px: { xs: 1, sm: 2, md: 3 }
                }}>
                    <Box textAlign="center" mb={{ xs: 3, sm: 4 }}>
                        <Typography
                            variant="h5"
                            sx={{ 
                                color: "#1976d2", 
                                fontWeight: "bold", 
                                mb: { xs: 1, sm: 2 },
                                fontSize: { 
                                    xs: "1.25rem", 
                                    sm: "1.5rem", 
                                    md: "1.75rem" 
                                },
                                px: { xs: 1, sm: 0 }
                            }}
                        >
                            القناة الرئيسية لمنصة DASM-e
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{ 
                                color: "#8e24aa", 
                                fontSize: { 
                                    xs: "1rem", 
                                    sm: "1.125rem", 
                                    md: "1.25rem" 
                                }, 
                                mb: 1,
                                px: { xs: 1, sm: 2 },
                                lineHeight: { xs: 1.5, sm: 1.6 }
                            }}
                        >
                            في قناتنا خيط رفيع يفصل بين الترفيه والمتعة... وبين
                            البزنس الجاد والمزادات الرقمية الدقيقة.
                        </Typography>
                    </Box>

                    {/* Live broadcast section */}
                    {broadcast && (
                        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                            <Typography
                                variant="h4"
                                fontWeight="bold"
                                sx={{
                                    mb: 1,
                                    textAlign: "center",
                                    color: "primary.main",
                                    fontSize: { 
                                        xs: "1.5rem", 
                                        sm: "2rem", 
                                        md: "2.25rem" 
                                    },
                                    px: { xs: 1, sm: 0 }
                                }}
                            >
                                {broadcast.title || "البث المباشر "}
                            </Typography>
                            {broadcast.description && (
                                <Typography
                                    variant="body1"
                                    sx={{ 
                                        mb: 3, 
                                        textAlign: "center",
                                        px: { xs: 1, sm: 2 },
                                        fontSize: { xs: "0.9rem", sm: "1rem" }
                                    }}
                                >
                                    {broadcast.description}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Video Container */}
                    <Box
                        sx={{
                            position: "relative",
                            width: "100%",
                            height: {
                                xs: "200px",
                                sm: "280px",
                                md: "360px",
                                lg: "450px",
                                xl: "500px",
                            },
                            borderRadius: { xs: "8px", sm: "12px" },
                            overflow: "hidden",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                            mx: "auto",
                            maxWidth: "100%",
                            mb: { xs: 3, sm: 4, md: 5 },
                        }}
                    >
                        {broadcast && broadcast.youtube_embed_url ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={broadcast.youtube_embed_url}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100 text-gray-500 p-4">
                                <div className="text-base sm:text-lg md:text-xl mb-2 text-center">
                                    لا يوجد بث مباشر حالياً
                                </div>
                                <div className="text-xs sm:text-sm text-center">
                                    يرجى التحقق لاحقاً
                                </div>
                            </div>
                        )}
                    </Box>

                    <Typography
                        variant="body1"
                        sx={{
                            color: "#2e2e2e",
                            fontSize: { 
                                xs: "1rem", 
                                sm: "1.125rem", 
                                md: "1.25rem" 
                            },
                            mb: { xs: 4, sm: 5, md: 6 },
                            textAlign: "center",
                            px: { xs: 1, sm: 2 },
                            lineHeight: { xs: 1.6, sm: 1.7 }
                        }}
                    >
                        نقدم لكم تجارب مباشرة من قلب السوق الكبير – حيث تُعرض
                        المنتجات، وتُعقد الصفقات، وتُكشف الفرص. تابعنا لتفهم
                        الفارق، وتحجز مكانك في مستقبل التجارة التفاعلية.
                    </Typography>
                </Container>

                {/* Action Buttons Section */}
                <Container sx={{ 
                    mb: { xs: 3, sm: 4 },
                    px: { xs: 1, sm: 2, md: 3 }
                }} maxWidth="md">
                    <div className="mt-8 sm:mt-12 md:mt-16 mb-6 sm:mb-8 md:mb-10 border-t pt-6 sm:pt-8 md:pt-10 relative">
                        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 mt-6 sm:mt-8 px-2 sm:px-4">
                            <div className="w-full sm:w-auto flex justify-center order-2 lg:order-1">
                                <div className="relative w-full max-w-xs sm:max-w-sm">
                                    <AuctionDropdown />
                                </div>
                            </div>
                            <a
                                href="/add/Car"
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 sm:px-6 rounded-full transition-all duration-300 hover:scale-105 text-center whitespace-nowrap w-full max-w-xs sm:max-w-sm lg:w-auto order-1 lg:order-2 text-sm sm:text-base"
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
