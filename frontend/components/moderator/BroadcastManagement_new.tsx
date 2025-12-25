"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Car, Search, Users, Eye, Play, Pause, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";

// Interfaces
interface BroadcastInfo {
    is_live: boolean;
    title?: string;
    description?: string;
    youtube_video_id?: string;
    current_car?: {
        id: number;
        make: string;
        model: string;
        year: number;
        condition: string;
        evaluation_price?: number;
    };
    current_auction?: {
        id: number;
        current_bid?: number;
        status: string;
    };
    viewers_count?: number;
    bidders_count?: number;
    active_broadcasts?: Array<{
        id: number;
        title: string;
    }>;
}

interface Car {
    id: number;
    make: string;
    model: string;
    year: number;
    vin: string;
    condition: string;
    evaluation_price?: number;
}

interface Auction {
    id: number;
    title: string;
    car?: {
        make: string;
        model: string;
    };
}

// Form schemas
const broadcastFormSchema = z.object({
    title: z.string().min(1, "عنوان البث مطلوب"),
    description: z.string().optional(),
    youtube_url: z.string().url("رابط يوتيوب غير صحيح"),
});

const offlineBidFormSchema = z.object({
    auction_id: z.string().min(1, "اختيار المزاد مطلوب"),
    amount: z.string().min(1, "مبلغ المزايدة مطلوب"),
    bidder_name: z.string().min(1, "اسم المزايد مطلوب"),
});

export default function ModeratorBroadcastManagement() {
    const [isLoading, setIsLoading] = useState(false);
    const [carsLoading, setCarsLoading] = useState(true);
    const [auctionsLoading, setAuctionsLoading] = useState(true);
    const [broadcastInfo, setBroadcastInfo] = useState<BroadcastInfo | null>(
        null
    );
    const [selectedCars, setSelectedCars] = useState<Car[]>([]);
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Form for broadcast management
    const {
        register: registerBroadcast,
        handleSubmit: handleSubmitBroadcast,
        formState: { errors: broadcastErrors },
        reset: resetBroadcast,
    } = useForm({
        resolver: zodResolver(broadcastFormSchema),
        defaultValues: {
            title: "",
            description: "",
            youtube_url: "",
        },
    });

    // Form for offline bidding
    const {
        register: registerBid,
        handleSubmit: handleSubmitBid,
        formState: { errors: bidErrors },
        reset: resetBid,
    } = useForm({
        resolver: zodResolver(offlineBidFormSchema),
        defaultValues: {
            auction_id: "",
            amount: "",
            bidder_name: "",
        },
    });

    // Fetch data on component mount
    useEffect(() => {
        fetchBroadcastInfo();
        fetchAuctions();
        fetchSelectedCars();
    }, []);

    // Fetch current broadcast info
    const fetchBroadcastInfo = async () => {
        setIsLoading(true);
        try {
            const response = await api.get("/api/moderator/dashboard");
            console.log("Broadcast info response:", response.data);

            if (response.data.status === "success") {
                setBroadcastInfo(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching broadcast info:", error);
            toast.error("حدث خطأ أثناء جلب معلومات البث");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch auctions for dropdown
    const fetchAuctions = async () => {
        try {
            setAuctionsLoading(true);
            const response = await api.get("/api/auctions?status=active");
            if (response.data.status === "success") {
                // Extract the actual auctions array from the paginated response
                setAuctions(response.data.data.data || []);
            } else {
                setAuctions([]);
            }
        } catch (error) {
            console.error("Error fetching auctions:", error);
            toast.error("حدث خطأ أثناء جلب قائمة المزادات");
            setAuctions([]);
        } finally {
            setAuctionsLoading(false);
        }
    };

    // Fetch selected cars for live auction
    const fetchSelectedCars = async () => {
        try {
            const response = await api.get(
                "/api/moderator/cars/live-auction-selected"
            );
            if (response.data.status === "success") {
                setSelectedCars(response.data.data || []);
            } else {
                setSelectedCars([]);
            }
        } catch (error) {
            console.error("Error fetching selected cars:", error);
            toast.error("حدث خطأ أثناء جلب السيارات المختارة");
            setSelectedCars([]);
        }
    };

    // Switch current car in broadcast
    const switchCurrentCar = async (carId: number) => {
        if (!broadcastInfo?.active_broadcasts?.[0]?.id) {
            toast.error("لا يوجد بث نشط لتغيير السيارة");
            return;
        }

        try {
            setIsLoading(true);
            const response = await api.put(
                `/api/moderator/broadcast/${broadcastInfo.active_broadcasts[0].id}/current-car`,
                { car_id: carId }
            );

            if (response.data.status === "success") {
                toast.success("تم تغيير السيارة الحالية بنجاح");
                fetchBroadcastInfo();
            }
        } catch (error: any) {
            console.error("❌ Error switching car:", error);
            toast.error(
                error.response?.data?.message || "فشل في تغيير السيارة الحالية"
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Handle broadcast start form submission
    const onStartBroadcast = async (data: {
        title: string;
        description?: string;
        youtube_url: string;
    }) => {
        setIsLoading(true);

        try {
            const response = await api.post("/api/moderator/broadcast/start", {
                title: data.title,
                description: data.description || "",
                youtube_url: data.youtube_url.trim(),
            });

            if (response.data.status === "success") {
                toast.success("تم بدء البث بنجاح");
                fetchBroadcastInfo();
                resetBroadcast();
            }
        } catch (error) {
            console.error("Error starting broadcast:", error);

            if (error.response?.data?.errors) {
                Object.values(error.response.data.errors).forEach((err) => {
                    if (Array.isArray(err)) {
                        err.forEach((message) => toast.error(message));
                    }
                });
            } else {
                toast.error("حدث خطأ أثناء بدء البث");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Stop the current broadcast
    const stopBroadcast = async () => {
        if (!broadcastInfo) return;

        setIsLoading(true);
        try {
            const broadcastId = broadcastInfo?.active_broadcasts?.[0]?.id;
            if (!broadcastId) {
                toast.error("لا يوجد بث نشط لإيقافه");
                return;
            }

            const response = await api.post(
                `/api/moderator/broadcast/stop/${broadcastId}`
            );

            if (response.data.status === "success") {
                toast.success("تم إيقاف البث بنجاح");
                fetchBroadcastInfo();
            }
        } catch (error) {
            console.error("Error stopping broadcast:", error);
            toast.error("حدث خطأ أثناء إيقاف البث");
        } finally {
            setIsLoading(false);
        }
    };

    // Add an offline bid
    const onAddOfflineBid = async (data: {
        auction_id: string;
        amount: string;
        bidder_name: string;
    }) => {
        setIsLoading(true);

        try {
            const response = await api.post("/api/moderator/bids/offline", {
                auction_id: parseInt(data.auction_id),
                bid_amount: parseFloat(data.amount),
                bidder_name: data.bidder_name,
            });

            if (response.data.status === "success") {
                toast.success("تمت إضافة المزايدة بنجاح");
                resetBid();
            }
        } catch (error) {
            console.error("Error adding offline bid:", error);

            if (error.response?.data?.errors) {
                Object.values(error.response.data.errors).forEach((err) => {
                    if (Array.isArray(err)) {
                        err.forEach((message) => toast.error(message));
                    }
                });
            } else {
                toast.error("حدث خطأ أثناء إضافة المزايدة");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800">
                    إدارة البث المباشر
                </h2>
                {broadcastInfo?.is_live && (
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-lg font-medium text-red-600">
                                البث مباشر الآن
                            </span>
                        </div>
                        <button
                            onClick={stopBroadcast}
                            disabled={isLoading}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Pause size={16} />
                            {isLoading ? "جاري الإيقاف..." : "إيقاف البث"}
                        </button>
                    </div>
                )}
            </div>

            {!broadcastInfo?.is_live ? (
                /* Start Broadcast Interface */
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Play className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            لا يوجد بث نشط
                        </h3>
                        <p className="text-gray-600">
                            ابدأ بثًا مباشرًا جديدًا لعرض المزادات
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmitBroadcast(onStartBroadcast)}
                        className="max-w-md mx-auto space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                عنوان البث{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                {...registerBroadcast("title")}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="أدخل عنوان للبث المباشر"
                                disabled={isLoading}
                            />
                            {broadcastErrors.title && (
                                <p className="mt-1 text-sm text-red-600">
                                    {broadcastErrors.title.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                وصف البث
                            </label>
                            <textarea
                                {...registerBroadcast("description")}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="أدخل وصفا للبث المباشر (اختياري)"
                                disabled={isLoading}
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                رابط فيديو يوتيوب{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                {...registerBroadcast("youtube_url")}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="أدخل رابط البث المباشر على يوتيوب"
                                disabled={isLoading}
                            />
                            {broadcastErrors.youtube_url && (
                                <p className="mt-1 text-sm text-red-600">
                                    {broadcastErrors.youtube_url.message}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                أدخل رابط كامل للفيديو مثل:
                                https://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Play size={20} />
                                {isLoading
                                    ? "جاري بدء البث..."
                                    : "بدء البث المباشر"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                /* Live Broadcast Dashboard */
                <div className="space-y-6">
                    {/* Live Stream Display */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        {broadcastInfo.title}
                                    </h3>
                                    <p className="text-red-100">
                                        {broadcastInfo.description}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm">
                                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                        <Users size={16} />
                                        <span>
                                            {broadcastInfo.viewers_count || 0}{" "}
                                            مشاهد
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                        <Eye size={16} />
                                        <span>
                                            {broadcastInfo.bidders_count || 0}{" "}
                                            مزايد
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {broadcastInfo.youtube_video_id && (
                            <div className="aspect-video">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${broadcastInfo.youtube_video_id}?autoplay=1&mute=0`}
                                    title="البث المباشر"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        )}
                    </div>

                    {/* Current Car Info */}
                    {broadcastInfo.current_car && (
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Car size={20} />
                                السيارة المعروضة حالياً
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <div className="bg-gray-50 p-3 rounded">
                                    <label className="text-sm text-gray-600">
                                        الماركة
                                    </label>
                                    <p className="font-medium">
                                        {broadcastInfo.current_car.make}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <label className="text-sm text-gray-600">
                                        الموديل
                                    </label>
                                    <p className="font-medium">
                                        {broadcastInfo.current_car.model}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <label className="text-sm text-gray-600">
                                        السنة
                                    </label>
                                    <p className="font-medium">
                                        {broadcastInfo.current_car.year}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <label className="text-sm text-gray-600">
                                        الحالة
                                    </label>
                                    <p className="font-medium">
                                        {broadcastInfo.current_car.condition}
                                    </p>
                                </div>
                            </div>

                            {broadcastInfo.current_auction && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-green-600">
                                                السعر الحالي:{" "}
                                                {broadcastInfo.current_auction.current_bid?.toLocaleString()}{" "}
                                                ريال
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                حالة المزاد:{" "}
                                                {
                                                    broadcastInfo
                                                        .current_auction.status
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Control Panels */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Car Selection Panel */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Car size={20} />
                                تغيير السيارة المعروضة
                            </h4>

                            <div className="mb-4">
                                <div className="relative">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                        size={16}
                                    />
                                    <input
                                        type="text"
                                        placeholder="البحث في السيارات..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {selectedCars
                                    .filter(
                                        (car) =>
                                            !searchTerm ||
                                            car.make
                                                .toLowerCase()
                                                .includes(
                                                    searchTerm.toLowerCase()
                                                ) ||
                                            car.model
                                                .toLowerCase()
                                                .includes(
                                                    searchTerm.toLowerCase()
                                                ) ||
                                            car.vin
                                                .toLowerCase()
                                                .includes(
                                                    searchTerm.toLowerCase()
                                                )
                                    )
                                    .map((car) => (
                                        <div
                                            key={car.id}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                                broadcastInfo.current_car
                                                    ?.id === car.id
                                                    ? "bg-blue-50 border-blue-300 shadow-md"
                                                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                            }`}
                                            onClick={() =>
                                                switchCurrentCar(car.id)
                                            }
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">
                                                        {car.make} {car.model} -{" "}
                                                        {car.year}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {car.condition} -{" "}
                                                        {car.evaluation_price?.toLocaleString()}{" "}
                                                        ريال
                                                    </p>
                                                </div>
                                                {broadcastInfo.current_car
                                                    ?.id === car.id && (
                                                    <div className="text-blue-600">
                                                        <Eye size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            {selectedCars.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Car
                                        size={48}
                                        className="mx-auto mb-2 text-gray-300"
                                    />
                                    <p>لا توجد سيارات مختارة للبث المباشر</p>
                                </div>
                            )}
                        </div>

                        {/* Offline Bid Panel */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Users size={20} />
                                إضافة مزايدة خارجية
                            </h4>

                            <form
                                onSubmit={handleSubmitBid(onAddOfflineBid)}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        المزاد{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...registerBid("auction_id")}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        disabled={
                                            isLoading ||
                                            auctionsLoading ||
                                            (auctions || []).length === 0
                                        }
                                    >
                                        <option value="">
                                            {auctionsLoading
                                                ? "جاري تحميل المزادات..."
                                                : (auctions || []).length === 0
                                                ? "لا توجد مزادات متاحة"
                                                : "اختر مزاد"}
                                        </option>
                                        {(auctions || []).map((auction) => (
                                            <option
                                                key={auction.id}
                                                value={auction.id.toString()}
                                            >
                                                {auction.title} -{" "}
                                                {auction.car?.make}{" "}
                                                {auction.car?.model}
                                            </option>
                                        ))}
                                    </select>
                                    {bidErrors.auction_id && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {bidErrors.auction_id.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        اسم المزايد{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        {...registerBid("bidder_name")}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="أدخل اسم المزايد"
                                    />
                                    {bidErrors.bidder_name && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {bidErrors.bidder_name.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        مبلغ المزايدة{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        {...registerBid("amount")}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="أدخل مبلغ المزايدة"
                                        min="0"
                                        step="100"
                                    />
                                    {bidErrors.amount && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {bidErrors.amount.message}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={
                                        isLoading ||
                                        auctionsLoading ||
                                        (auctions || []).length === 0
                                    }
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Users size={16} />
                                    {isLoading
                                        ? "جاري الإضافة..."
                                        : "إضافة مزايدة"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
