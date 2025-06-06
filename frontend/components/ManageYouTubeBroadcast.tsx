"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";

interface BroadcastFormData {
    title: string;
    description: string;
    youtube_video_id: string;
    is_live: boolean;
    scheduled_start_time?: string;
}

export default function ManageYouTubeBroadcast() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentBroadcast, setCurrentBroadcast] = useState<any>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<BroadcastFormData>();

    useEffect(() => {
        fetchCurrentBroadcast();
    }, []);

    const fetchCurrentBroadcast = async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/admin/broadcast");
            if (response.data.status === "success" && response.data.data) {
                setCurrentBroadcast(response.data.data);
                reset({
                    title: response.data.data.title,
                    description: response.data.data.description,
                    youtube_video_id: response.data.data.youtube_video_id,
                    is_live: response.data.data.is_live,
                    scheduled_start_time: response.data.data
                        .scheduled_start_time
                        ? new Date(response.data.data.scheduled_start_time)
                              .toISOString()
                              .slice(0, 16)
                        : undefined,
                });
            }
        } catch (error) {
            console.error("Error fetching broadcast:", error);
            toast.error("حدث خطأ أثناء جلب معلومات البث");
        } finally {
            setLoading(false);
        }
    };

    const extractYouTubeVideoId = (url: string): string | null => {
        if (!url) return null;

        // Try to match YouTube video ID from various URL formats
        const regExp =
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);

        return match && match[2].length === 11 ? match[2] : null;
    };

    const onSubmit = async (data: BroadcastFormData) => {
        setSubmitting(true);

        // Check if input is a full YouTube URL and extract ID if needed
        const videoIdOrUrl = data.youtube_video_id.trim();
        const videoId = extractYouTubeVideoId(videoIdOrUrl) || videoIdOrUrl;

        // Update the form data with the extracted video ID
        const formData = {
            ...data,
            youtube_video_id: videoId,
        };

        try {
            const url = currentBroadcast
                ? `/api/admin/broadcast/${currentBroadcast.id}`
                : "/api/admin/broadcast";

            const method = currentBroadcast ? "put" : "post";

            const response = await api[method](url, formData);

            if (response.data.status === "success") {
                toast.success(
                    currentBroadcast
                        ? "تم تحديث البث بنجاح"
                        : "تم إنشاء البث بنجاح"
                );
                fetchCurrentBroadcast();
            } else {
                toast.error(response.data.message || "حدث خطأ أثناء حفظ البث");
            }
        } catch (error: any) {
            console.error("Error saving broadcast:", error);
            const errorMessage =
                error.response?.data?.message || "حدث خطأ أثناء حفظ البث";
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const generateBroadcastUrls = (videoId: string) => {
        if (!videoId) return { embed: null, chat: null };

        return {
            embed: `https://www.youtube.com/embed/${videoId}`,
            chat: `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${window.location.hostname}`,
        };
    };

    const renderPreview = () => {
        if (!currentBroadcast?.youtube_video_id) return null;

        const { embed } = generateBroadcastUrls(
            currentBroadcast.youtube_video_id
        );

        return (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-lg mb-3">معاينة البث</h3>
                <div className="relative" style={{ paddingTop: "56.25%" }}>
                    <iframe
                        src={embed}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        );
    };

    const handleDelete = async () => {
        if (!currentBroadcast) return;

        if (!confirm("هل أنت متأكد من حذف هذا البث؟")) return;

        setSubmitting(true);

        try {
            const response = await api.delete(
                `/api/admin/broadcast/${currentBroadcast.id}`
            );

            if (response.data.status === "success") {
                toast.success("تم حذف البث بنجاح");
                setCurrentBroadcast(null);
                reset({
                    title: "",
                    description: "",
                    youtube_video_id: "",
                    is_live: false,
                    scheduled_start_time: undefined,
                });
            } else {
                toast.error(response.data.message || "حدث خطأ أثناء حذف البث");
            }
        } catch (error: any) {
            console.error("Error deleting broadcast:", error);
            const errorMessage =
                error.response?.data?.message || "حدث خطأ أثناء حذف البث";
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">إدارة البث عبر يوتيوب</h2>
                {currentBroadcast && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={submitting}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                        حذف البث
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="title"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                عنوان البث
                            </label>
                            <input
                                id="title"
                                type="text"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    errors.title
                                        ? "border-red-500"
                                        : "border-gray-300"
                                }`}
                                placeholder="أدخل عنوان البث"
                                {...register("title", {
                                    required: "عنوان البث مطلوب",
                                })}
                            />
                            {errors.title && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.title.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="description"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                وصف البث
                            </label>
                            <textarea
                                id="description"
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-md ${
                                    errors.description
                                        ? "border-red-500"
                                        : "border-gray-300"
                                }`}
                                placeholder="أدخل وصف البث"
                                {...register("description")}
                            ></textarea>
                        </div>

                        <div>
                            <label
                                htmlFor="scheduled_start_time"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                موعد بدء البث (اختياري)
                            </label>
                            <input
                                id="scheduled_start_time"
                                type="datetime-local"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                {...register("scheduled_start_time")}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="youtube_video_id"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                رابط فيديو اليوتيوب أو معرف الفيديو
                            </label>
                            <input
                                id="youtube_video_id"
                                type="text"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    errors.youtube_video_id
                                        ? "border-red-500"
                                        : "border-gray-300"
                                }`}
                                placeholder="أدخل رابط فيديو يوتيوب أو معرف الفيديو"
                                {...register("youtube_video_id", {
                                    required: "رابط أو معرف فيديو يوتيوب مطلوب",
                                })}
                            />
                            {errors.youtube_video_id && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.youtube_video_id.message}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                يمكنك إدخال رابط كامل مثل
                                https://www.youtube.com/watch?v=XXXX أو معرف
                                الفيديو فقط
                            </p>
                        </div>

                        <div className="mt-4">
                            <div className="flex items-center">
                                <input
                                    id="is_live"
                                    type="checkbox"
                                    className="h-4 w-4 text-teal-600 border-gray-300 rounded"
                                    {...register("is_live")}
                                />
                                <label
                                    htmlFor="is_live"
                                    className="mr-2 block text-sm text-gray-700"
                                >
                                    البث مباشر حالياً
                                </label>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                فعّل هذا الخيار عندما يكون البث مباشراً، وقم
                                بإلغاء تفعيله عند انتهاء البث المباشر
                            </p>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
                            >
                                {submitting
                                    ? "جاري الحفظ..."
                                    : currentBroadcast
                                    ? "تحديث البث"
                                    : "إنشاء بث جديد"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {currentBroadcast && renderPreview()}

            <div className="mt-8 bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-lg mb-3">
                    تعليمات البث عبر يوتيوب
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>قم بإنشاء بث مباشر على قناة يوتيوب الخاصة بك</li>
                    <li>
                        انسخ معرف الفيديو من رابط يوتيوب (الجزء بعد ?v= في
                        الرابط)
                    </li>
                    <li>الصق معرف الفيديو في حقل "معرف فيديو اليوتيوب"</li>
                    <li>
                        عند بدء البث المباشر، قم بتفعيل خيار "البث مباشر حالياً"
                    </li>
                    <li>
                        عند انتهاء البث المباشر، قم بإلغاء تفعيل خيار "البث
                        مباشر حالياً"
                    </li>
                </ol>
            </div>
        </div>
    );
}
