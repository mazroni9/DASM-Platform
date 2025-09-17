'use client';

import { motion } from 'framer-motion';
import { FiSearch, FiBell, FiLogOut, FiUser, FiHome, FiSettings } from 'react-icons/fi';
import { Avatar, Badge, Dropdown, Input, Tooltip } from 'antd';
import { useState } from 'react';
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useAuthStore } from '@/store/authStore';

// 🔹 عنصر قائمة
const DropdownItem = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full text-right px-4 py-2.5 hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm font-medium text-gray-700 transition-all duration-150"
  >
    {icon}
    <span>{label}</span>
  </button>
);

export function Header() {
  const router = useLoadingRouter();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'طلب جديد', description: 'لديك طلب حجز جديد لسيارة مرسيدس' },
    { id: 2, title: 'مزاد قادم', description: 'مزاد سيارة كلاسيكية يبدأ بعد 3 أيام' },
    { id: 3, title: 'رسالة جديدة', description: 'لديك رسالة من العميل أحمد محمد' },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/exhibitor/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const userMenu = (
    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-64 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        {/* 👇 لا تغير هذا النص */}
        <p className="font-bold text-sm truncate">{user?.venue_name || 'معرض السيارات'}</p>
        <p className="text-xs opacity-90">مرحباً، {user?.first_name || 'زائر'}</p>
      </div>
      <div className="py-2">
        <DropdownItem icon={<FiHome size={16} className="text-indigo-500" />} label="الرئيسية" onClick={() => router.push('/exhibitor')} />
        <DropdownItem icon={<FiUser size={16} className="text-green-500" />} label="الملف الشخصي" onClick={() => router.push('/exhibitor/profile')} />
        <DropdownItem icon={<FiSettings size={16} className="text-purple-500" />} label="الإعدادات" onClick={() => router.push('/exhibitor/settings')} />
        <div className="border-t border-gray-100 my-1"></div>
        <button
          onClick={logout}
          className="w-full text-right px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors"
        >
          <FiLogOut size={16} /> تسجيل الخروج
        </button>
      </div>
    </div>
  );

  const notificationMenu = (
    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-80 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-sm">الإشعارات</h3>
        <Badge count={notifications.length} color="#6366f1" />
      </div>
      <div className="max-h-64 overflow-y-auto">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="p-4 hover:bg-indigo-50 border-b border-gray-100 last:border-0 cursor-pointer transition-all duration-150"
          >
            <p className="font-semibold text-gray-800 text-sm">{notif.title}</p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.description}</p>
            <p className="text-xs text-gray-400 mt-1">منذ ساعتين</p>
          </div>
        ))}
      </div>
      <div className="text-center py-3 border-t border-gray-100 bg-gray-50">
        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors">
          عرض جميع الإشعارات
        </button>
      </div>
    </div>
  );

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-50"
    >
      {/* حقل البحث */} 
      <div className="relative flex-1 max-w-xl">
        {isSearchOpen ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="absolute inset-y-0 right-0 w-full md:w-auto md:relative"
            style={{ zIndex: 10 }}
          >
            <Input
              placeholder="ابحث عن سيارة، عميل، طلب..."
              prefix={<FiSearch className="text-gray-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={handleSearch}
              onBlur={() => {
                if (!searchQuery) {
                  setIsSearchOpen(false);
                }
              }}
              className="rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 h-10 text-sm shadow-sm w-full"
              autoFocus
            />
          </motion.div>
        ) : (
          <Tooltip title="بحث سريع">
            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <FiSearch className="text-gray-500" size={18} />
            </motion.div>
          </Tooltip>
        )}
      </div>

      {/* الجانب الأيمن */}
      <div className="flex items-center space-x-3 rtl:space-x-reverse z-0">
        {/* الإشعارات */}
        <Dropdown overlay={notificationMenu} trigger={['click']} placement="bottomLeft">
          <div className="relative cursor-pointer">
            <Badge count={notifications.length} offset={[-4, 4]} size="small" color="#6366f1">
              <FiBell className="text-gray-600 hover:text-indigo-600 transition-colors" size={20} />
            </Badge>
          </div>
        </Dropdown>

        {/* المستخدم */}
        <Dropdown overlay={userMenu} trigger={['click']} placement="bottomLeft">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <Avatar
              size="large"
              src={'https://saraahah.com/images/profile.png'}
              className="border-2 border-white shadow-lg transition-transform group-hover:scale-105"
            />
            <div className="hidden md:flex flex-col text-right">
              <p className="font-semibold text-sm text-gray-800 truncate max-w-[120px]">
              {user?.venue_name || 'معرض السيارات'}              </p>
              <p className="text-xs text-gray-500">مرحباً، {user?.first_name || 'زائر'}</p>
            </div>
          </motion.div>
        </Dropdown>
      </div>
    </motion.header>
  );
}
