"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import toast from "react-hot-toast";

// TypeScript interfaces
interface Venue {
    id: number;
    name: string;
}

interface BroadcastInfo {
    id: number;
    title: string;
    description?: string;
    venue_id: number;
    youtube_embed_url: string;
    youtube_chat_embed_url?: string;
    youtube_stream_id?: string;
    is_live: boolean;
    scheduled_start_time?: string;
    venue?: Venue;
}

// Validation schema
const broadcastSchema = z.object({
    title: z.string().min(1, { message: "عنوان البث مطلوب" }),
    description: z.string().optional(),
    venue_id: z.string().min(1, { message: "يرجى اختيار معرض" }),
    youtube_embed_url: z
        .string()
        .min(1, { message: "رابط تضمين البث مطلوب" })
        .url({ message: "يرجى إدخال رابط صحيح" }),
    youtube_chat_embed_url: z.string().optional(),
    youtube_stream_id: z.string().optional(),
    scheduled_start_time: z.string().optional(),
    is_live: z.boolean().default(false),
});

type BroadcastFormData = z.infer<typeof broadcastSchema>;

export default function BroadcastManagement() {
    const [broadcastInfo, setBroadcastInfo] = useState<BroadcastInfo | null>(
        null
    );
    const [venues, setVenues] = useState<Venue[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<BroadcastFormData>({
        resolver: zodResolver(broadcastSchema),
    });

    // Fetch broadcast information on component mount
    useEffect(() => {
        fetchBroadcastInfo();
        fetchVenues();
    }, []);

    // Fetch current broadcast info
    const fetchBroadcastInfo = async () => {
        setIsLoading(true);
        try {
            const response = await api.get("/api/admin/broadcast");

            if (response.data.status === "success" && response.data.data) {
                setBroadcastInfo(response.data.data);

                // Populate form with existing data
                const broadcast = response.data.data;
                setValue("title", broadcast.title);
                setValue("description", broadcast.description || "");
                setValue("venue_id", broadcast.venue_id.toString());
                setValue(
                    "youtube_embed_url",
                    broadcast.youtube_embed_url || ""
                );
                setValue(
                    "youtube_chat_embed_url",
                    broadcast.youtube_chat_embed_url || ""
                );
                setValue(
                    "youtube_stream_id",
                    broadcast.youtube_stream_id || ""
                );
                setValue("is_live", broadcast.is_live);
                setValue(
                    "scheduled_start_time",
                    broadcast.scheduled_start_time
                        ? new Date(broadcast.scheduled_start_time)
                              .toISOString()
                              .substring(0, 16)
                        : ""
                );
            }
        } catch (error) {
            console.error("Error fetching broadcast info:", error);
            toast.error("حدث خطأ أثناء جلب معلومات البث");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch venues for dropdown
    const fetchVenues = async () => {
        try {
            const response = await api.get("/api/venues");
            if (response.data.status === "success") {
                setVenues(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching venues:", error);
            toast.error("حدث خطأ أثناء جلب قائمة المعارض");
        }
    };

    // Handle form submission
    const onSubmit = async (data: BroadcastFormData) => {
        setIsLoading(true);

        try {
            const endpoint = broadcastInfo
                ? "/api/admin/broadcast"
                : "/api/admin/broadcast/create";
            const method = broadcastInfo ? "put" : "post";

            // Convert string IDs to numbers
            const payload = {
                ...data,
                venue_id: parseInt(data.venue_id),
            };

            // Convert empty strings to null
            if (payload.youtube_chat_embed_url === "") {
                payload.youtube_chat_embed_url = null;
            }

            if (payload.youtube_stream_id === "") {
                payload.youtube_stream_id = null;
            }

            if (payload.scheduled_start_time === "") {
                payload.scheduled_start_time = null;
            }

            const response = await api[method](endpoint, payload);

            if (response.data.status === "success") {
                toast.success(
                    broadcastInfo
                        ? "تم تحديث البث بنجاح"
                        : "تم إنشاء البث بنجاح"
                );
                fetchBroadcastInfo(); // Refresh the data
            }
        } catch (error) {
            console.error("Error saving broadcast:", error);

            if (error.response?.data?.errors) {
                // Display validation errors
                Object.values(error.response.data.errors).forEach((err) => {
                    if (Array.isArray(err)) {
                        err.forEach((message) => toast.error(message));
                    }
                });
            } else {
                toast.error("حدث خطأ أثناء حفظ معلومات البث");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle broadcast status
    const toggleBroadcastStatus = async () => {
        if (!broadcastInfo) return;

        setIsLoading(true);
        try {
            const response = await api.put("/api/admin/broadcast/status", {
                is_live: !broadcastInfo.is_live,
            });

            if (response.data.status === "success") {
                toast.success(response.data.message);
                setBroadcastInfo({
                    ...broadcastInfo,
                    is_live: !broadcastInfo.is_live,
                });
                setValue("is_live", !broadcastInfo.is_live);
            }
        } catch (error) {
            console.error("Error toggling broadcast status:", error);
            toast.error("حدث خطأ أثناء تغيير حالة البث");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6">إدارة البث المباشر</h2>

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
                            <div className="mt-2">
                                <span
                                    className={`px-3 py-1 text-sm rounded-full ${
                                        broadcastInfo.is_live
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                    {broadcastInfo.is_live ? "نشط" : "غير نشط"}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={toggleBroadcastStatus}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded-md text-white ${
                                broadcastInfo.is_live
                                    ? "bg-red-500 hover:bg-red-600"
                                    : "bg-green-500 hover:bg-green-600"
                            } ${
                                isLoading ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                        >
                            {isLoading
                                ? "جاري المعالجة..."
                                : broadcastInfo.is_live
                                ? "إيقاف البث"
                                : "تفعيل البث"}
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            عنوان البث <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            {...register("title")}
                            className="w-full p-2 border rounded-md"
                            placeholder="عنوان البث المباشر"
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            المعرض <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...register("venue_id")}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">اختر معرض</option>
                            {venues.map((venue) => (
                                <option
                                    key={venue.id}
                                    value={venue.id.toString()}
                                >
                                    {venue.name}
                                </option>
                            ))}
                        </select>
                        {errors.venue_id && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.venue_id.message}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        وصف البث
                    </label>
                    <textarea
                        {...register("description")}
                        className="w-full p-2 border rounded-md h-24"
                        placeholder="وصف البث المباشر (اختياري)"
                    ></textarea>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        رابط تضمين البث (YouTube Embed URL){" "}
                        <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        {...register("youtube_embed_url")}
                        className="w-full p-2 border rounded-md"
                        placeholder="https://www.youtube.com/embed/YOUTUBE_VIDEO_ID"
                    />
                    {errors.youtube_embed_url && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.youtube_embed_url.message}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                        مثال: https://www.youtube.com/embed/YOUTUBE_VIDEO_ID
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        رابط تضمين الدردشة (Chat Embed URL)
                    </label>
                    <input
                        type="text"
                        {...register("youtube_chat_embed_url")}
                        className="w-full p-2 border rounded-md"
                        placeholder="https://www.youtube.com/live_chat?v=YOUTUBE_VIDEO_ID&embed_domain=your-domain.com"
                    />
                    {errors.youtube_chat_embed_url && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.youtube_chat_embed_url.message}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                        مثال:
                        https://www.youtube.com/live_chat?v=YOUTUBE_VIDEO_ID&embed_domain=your-domain.com
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        معرف البث (Stream ID)
                    </label>
                    <input
                        type="text"
                        {...register("youtube_stream_id")}
                        className="w-full p-2 border rounded-md"
                        placeholder="معرف البث المباشر على يوتيوب (اختياري)"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        موعد بدء البث المجدول
                    </label>
                    <input
                        type="datetime-local"
                        {...register("scheduled_start_time")}
                        className="w-full p-2 border rounded-md"
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="is_live"
                        {...register("is_live")}
                        className="h-4 w-4 text-blue-600"
                    />
                    <label
                        htmlFor="is_live"
                        className="mr-2 text-sm text-gray-700"
                    >
                        البث نشط حالياً
                    </label>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                            isLoading ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                    >
                        {isLoading
                            ? "جاري الحفظ..."
                            : broadcastInfo
                            ? "تحديث معلومات البث"
                            : "إنشاء بث جديد"}
                    </button>
                </div>
            </form>
        </div>
    );
}
