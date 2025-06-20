"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import toast from "react-hot-toast";

// TypeScript interfaces
interface Car {
    id: number;
    make: string;
    model: string;
    year: number;
}

interface Auction {
    id: number;
    title: string;
    car?: Car;
}

interface BroadcastInfo {
    is_live: boolean;
    youtube_video_id?: string;
    title?: string;
    description?: string;
    current_car?: Car;
    active_broadcasts?: Array<{
        id: number;
        youtube_video_id: string;
    }>;
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
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: "يجب أن يكون المبلغ رقمًا موجبًا",
        }),
    bidder_name: z
        .string()
        .min(2, { message: "اسم المزايد مطلوب ويجب أن يكون على الأقل حرفين" }),
});

export default function ModeratorBroadcastManagement() {
    const [isLoading, setIsLoading] = useState(false);
    const [carsLoading, setCarsLoading] = useState(true);
    const [auctionsLoading, setAuctionsLoading] = useState(true);
    const [broadcastInfo, setBroadcastInfo] = useState<BroadcastInfo | null>(
        null
    );
    const [cars, setCars] = useState<Car[]>([]);
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [activeTab, setActiveTab] = useState<"broadcast" | "car" | "bid">(
        "broadcast"
    );

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

    // Form for car switching
    const {
        register: registerCar,
        handleSubmit: handleSubmitCar,
        formState: { errors: carErrors },
    } = useForm({
        defaultValues: {
            car_id: "",
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
        fetchCars();
        fetchAuctions();
    }, []);

    // Fetch current broadcast info
    const fetchBroadcastInfo = async () => {
        setIsLoading(true);
        try {
            const response = await api.get("/api/moderator/dashboard");

            if (response.data.status === "success" && response.data.broadcast) {
                setBroadcastInfo(response.data.broadcast);
            }
        } catch (error) {
            console.error("Error fetching broadcast info:", error);
            toast.error("حدث خطأ أثناء جلب معلومات البث");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch cars for dropdown
    const fetchCars = async () => {
        try {
            setCarsLoading(true);
            const response = await api.get("/api/cars");
            if (response.data.status === "success") {
                setCars(response.data.data || []);
            } else {
                setCars([]);
            }
        } catch (error) {
            console.error("Error fetching cars:", error);
            toast.error("حدث خطأ أثناء جلب قائمة السيارات");
            setCars([]);
        } finally {
            setCarsLoading(false);
        }
    };

    // Fetch auctions for dropdown
    const fetchAuctions = async () => {
        try {
            setAuctionsLoading(true);
            const response = await api.get("/api/auctions?status=active");
            if (response.data.status === "success") {
                setAuctions(response.data.data || []);
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

    // Venue functionality removed as YouTube is the only streaming platform

    // Extract YouTube video ID from URL or use the ID directly
    const extractYouTubeVideoId = (url: string): string | null => {
        if (!url) return null;

        // Check if it's already just an ID (no slashes or dots)
        if (!/[\/\.]/.test(url)) return url;

        // Try to extract from various YouTube URL formats
        const regExp =
            /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    };

    // Handle broadcast start form submission
    const onStartBroadcast = async (data: {
        title: string;
        description?: string;
        youtube_url: string;
    }) => {
        setIsLoading(true);

        try {
            // Send full YouTube URL to the backend
            const response = await api.post("/api/moderator/broadcast/start", {
                title: data.title,
                description: data.description || "",
                youtube_url: data.youtube_url.trim(),
            });

            if (response.data.status === "success") {
                toast.success("تم بدء البث بنجاح");
                fetchBroadcastInfo(); // Refresh the data
                resetBroadcast();
            }
        } catch (error) {
            console.error("Error starting broadcast:", error);

            if (error.response?.data?.errors) {
                // Display validation errors
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
                fetchBroadcastInfo(); // Refresh the data
            }
        } catch (error) {
            console.error("Error stopping broadcast:", error);
            toast.error("حدث خطأ أثناء إيقاف البث");
        } finally {
            setIsLoading(false);
        }
    };

    // Switch the current car being displayed
    const onSwitchCar = async (data: { car_id: string }) => {
        setIsLoading(true);

        try {
            const broadcastId = broadcastInfo?.active_broadcasts?.[0]?.id;
            if (!broadcastId) {
                toast.error("لا يوجد بث نشط");
                return;
            }

            const response = await api.put(
                `/api/moderator/broadcast/${broadcastId}/current-car`,
                {
                    car_id: parseInt(data.car_id),
                }
            );

            if (response.data.status === "success") {
                toast.success("تم تغيير السيارة الحالية بنجاح");
                fetchBroadcastInfo(); // Refresh the data
            }
        } catch (error) {
            console.error("Error switching car:", error);
            toast.error("حدث خطأ أثناء تغيير السيارة الحالية");
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
                resetBid(); // Reset the form
            }
        } catch (error) {
            console.error("Error adding offline bid:", error);

            if (error.response?.data?.errors) {
                // Display validation errors
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
        <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6">
                إدارة البث المباشر (المشرف)
            </h2>

            {/* Broadcast Status */}
            {broadcastInfo && (
                <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-medium">
                                {broadcastInfo.title}
                            </h3>
                            {broadcastInfo.description && (
                                <p className="mt-1 text-gray-600">
                                    {broadcastInfo.description}
                                </p>
                            )}
                            <div className="mt-2 flex space-x-2 space-x-reverse">
                                <span
                                    className={`px-3 py-1 text-sm rounded-full ${
                                        broadcastInfo.is_live
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                    {broadcastInfo.is_live ? "نشط" : "غير نشط"}
                                </span>
                                {broadcastInfo.current_car && (
                                    <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800">
                                        السيارة الحالية:{" "}
                                        {broadcastInfo.current_car.make}{" "}
                                        {broadcastInfo.current_car.model}
                                    </span>
                                )}
                            </div>
                        </div>

                        {broadcastInfo.is_live && (
                            <button
                                onClick={stopBroadcast}
                                disabled={isLoading}
                                className={`px-4 py-2 rounded-md text-white bg-red-500 hover:bg-red-600 ${
                                    isLoading
                                        ? "opacity-70 cursor-not-allowed"
                                        : ""
                                }`}
                            >
                                {isLoading ? "جاري المعالجة..." : "إيقاف البث"}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <nav
                    className="-mb-px flex space-x-8 space-x-reverse"
                    aria-label="Tabs"
                >
                    <button
                        onClick={() => setActiveTab("broadcast")}
                        className={`${
                            activeTab === "broadcast"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        بدء البث
                    </button>
                    <button
                        onClick={() => setActiveTab("car")}
                        className={`${
                            activeTab === "car"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        تغيير السيارة
                    </button>
                    <button
                        onClick={() => setActiveTab("bid")}
                        className={`${
                            activeTab === "bid"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        إضافة مزايدة
                    </button>
                </nav>
            </div>

            {/* Broadcast Tab */}
            {activeTab === "broadcast" && (
                <form
                    onSubmit={handleSubmitBroadcast(onStartBroadcast)}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            عنوان البث <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            {...registerBroadcast("title")}
                            className="w-full p-2 border rounded-md"
                            placeholder="أدخل عنوان للبث المباشر"
                            disabled={broadcastInfo?.is_live || isLoading}
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
                            className="w-full p-2 border rounded-md"
                            placeholder="أدخل وصفا للبث المباشر (اختياري)"
                            disabled={broadcastInfo?.is_live || isLoading}
                            rows={2}
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
                            className="w-full p-2 border rounded-md"
                            placeholder="أدخل رابط البث المباشر على يوتيوب"
                            disabled={broadcastInfo?.is_live || isLoading}
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

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={broadcastInfo?.is_live || isLoading}
                            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                                broadcastInfo?.is_live || isLoading
                                    ? "opacity-70 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            {isLoading ? "جاري المعالجة..." : "بدء البث"}
                        </button>
                    </div>
                </form>
            )}

            {/* Car Switching Tab */}
            {activeTab === "car" && (
                <form
                    onSubmit={handleSubmitCar(onSwitchCar)}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            السيارة <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...registerCar("car_id")}
                            className="w-full p-2 border rounded-md"
                            disabled={
                                !broadcastInfo?.is_live ||
                                isLoading ||
                                carsLoading ||
                                (cars || []).length === 0
                            }
                        >
                            <option value="">
                                {carsLoading
                                    ? "جاري تحميل السيارات..."
                                    : (cars || []).length === 0
                                    ? "لا توجد سيارات متاحة"
                                    : "اختر سيارة"}
                            </option>
                            {(cars || []).map((car) => (
                                <option key={car.id} value={car.id.toString()}>
                                    {car.make} {car.model} - {car.year}
                                </option>
                            ))}
                        </select>
                        {carErrors.car_id && (
                            <p className="mt-1 text-sm text-red-600">
                                {carErrors.car_id.message}
                            </p>
                        )}
                        {!carsLoading && (cars || []).length === 0 && (
                            <p className="mt-1 text-sm text-yellow-600">
                                لا توجد سيارات متاحة في النظام. يرجى إضافة
                                سيارات أولاً.
                            </p>
                        )}
                        {carsLoading && (
                            <p className="mt-1 text-sm text-blue-600">
                                جاري تحميل قائمة السيارات...
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={
                                !broadcastInfo?.is_live ||
                                isLoading ||
                                carsLoading ||
                                (cars || []).length === 0
                            }
                            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                                !broadcastInfo?.is_live ||
                                isLoading ||
                                carsLoading ||
                                (cars || []).length === 0
                                    ? "opacity-70 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            {isLoading
                                ? "جاري المعالجة..."
                                : carsLoading
                                ? "جاري التحميل..."
                                : (cars || []).length === 0
                                ? "لا توجد سيارات متاحة"
                                : "تغيير السيارة الحالية"}
                        </button>
                    </div>
                </form>
            )}

            {/* Offline Bid Tab */}
            {activeTab === "bid" && (
                <form
                    onSubmit={handleSubmitBid(onAddOfflineBid)}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            المزاد <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...registerBid("auction_id")}
                            className="w-full p-2 border rounded-md"
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
                                    {auction.title} - {auction.car?.make}{" "}
                                    {auction.car?.model}
                                </option>
                            ))}
                        </select>
                        {bidErrors.auction_id && (
                            <p className="mt-1 text-sm text-red-600">
                                {bidErrors.auction_id.message}
                            </p>
                        )}
                        {!auctionsLoading && (auctions || []).length === 0 && (
                            <p className="mt-1 text-sm text-yellow-600">
                                لا توجد مزادات نشطة متاحة. يرجى إنشاء مزادات
                                أولاً.
                            </p>
                        )}
                        {auctionsLoading && (
                            <p className="mt-1 text-sm text-blue-600">
                                جاري تحميل قائمة المزادات...
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            اسم المزايد <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            {...registerBid("bidder_name")}
                            className="w-full p-2 border rounded-md"
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
                            type="text"
                            {...registerBid("amount")}
                            className="w-full p-2 border rounded-md"
                            placeholder="أدخل مبلغ المزايدة"
                        />
                        {bidErrors.amount && (
                            <p className="mt-1 text-sm text-red-600">
                                {bidErrors.amount.message}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={
                                isLoading ||
                                auctionsLoading ||
                                (auctions || []).length === 0
                            }
                            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                                isLoading ||
                                auctionsLoading ||
                                (auctions || []).length === 0
                                    ? "opacity-70 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            {isLoading
                                ? "جاري المعالجة..."
                                : auctionsLoading
                                ? "جاري التحميل..."
                                : (auctions || []).length === 0
                                ? "لا توجد مزادات متاحة"
                                : "إضافة مزايدة"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
