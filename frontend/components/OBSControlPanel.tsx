"use client";

import { useState, useEffect } from "react";
import { useOBS } from "@/hooks/useOBS";
import api from "@/lib/axios";
import { Toaster } from "react-hot-toast";

export default function OBSControlPanel() {
    const [obsSettings, setObsSettings] = useState({
        ip: "localhost",
        port: 4455,
        password: "",
    });
    const [selectedScene, setSelectedScene] = useState("");
    const [isLoadingBroadcast, setIsLoadingBroadcast] = useState(false);

    const {
        isConnected,
        isStreaming,
        isLoading,
        broadcastInfo,
        connect,
        disconnect,
        startStreaming,
        stopStreaming,
        switchScene,
        getScenes,
    } = useOBS();

    // Load broadcast info on component mount
    useEffect(() => {
        fetchBroadcastInfo();
    }, []);

    // Fetch broadcast info from API
    const fetchBroadcastInfo = async () => {
        setIsLoadingBroadcast(true);
        try {
            const response = await api.get("/api/broadcast");
            if (response.data.status === "success") {
                // Broadcast info will be set by the hook after connection
            }
        } catch (error) {
            console.error("خطأ في جلب معلومات البث:", error);
        } finally {
            setIsLoadingBroadcast(false);
        }
    };

    // Handle connection form submission
    const handleConnect = (e) => {
        e.preventDefault();
        connect(obsSettings.ip, obsSettings.port, obsSettings.password);
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <Toaster position="top-center" />
            <h2 className="text-xl font-semibold mb-4">
                لوحة التحكم في البث المباشر
            </h2>

            {/* Connection Form */}
            {!isConnected ? (
                <form onSubmit={handleConnect} className="mb-6">
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                            <label className="block text-sm mb-1">
                                عنوان IP
                            </label>
                            <input
                                type="text"
                                value={obsSettings.ip}
                                onChange={(e) =>
                                    setObsSettings({
                                        ...obsSettings,
                                        ip: e.target.value,
                                    })
                                }
                                className="w-full p-2 border rounded"
                                placeholder="localhost"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">المنفذ</label>
                            <input
                                type="number"
                                value={obsSettings.port}
                                onChange={(e) =>
                                    setObsSettings({
                                        ...obsSettings,
                                        port: parseInt(e.target.value),
                                    })
                                }
                                className="w-full p-2 border rounded"
                                placeholder="4455"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">
                                كلمة المرور
                            </label>
                            <input
                                type="password"
                                value={obsSettings.password}
                                onChange={(e) =>
                                    setObsSettings({
                                        ...obsSettings,
                                        password: e.target.value,
                                    })
                                }
                                className="w-full p-2 border rounded"
                                placeholder="اختياري"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
                    >
                        {isLoading ? "جاري الاتصال..." : "اتصال بـ OBS Studio"}
                    </button>
                </form>
            ) : (
                <>
                    {/* Connected Controls */}
                    <div className="mb-6">
                        <div className="flex items-center mb-3">
                            <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-green-700 font-medium">
                                متصل بـ OBS Studio
                            </span>
                        </div>

                        <button
                            onClick={disconnect}
                            disabled={isLoading}
                            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded"
                        >
                            قطع الاتصال
                        </button>
                    </div>

                    {/* Broadcast Info */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">
                            معلومات البث المباشر
                        </h3>

                        {broadcastInfo ? (
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded">
                                <h4 className="font-medium text-blue-800">
                                    {broadcastInfo.title}
                                </h4>
                                <div className="mt-2 text-sm text-blue-700">
                                    {broadcastInfo.description && (
                                        <p className="mb-1">
                                            {broadcastInfo.description}
                                        </p>
                                    )}
                                    {broadcastInfo.venue && (
                                        <p className="font-medium">
                                            المعرض: {broadcastInfo.venue.name}
                                        </p>
                                    )}
                                    <div className="mt-2 flex items-center">
                                        <span
                                            className={`px-2 py-1 text-xs rounded ${
                                                broadcastInfo.is_live
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-800"
                                            }`}
                                        >
                                            {broadcastInfo.is_live
                                                ? "نشط"
                                                : "غير نشط"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 bg-gray-50 border border-gray-100 rounded text-gray-500">
                                {isLoadingBroadcast
                                    ? "جاري تحميل معلومات البث..."
                                    : "لم يتم العثور على بث مكون من قبل المدير"}
                            </div>
                        )}
                    </div>

                    {/* Streaming Controls */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">
                            التحكم في البث
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={startStreaming}
                                disabled={
                                    isStreaming || isLoading || !broadcastInfo
                                }
                                className={`py-2 rounded text-white ${
                                    isStreaming || isLoading || !broadcastInfo
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-green-500 hover:bg-green-600"
                                }`}
                            >
                                بدء البث
                            </button>
                            <button
                                onClick={stopStreaming}
                                disabled={!isStreaming || isLoading}
                                className={`py-2 rounded text-white ${
                                    !isStreaming || isLoading
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-red-500 hover:bg-red-600"
                                }`}
                            >
                                إيقاف البث
                            </button>
                        </div>

                        {isStreaming && (
                            <div className="mt-3 p-2 bg-green-50 border border-green-100 rounded flex items-center">
                                <div className="h-3 w-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                <span className="text-green-700">
                                    البث المباشر نشط
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Scene Selection */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">المشاهد</h3>
                        <div className="flex gap-2 mb-3">
                            <select
                                value={selectedScene}
                                onChange={(e) =>
                                    setSelectedScene(e.target.value)
                                }
                                className="flex-1 p-2 border rounded"
                            >
                                <option value="">اختر مشهد...</option>
                                {getScenes().map((scene) => (
                                    <option key={scene} value={scene}>
                                        {scene}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => switchScene(selectedScene)}
                                disabled={!selectedScene || isLoading}
                                className={`px-4 py-2 rounded text-white ${
                                    !selectedScene || isLoading
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-blue-500 hover:bg-blue-600"
                                }`}
                            >
                                تبديل
                            </button>
                        </div>
                    </div>

                    {/* Note for Dealers */}
                    <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
                        <p>
                            ملاحظة: يتم تكوين البث المباشر من قبل المدير فقط.
                            يمكنك التحكم في البث المباشر والمشاهد، لكن لا يمكنك
                            تعديل إعدادات البث الأساسية.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
