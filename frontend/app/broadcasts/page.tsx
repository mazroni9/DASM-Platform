/**
 * ==================================================
 * ملف: frontend/app/broadcasts/page.tsx
 * الغرض: صفحة عرض بث المزادات المباشرة
 * الارتباطات:
 *  - يستخدم مكونات البث المباشر من مجلد broadcast
 *  - يتصل بقاعدة البيانات لجلب المعارض النشطة عبر venues.ts
 *  - يعرض تفاصيل المزادات الجارية والمباشرة من معرض MAZ وغيره
 * ==================================================
 */

"use client";

import React, { useState, useEffect } from "react";
import {
    Search,
    Filter,
    MapPin,
    Calendar,
    ChevronDown,
    ExternalLink,
    Building,
    Info,
    Video,
} from "lucide-react";
import YouTubeBroadcastPlayer from "@/components/YouTubeBroadcastPlayer";
import VenueSelector from "@/components/broadcast/VenueSelector";
import AuctionInfo from "@/components/broadcast/AuctionInfo";
import Link from "next/link";
import { Venue, getVenues } from "@/lib/api/venues";
import OtherVenuesGrid from "@/components/broadcast/OtherVenuesGrid";
import { useAuthStore } from "@/store/authStore";
import BidForm from "@/components/BidForm";
import BidNotifications from "@/components/BidNotifications";
import api from "@/lib/axios";

// واجهة للتصفية
interface FilterOptions {
    region: string;
    city: string;
    auctionType: string;
    onlyLive: boolean;
}

// استيراد تعريف المعارض المخزنة في مكون OtherVenuesGrid
// في تطبيق حقيقي، سنستخدم API للحصول على هذه البيانات
const otherVenues = [
    // 10 معارض في الدمام والمنطقة الشرقية
    {
        id: "venue-101",
        name: "معرض الخليج للسيارات - الدمام",
        location: "الدمام، حي الشاطئ، طريق الخليج",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 541,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-102",
        name: "معرض السيارات الفاخرة - الدمام",
        location: "الدمام، حي الفيصلية، طريق الملك فهد",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 328,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-103",
        name: "معرض الشرق للسيارات الفاخرة - الخبر",
        location: "الخبر، حي العقربية، طريق الملك سلمان",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 217,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-104",
        name: "معرض الأحساء للسيارات",
        location: "الأحساء، المبرز، طريق الرياض",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 412,
        isLive: false,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-105",
        name: "معرض النقل الثقيل - الدمام",
        location: "الدمام، المنطقة الصناعية، طريق الخليج",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 275,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-106",
        name: "معرض الخليج الجديد - الجبيل",
        location: "الجبيل، حي الفناتير، شارع الخليج",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 196,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-107",
        name: "معرض الشرقية للسيارات",
        location: "الظهران، حي الدوحة، طريق الأمير محمد",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 142,
        isLive: false,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-108",
        name: "معرض القطيف للسيارات",
        location: "القطيف، شارع السوق، قرب الكورنيش",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 188,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-109",
        name: "معرض الصدارة - الخبر",
        location: "الخبر، حي اليرموك، طريق الدمام",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 104,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-110",
        name: "معرض رأس تنورة للسيارات",
        location: "رأس تنورة، الشارع الرئيسي، بجوار البلدية",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 231,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },

    // 10 معارض في الرياض
    {
        id: "venue-111",
        name: "معرض السيارات الأول - الرياض",
        location: "الرياض، حي العليا، طريق الملك فهد",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 476,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-112",
        name: "معرض السيارات الفاخرة - الرياض",
        location: "الرياض، حي الورود، طريق العروبة",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 387,
        isLive: false,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-113",
        name: "معرض السيارات الألمانية - الرياض",
        location: "الرياض، حي النخيل، طريق الأمير تركي",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 355,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-114",
        name: "معرض سيارات التميمي - الرياض",
        location: "الرياض، حي الملز، شارع الصناعة",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 245,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-115",
        name: "معرض سيارات الوطن - الرياض",
        location: "الرياض، حي العزيزية، طريق مكة المكرمة",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 390,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-116",
        name: "معرض الصدارة للسيارات - الخرج",
        location: "الخرج، حي الناصفة، طريق الملك فهد",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 145,
        isLive: false,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-117",
        name: "معرض الرياض للسيارات الكلاسيكية",
        location: "الرياض، حي السلي، طريق الدائري الشرقي",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 321,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-118",
        name: "معرض صحارى للسيارات - الرياض",
        location: "الرياض، طريق الثمامة، حي الرمال",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 172,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-119",
        name: "معرض النجم للسيارات - الرياض",
        location: "الرياض، حي المنصورة، شارع الإمام سعود",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 278,
        isLive: false,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-120",
        name: "معرض القمة للسيارات - الرياض",
        location: "الرياض، حي النسيم، طريق خريص",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 211,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },

    // 5 معارض في جدة
    {
        id: "venue-121",
        name: "معرض سيارات النخبة - جدة",
        location: "جدة، طريق الملك، حي الشاطئ",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 312,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-122",
        name: "معرض السيارات اليابانية - جدة",
        location: "جدة، حي المروة، طريق الملك فهد",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 205,
        isLive: false,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-123",
        name: "معرض الفخامة للسيارات - جدة",
        location: "جدة، حي الرحاب، طريق الأمير ماجد",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 257,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-124",
        name: "معرض الأمير للسيارات - جدة",
        location: "جدة، طريق المدينة، حي البوادي",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 246,
        isLive: true,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
    {
        id: "venue-125",
        name: "معرض البلد للسيارات - جدة",
        location: "جدة، حي البلد، شارع قابل",
        thumbnail: "/logo.jpg",
        youtubeVideoId: "jfKfPfyJRdk",
        viewersCount: 167,
        isLive: false,
        detailsUrl: "/auctions/auctions-1main/live-market",
    },
];

export default function BroadcastsPage() {
    const { isLoggedIn, user } = useAuthStore();
    const [activeAuction, setActiveAuction] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filteredVenues, setFilteredVenues] = useState(otherVenues);
    const [selectedRegion, setSelectedRegion] = useState("all");
    const [onlyLive, setOnlyLive] = useState(false);

    // المناطق المتاحة
    const regions = [
        { id: "all", name: "جميع المناطق" },
        { id: "eastern", name: "المنطقة الشرقية" },
        { id: "central", name: "المنطقة الوسطى" },
        { id: "western", name: "المنطقة الغربية" },
        { id: "northern", name: "المنطقة الشمالية" },
        { id: "southern", name: "المنطقة الجنوبية" },
    ];

    // جلب المزاد النشط
    useEffect(() => {
        fetchActiveAuction();

        // Poll for active auction every 30 seconds
        const interval = setInterval(fetchActiveAuction, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchActiveAuction = async () => {
        try {
            const response = await api.get("/api/auctions/active");

            if (response.data.status === "success") {
                setActiveAuction(response.data.data);
            } else {
                setActiveAuction(null);
            }
        } catch (error) {
            console.error("Error fetching active auction:", error);
            setActiveAuction(null);
        } finally {
            setIsLoading(false);
        }
    };

    // تطبيق مرشحات البحث
    useEffect(() => {
        let filtered = [...otherVenues];

        // تطبيق البحث النصي
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (venue) =>
                    venue.name.toLowerCase().includes(query) ||
                    venue.location.toLowerCase().includes(query)
            );
        }

        // تطبيق تصفية بالمنطقة
        // في هذا المثال، نفترض أن تصنيف المناطق غير موجود في البيانات فعلياً

        // تطبيق تصفية البث المباشر فقط
        if (onlyLive) {
            filtered = filtered.filter((venue) => venue.isLive);
        }

        setFilteredVenues(filtered);
    }, [searchQuery, selectedRegion, onlyLive]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 py-6">
            <div className="max-w-7xl mx-auto">
                {/* زر العودة */}
                <div className="mb-6 flex justify-end">
                    <Link
                        href="/auctions/auctions-1main"
                        className="inline-flex items-center px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors font-medium"
                    >
                        العودة إلى المزادات الرئيسية الثلاثة
                    </Link>
                </div>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        بث المعارض المباشر
                    </h1>
                    <p className="text-gray-600 mt-2">
                        شاهد المزادات المباشرة من معارض السيارات المختلفة عبر
                        المملكة
                    </p>
                </div>

                {/* قسم البحث والتصفية */}
                <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="ابحث عن معرض..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center text-sm text-gray-600"
                        >
                            <Filter className="h-4 w-4 ml-1" />
                            <span>تصفية المعارض</span>
                            <ChevronDown
                                className={`h-4 w-4 mr-1 transition-transform ${
                                    showFilters ? "transform rotate-180" : ""
                                }`}
                            />
                        </button>

                        {/* مجموع المعارض */}
                        <div className="text-sm text-gray-600">
                            {filteredVenues.length} معرض متاح
                        </div>
                    </div>

                    {showFilters && (
                        <div className="mt-4 border-t pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* تصفية المنطقة */}
                                <div>
                                    <label
                                        htmlFor="region-filter"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        المنطقة
                                    </label>
                                    <select
                                        id="region-filter"
                                        value={selectedRegion}
                                        onChange={(e) =>
                                            setSelectedRegion(e.target.value)
                                        }
                                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    >
                                        {regions.map((region) => (
                                            <option
                                                key={region.id}
                                                value={region.id}
                                            >
                                                {region.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* تصفية المعارض المباشرة */}
                                <div className="flex items-center md:mt-7">
                                    <input
                                        id="onlyLive"
                                        type="checkbox"
                                        checked={onlyLive}
                                        onChange={(e) =>
                                            setOnlyLive(e.target.checked)
                                        }
                                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                    />
                                    <label
                                        htmlFor="onlyLive"
                                        className="mr-2 block text-sm text-gray-700"
                                    >
                                        المعارض المباشرة فقط
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* عرض المعارض في شكل هيت ماب */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredVenues.map((venue) => (
                        <Link
                            key={venue.id}
                            href={`/broadcasts/${venue.id}`}
                            className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col h-full"
                        >
                            {/* صورة الخلفية مع عنوان المعرض */}
                            <div className="relative h-40 overflow-hidden bg-gray-200">
                                <div
                                    className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                                    style={{
                                        backgroundImage: `url('${venue.thumbnail}')`,
                                    }}
                                ></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                <h3 className="absolute bottom-4 right-4 text-white font-bold text-lg">
                                    {venue.name}
                                </h3>

                                {/* شارة البث المباشر */}
                                {venue.isLive && (
                                    <div className="absolute top-4 left-4 px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-full flex items-center">
                                        <span className="h-1.5 w-1.5 bg-white rounded-full animate-pulse mr-1"></span>
                                        مباشر
                                    </div>
                                )}
                            </div>

                            {/* معلومات المعرض */}
                            <div className="p-4 flex flex-col flex-grow">
                                <div className="flex items-start mb-2">
                                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 ml-1 flex-shrink-0" />
                                    <p className="text-sm text-gray-600">
                                        {venue.location}
                                    </p>
                                </div>

                                <div className="mt-1 text-sm text-gray-500 flex items-center">
                                    <Video className="h-4 w-4 ml-1 text-teal-600" />
                                    <span>
                                        {venue.viewersCount} مشاهد{" "}
                                        {venue.isLive ? "الآن" : "متوقع"}
                                    </span>
                                </div>

                                <div className="mt-auto pt-4 flex justify-between items-center">
                                    <span className="text-xs text-teal-600 font-medium">
                                        انقر للمشاهدة
                                    </span>
                                </div>
                            </div>

                            {/* شريط الموقع */}
                            <div className="w-full h-1 bg-gradient-to-r from-teal-500 to-teal-700"></div>
                        </Link>
                    ))}
                </div>

                {/* إذا لم توجد معارض */}
                {filteredVenues.length === 0 && (
                    <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                        <div className="p-3 bg-gray-100 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                            <Building className="h-8 w-8 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">
                            لم يتم العثور على معارض
                        </h3>
                        <p className="text-gray-500 mb-4">
                            لا توجد معارض تطابق معايير البحث المحددة
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedRegion("all");
                                setOnlyLive(false);
                            }}
                            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                        >
                            عرض جميع المعارض
                        </button>
                    </div>
                )}

                {/* عرض البث المباشر للمزاد النشط */}
                {activeAuction && (
                    <div className="mt-8">
                        <YouTubeBroadcastPlayer
                            showChat={true}
                            aspectRatio="16:9"
                            className="shadow-md rounded-lg overflow-hidden"
                        />

                        <div className="bg-white shadow-md rounded-lg p-6 mt-4">
                            <h2 className="text-2xl font-bold mb-4">
                                المزاد الحالي
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-1">
                                    <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-md overflow-hidden">
                                        {activeAuction.car &&
                                        activeAuction.car.main_image ? (
                                            <img
                                                src={
                                                    activeAuction.car.main_image
                                                }
                                                alt={
                                                    activeAuction.car.name ||
                                                    "صورة السيارة"
                                                }
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full bg-gray-100">
                                                <p className="text-gray-500">
                                                    لا توجد صورة
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    {activeAuction.car && (
                                        <>
                                            <h3 className="text-xl font-semibold">
                                                {activeAuction.car.make}{" "}
                                                {activeAuction.car.model}
                                            </h3>
                                            <p className="text-gray-600 mb-4">
                                                {activeAuction.car.year} •{" "}
                                                {activeAuction.car.mileage} كم
                                            </p>

                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        سعر البداية
                                                    </p>
                                                    <p className="font-semibold">
                                                        {
                                                            activeAuction.starting_price
                                                        }{" "}
                                                        ريال
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        أعلى مزايدة
                                                    </p>
                                                    <p className="font-semibold">
                                                        {activeAuction.current_price ||
                                                            activeAuction.starting_price}{" "}
                                                        ريال
                                                    </p>
                                                </div>
                                            </div>

                                            {isLoggedIn ? (
                                                <BidForm
                                                    auctionId={activeAuction.id}
                                                    currentPrice={
                                                        activeAuction.current_price ||
                                                        activeAuction.starting_price
                                                    }
                                                    onBidPlaced={
                                                        fetchActiveAuction
                                                    }
                                                />
                                            ) : (
                                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                                                    <p className="text-yellow-700">
                                                        يرجى تسجيل الدخول
                                                        للمشاركة في المزاد
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
