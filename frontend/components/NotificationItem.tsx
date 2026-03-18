"use client";

import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { NotificationIcon, getNotificationColor } from "./NotificationVisuals";

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    body: string;
    icon?: string;
    color?: string;
    read_at?: string | null;
    created_at: string | number;
  };
  onMarkAsRead?: (id: string) => void;
  showViewLink?: boolean;
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  showViewLink = false,
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isUnread = !notification.read_at;

  // Format relative time in Arabic
  const formatRelativeTime = (dateInput: string | number) => {
    const date =
      typeof dateInput === "number" ? new Date(dateInput) : new Date(dateInput);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "الآن";
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return date.toLocaleDateString("ar-SA");
  };

  // Handle quick read click
  const handleQuickRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex items-start gap-3.5 px-5 py-4 cursor-pointer transition-all duration-200 ${
        isUnread
          ? "bg-blue-50/60 dark:bg-blue-950/30"
          : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"
      }`}
    >
      {/* Icon */}
      <NotificationIcon
        iconName={notification.icon}
        colorName={notification.color}
        size="md"
        className="flex-shrink-0"
      />

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
          {showViewLink && (
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
            {/* Quick Read Button (visible on hover) */}
            {onMarkAsRead && (
              <button
                onClick={handleQuickRead}
                className={`w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/30 dark:hover:border-green-600 transition-all duration-200 ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
                title="تحديد كمقروء"
              >
                <Check className="w-3.5 h-3.5 text-slate-400 hover:text-green-600" />
              </button>
            )}
            {/* Blue Dot */}
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 shadow-sm" />
          </>
        )}
      </div>
    </div>
  );
}
