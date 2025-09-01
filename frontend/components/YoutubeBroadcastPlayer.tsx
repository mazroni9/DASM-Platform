"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";

interface YouTubeBroadcastPlayerProps {
    className?: string;
    aspectRatio?: string;
    showChat?: boolean;
    autoplay?: boolean;
}

export default function YouTubeBroadcastPlayer({
    className = "",
    aspectRatio = "16:9",
    showChat = false,
    autoplay = true,
}: YouTubeBroadcastPlayerProps) {
    const [broadcastData, setBroadcastData] = useState<{
        youtube_embed_url: string;
        youtube_chat_embed_url: string | null;
        is_live: boolean;
    } | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            fetchBroadcastData();
        }
    }, []);

    const fetchBroadcastData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get("/api/broadcast/current");

            if (response.data.status === "success" && response.data.data) {
                setBroadcastData(response.data.data);
            } else {
                setError("لا يوجد بث متاح حالياً");
            }
        } catch (error) {
            console.error("Error fetching broadcast data:", error);
            setError("حدث خطأ أثناء جلب بيانات البث");
        } finally {
            setIsLoading(false);
        }
    };

    const getAspectRatioStyles = () => {
        if (aspectRatio === "16:9") return { paddingTop: "56.25%" };
        if (aspectRatio === "4:3") return { paddingTop: "75%" };
        if (aspectRatio === "1:1") return { paddingTop: "100%" };
        return { paddingTop: "56.25%" };
    };

    const formatYouTubeUrl = (url: string) =>
        `${url}${url.includes("?") ? "&" : "?"}autoplay=${autoplay ? "1" : "0"}&rel=0&modestbranding=1`;

    if (isLoading) {
        return (
            <div className={`rounded-md overflow-hidden bg-gray-100 ${className}`}>
                <div style={getAspectRatioStyles()} className="relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !broadcastData) {
        return (
            <div className={`rounded-md overflow-hidden bg-gray-100 ${className}`}>
                <div style={getAspectRatioStyles()} className="relative">
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 text-gray-400 mb-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                        <p className="text-gray-600 font-medium">
                            {error || "لا يوجد بث متاح حالياً"}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${className}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`md:col-span-${showChat && broadcastData.youtube_chat_embed_url ? "2" : "3"}`}>
                    <div className="relative" style={getAspectRatioStyles()}>
                        <iframe
                            src={formatYouTubeUrl(broadcastData.youtube_embed_url)}
                            className="absolute inset-0 w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            title="بث مباشر"
                        ></iframe>
                    </div>

                    {broadcastData.is_live && (
                        <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <span className="relative flex h-2 w-2 mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            بث مباشر
                        </div>
                    )}
                </div>

                {showChat && broadcastData.youtube_chat_embed_url && (
                    <div className="md:col-span-1">
                        <div className="relative h-full" style={{ minHeight: "300px" }}>
                            <iframe
                                src={broadcastData.youtube_chat_embed_url}
                                className="absolute inset-0 w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                title="دردشة البث المباشر"
                            ></iframe>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
