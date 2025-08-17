'use client'

import { motion } from 'framer-motion';
import { FiSettings, FiLogOut, FiBell, FiSearch, FiUser } from 'react-icons/fi';
import { Avatar, Badge, Dropdown, Input } from 'antd';

export function Header() {
  const notifications = [
    { id: 1, title: 'طلب جديد', description: 'لديك طلب حجز جديد لسيارة مرسيدس' },
    { id: 2, title: 'مزاد قادم', description: 'مزاد سيارة كلاسيكية يبدأ بعد 3 أيام' },
    { id: 3, title: 'رسالة جديدة', description: 'لديك رسالة من العميل أحمد محمد' },
  ];

  const userMenu = (
    <div className="bg-white rounded-lg shadow-lg p-2 w-48">
      <div className="px-4 py-2 border-b border-gray-100">
        <p className="font-medium">حساب المعرض</p>
        <p className="text-sm text-gray-500">معرض السيارات الفاخرة</p>
      </div>
      <div className="py-1">
        <button className="w-full text-right px-4 py-2 hover:bg-gray-50 rounded-md text-gray-700">
          <FiUser className="inline ml-2" /> الملف الشخصي
        </button>
        <button className="w-full text-right px-4 py-2 hover:bg-gray-50 rounded-md text-gray-700">
          <FiSettings className="inline ml-2" /> الإعدادات
        </button>
        <button className="w-full text-right px-4 py-2 hover:bg-gray-50 rounded-md text-red-500">
          <FiLogOut className="inline ml-2" /> تسجيل الخروج
        </button>
      </div>
    </div>
  );

  const notificationMenu = (
    <div className="bg-white rounded-lg shadow-lg p-2 w-80">
      <div className="px-4 py-2 border-b border-gray-100 font-medium">الإشعارات</div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((notification) => (
          <div key={notification.id} className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
            <p className="font-medium">{notification.title}</p>
            <p className="text-sm text-gray-500">{notification.description}</p>
            <p className="text-xs text-gray-400 mt-1">منذ ساعتين</p>
          </div>
        ))}
      </div>
      <div className="text-center py-2 border-t border-gray-100">
        <button className="text-blue-600 text-sm">عرض جميع الإشعارات</button>
      </div>
    </div>
  );

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white shadow-sm px-6 py-3 flex items-center justify-between sticky top-0 z-10"
    >
      {/* Search Bar */}
      <div className="hidden md:block w-1/3">
        <Input
          placeholder="ابحث عن سيارات، عملاء، طلبات..."
          prefix={<FiSearch className="text-gray-400" />}
          className="rounded-xl border-gray-300 hover:border-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Title for mobile */}
      <h1 className="text-xl font-bold md:hidden">لوحة التحكم</h1>

      {/* Right Side */}
      <div className="flex items-center space-x-4 rtl:space-x-reverse space-x-reverse">
        {/* Notifications */}
        <Dropdown overlay={notificationMenu} trigger={['click']} placement="bottomRight">
          <motion.div whileTap={{ scale: 0.95 }} className="relative cursor-pointer">
            <Badge count={3} className="text-xs" offset={[-5, 5]}>
              <FiBell className="text-gray-600 text-xl hover:text-blue-600 transition-colors" />
            </Badge>
          </motion.div>
        </Dropdown>

        {/* User Profile */}
        <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer"
          >
            <Avatar 
              size="default"
              src="https://randomuser.me/api/portraits/men/1.jpg"
              className="border-2 border-white shadow"
            />
            <div className="hidden md:block text-right">
              <p className="font-medium text-sm">معرض السيارات الفاخرة</p>
              <p className="text-xs text-gray-500">مسؤول النظام</p>
            </div>
          </motion.div>
        </Dropdown>
      </div>
    </motion.header>
  );
}