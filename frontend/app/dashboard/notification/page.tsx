'use client';

import { BackToDashboard } from '@/components/dashboard/BackToDashboard';
import { useState } from 'react';
import { Bell, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// إشعارات وهمية مبدئية
const mockNotifications = [
  { id: 1, title: 'تم استلام دفعتك بنجاح', description: 'تمت معالجة دفعتك البالغة 1500 ريال.', type: 'success', timeAgo: 'قبل 5 دقائق' },
  { id: 2, title: 'تنبيه بخصوص حسابك', description: 'يرجى تحديث معلومات الحساب لضمان استمرار الخدمة.', type: 'warning', timeAgo: 'قبل 3 ساعات' },
  { id: 3, title: 'فشل عملية دفع', description: 'تعذر إتمام الدفع لطلب #456.', type: 'error', timeAgo: 'قبل يوم' },
  { id: 4, title: 'موافقة على طلب التمويل', description: 'تمت الموافقة على طلب تمويل سيارتك.', type: 'success', timeAgo: 'قبل يومين' },
];

// تحديد الأيقونة حسب نوع الإشعار
const getIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="text-green-600" size={20} />;
    case 'warning':
      return <AlertTriangle className="text-yellow-600" size={20} />;
    case 'error':
      return <XCircle className="text-red-600" size={20} />;
    default:
      return <Bell className="text-gray-500" size={20} />;
  }
};

export default function NotificationsPage() {
  const [notifications] = useState(mockNotifications);

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen" dir="rtl">
      <BackToDashboard />

      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">مركز الإشعارات</h1>

      {notifications.length === 0 ? (
        <p className="text-center text-gray-500">لا توجد إشعارات جديدة حالياً.</p>
      ) : (
        <div className="space-y-4 max-w-2xl mx-auto">
          {notifications.map((notification) => (
            <div key={notification.id} className="bg-white p-4 rounded-lg shadow flex items-start gap-4 border border-gray-200">
              <div className="flex-shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="flex-grow">
                <h2 className="font-semibold text-lg text-gray-800">{notification.title}</h2>
                <p className="text-sm text-gray-500 mb-1">{notification.description}</p>
                <p className="text-xs text-gray-400">{notification.timeAgo}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
