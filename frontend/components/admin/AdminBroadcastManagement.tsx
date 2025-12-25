"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
    Play,
    Pause,
    Car,
    Users,
    Eye,
    Clock,
    Loader2,
    Search,
    CheckCircle,
} from "lucide-react";

// TypeScript interfaces
interface Car {
    id: number;
    make: string;
    model: string;
    year: number;
    vin: string;
    condition: string;
    evaluation_price: number | null;
    selected_for_live_auction: boolean;
}

interface Auction {
    id: number;
    title: string;
    car?: Car;
    current_bid: number;
    status: string;
}

interface BroadcastInfo {
    is_live: boolean;
    youtube_video_id?: string;
    title?: string;
    description?: string;
    current_car?: Car;
    current_auction?: Auction;
    active_broadcasts?: Array<{
        id: number;
        youtube_video_id: string;
    }>;
    viewers_count?: number;
    bidders_count?: number;
}

// Validation schema for broadcast form
const broadcastFormSchema = z.object({
    title: z.string().min(1, { message: "عنوان البث مطلوب" }),
    description: z.string().optional(),
    youtube_url: z
        .string()
        .min(1, { message: "رابط فيديو يوتيوب مطلوب" })
        .url({ message: "يرجى إدخال رابط صحيح" }),
});

// Validation schema for offline bid form
const offlineBidFormSchema = z.object({
    auction_id: z.string().min(1, { message: "يرجى اختيار مزاد" }),
    amount: z
        .string()
        .min(1, { message: "مبلغ المزايدة مطلوب" })
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: "يرجى إدخال مبلغ صحيح",
        }),
    bidder_name: z.string().min(1, { message: "اسم المزايد مطلوب" }),
    bidder_phone: z.string().min(1, { message: "رقم الهاتف مطلوب" }),
});

// Form data types
type BroadcastFormData = z.infer<typeof broadcastFormSchema>;
type OfflineBidFormData = z.infer<typeof offlineBidFormSchema>;

export default function AdminBroadcastManagement() {
    const [broadcastInfo, setBroadcastInfo] = useState<BroadcastInfo | null>(
        null
    );
    const [activeAuctions, setActiveAuctions] = useState<Auction[]>([]);
    const [selectedCars, setSelectedCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [startingBroadcast, setStartingBroadcast] = useState(false);
    const [stoppingBroadcast, setStoppingBroadcast] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [switchingCar, setSwitchingCar] = useState(false);

    // React Hook Form setup for broadcast
    const {
        register: registerBroadcast,
        handleSubmit: handleBroadcastSubmit,
        formState: { errors: broadcastErrors },
        reset: resetBroadcastForm,
    } = useForm<BroadcastFormData>({
        resolver: zodResolver(broadcastFormSchema),
    });

    // React Hook Form setup for offline bid
    const {
        register: registerOfflineBid,
        handleSubmit: handleOfflineBidSubmit,
        formState: { errors: offlineBidErrors },
        reset: resetOfflineBidForm,
    } = useForm<OfflineBidFormData>({
        resolver: zodResolver(offlineBidFormSchema),
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load broadcast info and active auctions - using admin endpoint
            const [broadcastResponse, auctionsResponse, selectedCarsResponse] =
                await Promise.all([
                    api.get("/api/admin/dashboard"),
                    api.get("/api/admin/auctions?status=active"),
                    api.get("/api/admin/cars/live-auction-selected"),
                ]);

            if (broadcastResponse.data?.status === "success") {
                setBroadcastInfo(
                    broadcastResponse.data.data.broadcast_info || {}
                );
            }

            if (auctionsResponse.data?.status === "success") {
                setActiveAuctions(auctionsResponse.data.data.data || []);
            }

            if (selectedCarsResponse.data?.status === "success") {
                setSelectedCars(selectedCarsResponse.data.data || []);
            }
        } catch (error) {
            console.error("❌ Failed to load dashboard data:", error);
            toast.error("فشل في تحميل بيانات لوحة المعلومات");
        } finally {
            setLoading(false);
        }
    };

    const startBroadcast = async (data: BroadcastFormData) => {
        try {
            setStartingBroadcast(true);

            // Use moderator endpoint (admin has same permissions)
            const response = await api.post(
                "/api/moderator/broadcast/start",
                data
            );

            if (response.data.status === "success") {
                toast.success("تم بدء البث المباشر بنجاح");
                resetBroadcastForm();
                loadDashboardData();
            }
        } catch (error: any) {
            console.error("❌ Error starting broadcast:", error);
            toast.error(
                error.response?.data?.message || "فشل في بدء البث المباشر"
            );
        } finally {
            setStartingBroadcast(false);
        }
    };

    const stopBroadcast = async (broadcastId: number) => {
        try {
            setStoppingBroadcast(true);

            // Use moderator endpoint (admin has same permissions)
            const response = await api.post(
                `/api/moderator/broadcast/stop/${broadcastId}`
            );

            if (response.data.status === "success") {
                toast.success("تم إيقاف البث المباشر");
                loadDashboardData();
            }
        } catch (error: any) {
            console.error("❌ Error stopping broadcast:", error);
            toast.error(
                error.response?.data?.message || "فشل في إيقاف البث المباشر"
            );
        } finally {
            setStoppingBroadcast(false);
        }
    };

    const switchCar = async (broadcastId: number, carId: number) => {
        try {
            setSwitchingCar(true);

            // Use moderator endpoint (admin has same permissions)
            const response = await api.put(
                `/api/moderator/broadcast/${broadcastId}/current-car`,
                {
                    car_id: carId,
                }
            );

            if (response.data.status === "success") {
                toast.success("تم تغيير السيارة الحالية");
                loadDashboardData();
            }
        } catch (error: any) {
            console.error("❌ Error switching car:", error);
            toast.error(
                error.response?.data?.message || "فشل في تغيير السيارة"
            );
        } finally {
            setSwitchingCar(false);
        }
    };

    const switchCurrentCar = async (carId: number) => {
        if (broadcastInfo?.active_broadcasts?.[0]?.id) {
            await switchCar(broadcastInfo.active_broadcasts[0].id, carId);
        }
    };

    const addOfflineBid = async (data: OfflineBidFormData) => {
        try {
            // Use moderator endpoint (admin has same permissions)
            const response = await api.post("/api/moderator/bids/offline", {
                auction_id: parseInt(data.auction_id),
                amount: parseFloat(data.amount),
                bidder_name: data.bidder_name,
                bidder_phone: data.bidder_phone,
            });

            if (response.data.status === "success") {
                toast.success("تم إضافة المزايدة الخارجية بنجاح");
                resetOfflineBidForm();
                loadDashboardData();
            }
        } catch (error: any) {
            console.error("❌ Error adding offline bid:", error);
            toast.error(
                error.response?.data?.message || "فشل في إضافة المزايدة"
            );
        }
    };

  

    return (
        <div className="space-y-8">
            {/* Admin Broadcast Status */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-2xl font-semibold mb-6 text-red-600">
                    إدارة البث المباشر - المدير
                </h2>

                {broadcastInfo?.is_live ? (
                    <div className="space-y-6">
                        {/* Live Indicator and Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-lg font-medium text-red-600">
                                        البث مباشر الآن
                                    </span>
                                </div>

                                {/* Live Stats */}
                                <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Eye size={16} />
                                        <span>
                                            {broadcastInfo.viewers_count || 0}{" "}
                                            مشاهد
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users size={16} />
                                        <span>
                                            {broadcastInfo.bidders_count || 0}{" "}
                                            مزايد
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {broadcastInfo.active_broadcasts &&
                                broadcastInfo.active_broadcasts.length > 0 && (
                                    <button
                                        onClick={() =>
                                            stopBroadcast(
                                                broadcastInfo.active_broadcasts![0]
                                                    .id
                                            )
                                        }
                                        disabled={stoppingBroadcast}
                                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Pause size={16} />
                                        {stoppingBroadcast
                                            ? "جاري الإيقاف..."
                                            : "إيقاف البث"}
                                    </button>
                                )}
                        </div>

                        {broadcastInfo.title && (
                            <p className="text-gray-700">
                                <strong>العنوان:</strong> {broadcastInfo.title}
                            </p>
                        )}

                        {/* Live Content Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Video Stream */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    البث المباشر
                                </h3>
                                {broadcastInfo.youtube_video_id && (
                                    <div className="relative">
                                        <iframe
                                            width="100%"
                                            height="315"
                                            src={`https://www.youtube.com/embed/${broadcastInfo.youtube_video_id}?autoplay=1&mute=0`}
                                            title="البث المباشر"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="rounded-lg"
                                        ></iframe>
                                    </div>
                                )}

                                {/* Current Car Info */}
                                {broadcastInfo.current_car && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                            <Car size={16} />
                                            السيارة المعروضة حالياً
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <strong>الماركة:</strong>{" "}
                                                {broadcastInfo.current_car.make}
                                            </div>
                                            <div>
                                                <strong>الموديل:</strong>{" "}
                                                {
                                                    broadcastInfo.current_car
                                                        .model
                                                }
                                            </div>
                                            <div>
                                                <strong>السنة:</strong>{" "}
                                                {broadcastInfo.current_car.year}
                                            </div>
                                            <div>
                                                <strong>الحالة:</strong>{" "}
                                                {
                                                    broadcastInfo.current_car
                                                        .condition
                                                }
                                            </div>
                                        </div>
                                        {broadcastInfo.current_auction && (
                                            <div className="mt-3 p-3 bg-white rounded border">
                                                <div className="text-lg font-bold text-green-600">
                                                    السعر الحالي:{" "}
                                                    {broadcastInfo.current_auction.current_bid?.toLocaleString()}{" "}
                                                    ريال
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    حالة المزاد:{" "}
                                                    {
                                                        broadcastInfo
                                                            .current_auction
                                                            .status
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Car Selection Panel */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        السيارات المختارة للبث المباشر
                                    </h3>
                                    <div className="relative">
                                        <Search
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                            size={16}
                                        />
                                        <input
                                            type="text"
                                            placeholder="البحث..."
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            className="pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
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
                                                className={`p-3 mb-2 border rounded-lg cursor-pointer transition-all ${
                                                    broadcastInfo.current_car
                                                        ?.id === car.id
                                                        ? "bg-blue-100 border-blue-300 shadow-md"
                                                        : "bg-white border-gray-200 hover:bg-gray-50"
                                                }`}
                                                onClick={() =>
                                                    switchCurrentCar(car.id)
                                                }
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">
                                                            {car.make}{" "}
                                                            {car.model}{" "}
                                                            {car.year}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            VIN: {car.vin} •{" "}
                                                            {car.condition}
                                                        </div>
                                                        {car.evaluation_price && (
                                                            <div className="text-sm font-medium text-green-600">
                                                                السعر المتوقع:{" "}
                                                                {car.evaluation_price.toLocaleString()}{" "}
                                                                ريال
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {broadcastInfo
                                                            .current_car?.id ===
                                                            car.id && (
                                                            <CheckCircle
                                                                className="text-blue-500"
                                                                size={16}
                                                            />
                                                        )}
                                                        {switchingCar && (
                                                            <Loader2
                                                                className="animate-spin text-gray-400"
                                                                size={16}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                    {selectedCars.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Car className="mx-auto h-12 w-12 mb-2 text-gray-400" />
                                            <p>
                                                لا توجد سيارات مختارة للبث
                                                المباشر
                                            </p>
                                            <p className="text-sm">
                                                يرجى اختيار السيارات من صفحة
                                                إدارة السيارات
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="h-3 w-3 bg-gray-400 rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-600 mb-6">
                            لا يوجد بث مباشر حالياً
                        </p>

                        {/* Admin Broadcast Start Form */}
                        <form
                            onSubmit={handleBroadcastSubmit(startBroadcast)}
                            className="max-w-md mx-auto space-y-4"
                        >
                            <div>
                                <input
                                    {...registerBroadcast("title")}
                                    type="text"
                                    placeholder="عنوان البث"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                                {broadcastErrors.title && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {broadcastErrors.title.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <textarea
                                    {...registerBroadcast("description")}
                                    placeholder="وصف البث (اختياري)"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    rows={3}
                                />
                                {broadcastErrors.description && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {broadcastErrors.description.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <input
                                    {...registerBroadcast("youtube_url")}
                                    type="url"
                                    placeholder="رابط فيديو يوتيوب"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                                {broadcastErrors.youtube_url && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {broadcastErrors.youtube_url.message}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={startingBroadcast}
                                className="w-full bg-red-600 text-white p-3 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Play size={16} />
                                {startingBroadcast
                                    ? "جاري البدء..."
                                    : "بدء البث المباشر"}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Offline Bid Management - Admin */}
            {activeAuctions.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold mb-4 text-red-600">
                        إضافة مزايدة خارجية - صلاحية المدير
                    </h3>
                    <form
                        onSubmit={handleOfflineBidSubmit(addOfflineBid)}
                        className="grid gap-4 md:grid-cols-2"
                    >
                        <div>
                            <select
                                {...registerOfflineBid("auction_id")}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="">اختر المزاد</option>
                                {activeAuctions.map((auction) => (
                                    <option
                                        key={auction.id}
                                        value={auction.id.toString()}
                                    >
                                        {auction.car?.make} {auction.car?.model}{" "}
                                        {auction.car?.year}
                                    </option>
                                ))}
                            </select>
                            {offlineBidErrors.auction_id && (
                                <p className="text-red-500 text-sm mt-1">
                                    {offlineBidErrors.auction_id.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <input
                                {...registerOfflineBid("amount")}
                                type="number"
                                step="0.01"
                                placeholder="مبلغ المزايدة"
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            {offlineBidErrors.amount && (
                                <p className="text-red-500 text-sm mt-1">
                                    {offlineBidErrors.amount.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <input
                                {...registerOfflineBid("bidder_name")}
                                type="text"
                                placeholder="اسم المزايد"
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            {offlineBidErrors.bidder_name && (
                                <p className="text-red-500 text-sm mt-1">
                                    {offlineBidErrors.bidder_name.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <input
                                {...registerOfflineBid("bidder_phone")}
                                type="tel"
                                placeholder="رقم الهاتف"
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            {offlineBidErrors.bidder_phone && (
                                <p className="text-red-500 text-sm mt-1">
                                    {offlineBidErrors.bidder_phone.message}
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700"
                            >
                                إضافة مزايدة خارجية
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
