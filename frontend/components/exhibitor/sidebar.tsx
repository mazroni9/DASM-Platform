'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiHome,
  FiPlusSquare,
  FiLayers,
  FiDollarSign,
  FiShoppingCart,
  FiLogOut,
  FiBarChart2,
  FiUser,
  FiSettings,
  FiStar,
  FiTruck,
  FiGift,
  FiDatabase,
} from 'react-icons/fi';
import { FaWallet, FaMoneyCheckAlt, FaChartBar } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { Avatar } from 'antd';
import { useAuthStore } from '@/store/authStore';

// 🔹 عناصر القائمة
const navItems = [
  { href: '/exhibitor', icon: FiHome, label: 'الرئيسية' },
  { href: '/exhibitor/add-car', icon: FiPlusSquare, label: 'إضافة سيارة' },
  { href: '/exhibitor/all-cars', icon: FiLayers, label: 'جميع السيارات' },
  { href: '/exhibitor/auctions', icon: FiDollarSign, label: 'المزادات' },
  { href: '/exhibitor/requests', icon: FiShoppingCart, label: 'الطلبات' },
  { href: '/exhibitor/analytics', icon: FiBarChart2, label: 'التحليلات' },
  { href: '/exhibitor/wallet', icon: FaWallet, label: 'رصيد المحفظة' },
  { href: '/exhibitor/ratings', icon: FiStar, label: 'التقييمات' },
  { href: '/exhibitor/shipping', icon: FiTruck, label: 'الشحن' },
  { href: '/exhibitor/commission', icon: FaMoneyCheckAlt, label: 'خانة السعي' },
  { href: '/exhibitor/extra-services', icon: FiGift, label: 'خدمات إضافية' },
  { href: '/exhibitor/financial', icon: FaChartBar, label: 'العمليات المالية' },
  { href: '/exhibitor/cars-data', icon: FiDatabase, label: 'بيانات السيارات' },
  { href: '/exhibitor/profile', icon: FiUser, label: 'الملف الشخصي' },
  { href: '/exhibitor/settings', icon: FiSettings, label: 'الإعدادات' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-72 bg-gradient-to-b from-slate-900 via-indigo-900 to-indigo-950 text-white h-screen flex flex-col sticky top-0 shadow-2xl z-30 border-r border-indigo-800/50"
    >
      {/* Header */}
      <div className="p-6 border-b border-indigo-800/50 flex items-center space-x-4 rtl:space-x-reverse">
        <Avatar
          size="large"
          src={'https://saraahah.com/images/profile.png'}
          className="border-2 border-white shadow-lg transition-transform hover:scale-105"
        />
        <div className="text-left">
          {/* 👇 ثابتة زي ما طلبت */}
          <h2 className="font-bold text-sm md:text-base text-white truncate max-w-[150px]">
           {user?.venue_name || 'معرض السيارات'}
          </h2>
          <p className="text-xs text-indigo-200">
            مرحباً، {user?.first_name || 'زائر'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ x: 2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-xl transition-all duration-200 group
                      ${
                        isActive
                          ? 'bg-white text-indigo-900 font-bold shadow-md scale-105'
                          : 'text-indigo-100 hover:bg-indigo-500 hover:bg-opacity-20 hover:text-white'
                      }
                    `}
                  >
                    <span className={isActive ? 'text-indigo-600' : 'text-indigo-200 group-hover:text-white'}>
                      <Icon size={18} />
                    </span>
                    <span className="font-medium text-sm">{item.label}</span>
                  </motion.div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-indigo-800/50">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-xl text-red-100 hover:bg-red-600 hover:bg-opacity-30 transition-all duration-200 group"
        >
          <FiLogOut size={18} className="text-red-200 group-hover:text-red-50" />
          <span className="font-medium text-sm group-hover:text-white">تسجيل الخروج</span>
        </button>
      </div>

      {/* Scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #818cf8;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6366f1;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </motion.aside>
  );
}
