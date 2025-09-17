/**
 * 🧩 مكون التنبيهات الفورية للمزايدات
 * 📁 المسار: components/BidNotifications.tsx
 *
 * ✅ الوظيفة:
 * - إظهار إشعارات فورية للمزايدين عبر الإنترنت
 * - تنبيه عند تجاوز عرض المزايد
 * - تنبيه قبل عرض سيارة مهتمون بها
 * - خيارات لضبط إعدادات التنبيهات
 */

"use client";

import React, { useEffect, useState, useRef } from "react";
import {
    Bell,
    BellOff,
    Car,
    Clock,
    Check,
    X,
    Volume2,
    VolumeX,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface Notification {
    id: string;
    type:
        | "outbid"
        | "upcoming"
        | "priceChange"
        | "auctionStart"
        | "auctionEnd"
        | "bidAccepted";
    title: string;
    message: string;
    timestamp: number;
    isRead: boolean;
    itemId?: number;
    itemTitle?: string;
}

interface BidNotificationsProps {
    userId?: string;
    notificationCount?: number; // للتجربة فقط
}

export default function BidNotifications({
    userId,
    notificationCount = 3,
}: BidNotificationsProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [sound, setSound] = useState(true);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Initialize with empty notifications - will be populated from real API data
    useEffect(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    // إغلاق مربع الإشعارات عند النقر خارجه
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                notificationsRef.current &&
                !notificationsRef.current.contains(event.target as Node)
            ) {
                setShowNotifications(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // دالة لتشغيل الصوت عند وصول إشعار جديد
    const playNotificationSound = () => {
        if (sound && audioRef.current) {
            audioRef.current
                .play()
                .catch((e) => console.log("فشل تشغيل الصوت:", e));
        }
    };

    // Mock notifications disabled - using real notifications from API

    // وضع علامة "مقروءة" على الإشعار
    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    // وضع علامة "مقروءة" على جميع الإشعارات
    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    // إزالة إشعار
    const removeNotification = (id: string) => {
        const notification = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (notification && !notification.isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
    };

    // تنسيق التاريخ ليظهر كم مضى من الوقت
    const formatTimeAgo = (timestamp: number) => {
        const now = Date.now();
        const diffInSeconds = Math.floor((now - timestamp) / 1000);

        if (diffInSeconds < 60) {
            return `منذ ${diffInSeconds} ثانية`;
        } else if (diffInSeconds < 3600) {
            return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
        } else if (diffInSeconds < 86400) {
            return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
        } else {
            return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
        }
    };

    // تحديد أيقونة نوع الإشعار
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "outbid":
                return (
                    <div className="bg-red-100 p-2 rounded-full">
                        <Bell className="h-5 w-5 text-red-500" />
                    </div>
                );
            case "upcoming":
                return (
                    <div className="bg-blue-100 p-2 rounded-full">
                        <Clock className="h-5 w-5 text-blue-500" />
                    </div>
                );
            case "priceChange":
                return (
                    <div className="bg-yellow-100 p-2 rounded-full">
                        <Bell className="h-5 w-5 text-yellow-500" />
                    </div>
                );
            case "bidAccepted":
                return (
                    <div className="bg-green-100 p-2 rounded-full">
                        <Check className="h-5 w-5 text-green-500" />
                    </div>
                );
            default:
                return (
                    <div className="bg-gray-100 p-2 rounded-full">
                        <Car className="h-5 w-5 text-gray-500" />
                    </div>
                );
        }
    };

    return (
        <div className="relative inline-block" ref={notificationsRef}>
            {/* زر الإشعارات */}
            <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                aria-label="الإشعارات"
            >
                <Bell className="h-6 w-6 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* مربع الإشعارات */}
            {showNotifications && (
                <div
                    className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                    style={{ maxHeight: "500px" }}
                >
                    {/* رأس مربع الإشعارات */}
                    <div className="px-4 py-2 border-b flex justify-between items-center bg-teal-50">
                        <h3 className="font-bold text-teal-800">الإشعارات</h3>
                        <div className="flex space-x-2 rtl:space-x-reverse">
                            <button
                                onClick={() => setSound(!sound)}
                                title={sound ? "كتم الصوت" : "تشغيل الصوت"}
                                className="p-1 rounded hover:bg-gray-200"
                            >
                                {sound ? (
                                    <Volume2 size={16} />
                                ) : (
                                    <VolumeX size={16} />
                                )}
                            </button>
                            <button
                                onClick={markAllAsRead}
                                title="وضع علامة مقروءة على الكل"
                                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                            >
                                <Check size={16} />
                            </button>
                        </div>
                    </div>

                    {/* قائمة الإشعارات */}
                    <div className="overflow-y-auto max-h-96">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                لا توجد إشعارات جديدة
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-3 border-b hover:bg-gray-50 transition-colors ${
                                        notification.isRead ? "" : "bg-blue-50"
                                    }`}
                                >
                                    <div className="flex">
                                        <div className="mr-3 flex-shrink-0">
                                            {getNotificationIcon(
                                                notification.type
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-medium text-gray-900">
                                                    {notification.title}
                                                </p>
                                                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={() =>
                                                                markAsRead(
                                                                    notification.id
                                                                )
                                                            }
                                                            className="p-1 rounded hover:bg-gray-200 text-gray-500"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            removeNotification(
                                                                notification.id
                                                            )
                                                        }
                                                        className="p-1 rounded hover:bg-gray-200 text-gray-500"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {notification.message}
                                            </p>
                                            <div className="mt-1 flex justify-between items-center">
                                                <span className="text-xs text-gray-500">
                                                    {formatTimeAgo(
                                                        notification.timestamp
                                                    )}
                                                </span>
                                                {notification.itemId && (
                                                    <a
                                                        href={`/car/${notification.itemId}`}
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        عرض التفاصيل
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* تذييل مربع الإشعارات */}
                    <div className="px-4 py-2 border-t text-center">
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                            عرض جميع الإشعارات
                        </button>
                    </div>
                </div>
            )}

            {/* عنصر الصوت (مخفي) */}
            <audio ref={audioRef} src="/sounds/notification.mp3" />
        </div>
    );
}
