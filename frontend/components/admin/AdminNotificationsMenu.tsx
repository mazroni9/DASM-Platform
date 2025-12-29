"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import api from "@/lib/axios";

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
  data: NotificationData;
  action: NotificationAction | null;
  read_at: string | null;
  created_at: string;
}

export default function AdminNotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
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
  const markAsRead = async (id: string) => {
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
    // Mark as read if unread
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }

    // Navigate to the sales page if settlement_id is available
    const settlementId = notification.data?.settlement_id;
    if (settlementId) {
      router.push(`/admin/sales?id=${settlementId}`);
      setIsOpen(false);
    }
  };

  // Format relative time
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

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl hover:bg-border transition-colors"
        aria-label="الإشعارات"
      >
        <Bell className="w-5 h-5 text-foreground/70" />
        {unreadCount > 0 && (
          <span className="absolute top-1 left-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-xl shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border sticky top-0 bg-card">
            <h3 className="font-bold text-sm">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                قراءة الكل
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-4 text-center text-foreground/50 text-sm">
                جاري التحميل...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-foreground/50 text-sm">
                لا توجد إشعارات
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 cursor-pointer hover:bg-border/50 transition-colors ${
                    !notification.read_at ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Unread indicator */}
                    <div className="mt-1.5">
                      {!notification.read_at ? (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      ) : (
                        <Check className="w-3 h-3 text-green-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-foreground/60 line-clamp-2 mt-0.5">
                        {notification.body}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-foreground/40">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                        {notification.data?.settlement_id && (
                          <span className="text-[10px] text-primary flex items-center gap-0.5">
                            <ExternalLink className="w-2.5 h-2.5" />
                            عرض التفاصيل
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
