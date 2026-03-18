"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCheck,
  Check,
  ExternalLink,
  Banknote,
  AlertTriangle,
  Info,
  Car,
  Trophy,
  Gavel,
  TrendingUp,
  BadgeCheck,
  Radio,
  ArrowRightCircle,
} from "lucide-react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";

interface NotificationData {
  settlement_id?: number;
  auction_id?: number;
  car_id?: number;
  type?: string;
}

interface NotificationAction {
  type: string;
  route_name: string;
  route_params: Record<string, string | number>;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  icon?: string;
  color?: string;
  data: NotificationData;
  action: NotificationAction | null;
  read_at: string | null;
  created_at: string;
}

// Icon mapping based on icon name from backend
const getIconComponent = (iconName?: string) => {
  const iconMap: Record<string, React.ElementType> = {
    banknote: Banknote,
    trophy: Trophy,
    gavel: Gavel,
    "trending-up": TrendingUp,
    "badge-check": BadgeCheck,
    radio: Radio,
    "arrow-right-circle": ArrowRightCircle,
    car: Car,
    "alert-triangle": AlertTriangle,
    info: Info,
  };
  return iconMap[iconName || ""] || Bell;
};

// Color classes based on color name from backend
const getColorClasses = (colorName?: string) => {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    emerald: { bg: "bg-emerald-100", icon: "text-emerald-600" },
    blue: { bg: "bg-blue-100", icon: "text-blue-600" },
    amber: { bg: "bg-amber-100", icon: "text-amber-600" },
    violet: { bg: "bg-violet-100", icon: "text-violet-600" },
    slate: { bg: "bg-slate-100", icon: "text-slate-600" },
    red: { bg: "bg-red-100", icon: "text-red-600" },
  };
  return (
    colorMap[colorName || ""] || { bg: "bg-gray-100", icon: "text-gray-600" }
  );
};

export default function AdminNotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useLoadingRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get("api/admin/notifications");
      if (response.data.status === "success") {
        setNotifications(response.data.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("api/admin/notifications/unread-count");
      if (response.data.status === "success") {
        setUnreadCount(response.data.data.unread_count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      await api.post(`api/admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.post("api/admin/notifications/mark-all-read");
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }

    const settlementId = notification.data?.settlement_id;
    if (settlementId) {
      router.push(`/admin/sales?id=${settlementId}`);
      setIsOpen(false);
    }
  };

  // Format relative time in Arabic
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "الآن";
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return date.toLocaleDateString("ar-SA");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // const interval = setInterval(() => {
    //   fetchUnreadCount();
    // }, 30000);

    // return () => clearInterval(interval);

  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all duration-200"
        aria-label="الإشعارات"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -left-1 min-w-5 h-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-3 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                الإشعارات
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">
                  {unreadCount} غير مقروء
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                قراءة الكل
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notification) => {
                  const isUnread = !notification.read_at;
                  const IconComponent = getIconComponent(notification.icon);
                  const colorClasses = getColorClasses(notification.color);
                  const isHovered = hoveredId === notification.id;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      onMouseEnter={() => setHoveredId(notification.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`relative flex items-start gap-3.5 px-5 py-4 cursor-pointer transition-all duration-200 ${
                        isUnread
                          ? "bg-blue-50/60 dark:bg-blue-950/30"
                          : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClasses.bg}`}
                      >
                        <IconComponent
                          className={`w-5 h-5 ${colorClasses.icon}`}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-snug mb-1 ${
                            isUnread
                              ? "font-bold text-slate-900 dark:text-slate-100"
                              : "font-medium text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-2 mb-1.5">
                          {notification.body}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {formatRelativeTime(notification.created_at)}
                          </span>
                          {notification.data?.settlement_id && (
                            <span className="flex items-center gap-0.5 text-[11px] text-blue-500">
                              <ExternalLink className="w-3 h-3" />
                              عرض
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unread Indicator & Quick Read Button */}
                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <>
                            {/* Quick Read Button (visible on hover or always on mobile) */}
                            <button
                              onClick={(e) => markAsRead(notification.id, e)}
                              className={`w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/30 dark:hover:border-green-600 transition-all duration-200 ${
                                isHovered
                                  ? "opacity-100"
                                  : "opacity-0 sm:opacity-0"
                              } sm:group-hover:opacity-100`}
                              title="تحديد كمقروء"
                            >
                              <Check className="w-3.5 h-3.5 text-slate-400 hover:text-green-600" />
                            </button>
                            {/* Blue Dot */}
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 shadow-sm" />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <LoadingLink
              href="/admin/notifications"
              className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
            >
              عرض جميع الإشعارات
              <ExternalLink className="w-4 h-4" />
            </LoadingLink>
          </div>
        </div>
      )}
    </div>
  );
}
