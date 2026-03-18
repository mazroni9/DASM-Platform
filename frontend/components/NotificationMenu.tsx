"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useNotification } from "context/NotificationContext";
import LoadingLink from "@/components/LoadingLink";
import NotificationItem from "@/components/NotificationItem";

interface NotificationAction {
  type?: string;
  route_name: string;
  route_params?: Record<string, string | number>;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  color?: string;
  read_at?: string | null;
  created_at: string | number;
  action?: NotificationAction;
}

export default function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotification();

  // Build notification URL from action
  const getNotificationUrl = (notification: Notification): string => {
    const action = notification.action;
    if (!action || !action.route_name) {
      return "#";
    }

    let finalUrl = action.route_name;
    if (action.route_params) {
      for (const key in action.route_params) {
        finalUrl = finalUrl.replace(
          `[${key}]`,
          String(action.route_params[key])
        );
      }
    }
    return finalUrl;
  };

  // Handle mark as read
  const handleMarkAsRead = (id: string) => {
    if (markAsRead) {
      markAsRead(id);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    if (markAllAsRead) {
      markAllAsRead();
    }
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
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
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                قراءة الكل
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notification: Notification) => {
                  const notificationUrl = getNotificationUrl(notification);
                  const isUnread = !notification.read_at;

                  // Handle notification click - mark as read if unread
                  const handleNotificationClick = () => {
                    if (isUnread) {
                      handleMarkAsRead(notification.id);
                    }
                    setIsOpen(false);
                  };

                  return (
                    <LoadingLink
                      key={notification.id}
                      href={notificationUrl}
                      onClick={handleNotificationClick}
                    >
                      <NotificationItem
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        showViewLink={notificationUrl !== "#"}
                      />
                    </LoadingLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <LoadingLink
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
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
