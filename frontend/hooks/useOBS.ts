"use client";

import { useState, useEffect } from "react";
import { getBackendOBSService } from "@/lib/obs/backendOBSService";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export function useOBS() {
    const [isConnected, setIsConnected] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [broadcastInfo, setBroadcastInfo] = useState(null);
    const { isLoggedIn } = useAuthStore();

    useEffect(() => {
        // تأكد من أن المستخدم مسجل الدخول قبل محاولة الاتصال
        if (!isLoggedIn) return;

        const obsService = getBackendOBSService();

        // تحديث الحالة الأولية
        setIsConnected(obsService.isConnected());
        setIsStreaming(obsService.isStreaming());
        setBroadcastInfo(obsService.getBroadcastInfo());

        // إنشاء مستمعي الأحداث
        const handleConnectionChange = () => {
            setIsConnected(obsService.isConnected());
        };

        const handleStreamingChange = () => {
            setIsStreaming(obsService.isStreaming());
        };

        // إضافة مستمعي الأحداث
        const obsInstance = obsService.getOBSService().obs;
        obsInstance.on("ConnectionOpened", handleConnectionChange);
        obsInstance.on("ConnectionClosed", handleConnectionChange);
        obsInstance.on("StreamStarted", handleStreamingChange);
        obsInstance.on("StreamStopped", handleStreamingChange);

        // تنظيف عند إلغاء التحميل
        return () => {
            obsInstance.removeListener(
                "ConnectionOpened",
                handleConnectionChange
            );
            obsInstance.removeListener(
                "ConnectionClosed",
                handleConnectionChange
            );
            obsInstance.removeListener("StreamStarted", handleStreamingChange);
            obsInstance.removeListener("StreamStopped", handleStreamingChange);
        };
    }, [isLoggedIn]);

    // الاتصال بـ OBS Studio
    const connect = async (ip = "localhost", port = 4455, password = "") => {
        if (!isLoggedIn) {
            toast.error("يجب تسجيل الدخول أولاً للاتصال بالبث");
            return false;
        }

        setIsLoading(true);
        try {
            const obsService = getBackendOBSService();
            const result = await obsService.connect(ip, port, password);

            if (result) {
                setIsConnected(true);
                setBroadcastInfo(obsService.getBroadcastInfo());
                toast.success("تم الاتصال بـ OBS Studio بنجاح");
            } else {
                toast.error("فشل الاتصال بـ OBS Studio");
            }

            return result;
        } catch (error) {
            console.error("خطأ في الاتصال بـ OBS:", error);
            toast.error("حدث خطأ أثناء محاولة الاتصال");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // قطع الاتصال بـ OBS Studio
    const disconnect = async () => {
        setIsLoading(true);
        try {
            const obsService = getBackendOBSService();
            const result = await obsService.disconnect();

            if (result) {
                setIsConnected(false);
                toast.success("تم قطع الاتصال بـ OBS Studio");
            } else {
                toast.error("فشل قطع الاتصال");
            }

            return result;
        } catch (error) {
            console.error("خطأ في قطع الاتصال بـ OBS:", error);
            toast.error("حدث خطأ أثناء محاولة قطع الاتصال");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // بدء البث المباشر
    const startStreaming = async () => {
        if (!isConnected) {
            toast.error("يجب الاتصال بـ OBS Studio أولاً");
            return false;
        }

        if (!broadcastInfo) {
            toast.error("لم يتم العثور على معلومات البث المكونة من قبل المدير");
            return false;
        }

        setIsLoading(true);
        try {
            const obsService = getBackendOBSService();
            const result = await obsService.startStreaming();

            if (result) {
                setIsStreaming(true);
                toast.success("تم بدء البث المباشر");
            } else {
                toast.error("فشل بدء البث");
            }

            return result;
        } catch (error) {
            console.error("خطأ في بدء البث:", error);
            toast.error("حدث خطأ أثناء محاولة بدء البث");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // إيقاف البث المباشر
    const stopStreaming = async () => {
        if (!isConnected) {
            toast.error("غير متصل بـ OBS Studio");
            return false;
        }

        setIsLoading(true);
        try {
            const obsService = getBackendOBSService();
            const result = await obsService.stopStreaming();

            if (result) {
                setIsStreaming(false);
                toast.success("تم إيقاف البث المباشر");
            } else {
                toast.error("فشل إيقاف البث");
            }

            return result;
        } catch (error) {
            console.error("خطأ في إيقاف البث:", error);
            toast.error("حدث خطأ أثناء محاولة إيقاف البث");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // تغيير المشهد الحالي
    const switchScene = async (sceneName) => {
        if (!isConnected) {
            toast.error("يجب الاتصال بـ OBS Studio أولاً");
            return false;
        }

        setIsLoading(true);
        try {
            const obsService = getBackendOBSService();
            const result = await obsService
                .getOBSService()
                .switchScene(sceneName);

            if (result) {
                toast.success(`تم التبديل إلى المشهد: ${sceneName}`);
            } else {
                toast.error("فشل تغيير المشهد");
            }

            return result;
        } catch (error) {
            console.error("خطأ في تغيير المشهد:", error);
            toast.error("حدث خطأ أثناء محاولة تغيير المشهد");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // الحصول على قائمة المشاهد
    const getScenes = () => {
        if (!isConnected) {
            return [];
        }

        const obsService = getBackendOBSService();
        return obsService.getOBSService().getScenes();
    };

    // تحديث معلومات السيارة
    const updateCarInfo = async (
        carInfo,
        textSourceName = "معلومات_السيارة"
    ) => {
        if (!isConnected) {
            toast.error("يجب الاتصال بـ OBS Studio أولاً");
            return false;
        }

        try {
            const obsService = getBackendOBSService();
            const result = await obsService
                .getOBSService()
                .updateCarInfo(carInfo, textSourceName);

            if (!result) {
                toast.error("فشل تحديث معلومات السيارة");
            }

            return result;
        } catch (error) {
            console.error("خطأ في تحديث معلومات السيارة:", error);
            toast.error("حدث خطأ أثناء محاولة تحديث معلومات السيارة");
            return false;
        }
    };

    return {
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
        updateCarInfo,
    };
}
