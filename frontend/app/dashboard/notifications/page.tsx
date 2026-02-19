"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useNotification } from "context/NotificationContext";

interface NotificationAction {
  route_name?: string;
  route_params?: Record<string, string | number>;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read_at?: string | null;
  created_at: string | number;
  action?: NotificationAction;
}

function buildActionUrl(notification: NotificationItem): string | null {
  const action = notification.action;
  if (!action?.route_name) return null;

  let finalUrl = action.route_name;
  if (action.route_params) {
    Object.keys(action.route_params).forEach((key) => {
      finalUrl = finalUrl.replace(`[${key}]`, String(action.route_params?.[key]));
    });
  }

  return finalUrl;
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } =
    useNotification();

  const items = (notifications || []) as NotificationItem[];

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">مركز الإشعارات</h1>
                <p className="text-sm text-gray-600 mt-1">
                  غير المقروء: <span className="font-semibold">{unreadCount}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refreshNotifications()}
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              >
                تحديث
              </button>
              <button
                onClick={() => markAllAsRead()}
                disabled={unreadCount === 0}
                className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-1">
                  <CheckCheck className="h-4 w-4" />
                  قراءة الكل
                </span>
              </button>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            لا توجد إشعارات حاليًا.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((notification) => {
              const isUnread = !notification.read_at;
              const actionUrl = buildActionUrl(notification);

              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl border p-4 transition ${
                    isUnread ? "border-blue-200" : "border-gray-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-gray-900">{notification.title}</h2>
                      <p className="text-sm text-gray-700 mt-1">{notification.body}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.created_at).toLocaleString("ar-SA")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="px-3 py-1.5 text-xs rounded-md border border-gray-300 hover:bg-gray-50"
                        >
                          تعليم كمقروء
                        </button>
                      )}
                      {actionUrl && actionUrl !== "#" && (
                        <a
                          href={actionUrl}
                          className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                        >
                          فتح
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

