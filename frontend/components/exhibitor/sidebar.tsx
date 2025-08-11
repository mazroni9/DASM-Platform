'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  FiHome, FiPlusSquare, FiLayers, FiDollarSign, FiShoppingCart, FiLogOut,
  FiBarChart2, FiUser, FiSettings, FiStar, FiTruck, FiGift, FiDatabase
} from 'react-icons/fi';
import { FaWallet, FaMoneyCheckAlt, FaChartBar } from 'react-icons/fa';
import { usePathname } from 'next/navigation'
import { Avatar } from 'antd'

export function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/exhibitor', icon: <FiHome size={20} />, label: 'الرئيسية' },
    { href: '/exhibitor/add-car', icon: <FiPlusSquare size={20} />, label: 'إضافة سيارة' },
    { href: '/exhibitor/all-cars', icon: <FiLayers size={20} />, label: 'جميع السيارات' },
    { href: '/exhibitor/auctions', icon: <FiDollarSign size={20} />, label: 'المزادات' },
    { href: '/exhibitor/requests', icon: <FiShoppingCart size={20} />, label: 'الطلبات' },
    { href: '/exhibitor/analytics', icon: <FiBarChart2 size={20} />, label: 'التحليلات' },
    // الأقسام الجديدة
    { href: '/exhibitor/wallet', icon: <FaWallet size={20} />, label: 'رصيد المحفظة' },
    { href: '/exhibitor/ratings', icon: <FiStar size={20} />, label: 'التقييمات' },
    { href: '/exhibitor/shipping', icon: <FiTruck size={20} />, label: 'الشحن' },
    { href: '/exhibitor/commission', icon: <FaMoneyCheckAlt size={20} />, label: 'خانة السعي' },
    { href: '/exhibitor/extra-services', icon: <FiGift size={20} />, label: 'خدمات إضافية' },
    { href: '/exhibitor/financial', icon: <FaChartBar size={20} />, label: 'العمليات المالية' },
    { href: '/exhibitor/cars-data', icon: <FiDatabase size={20} />, label: 'بيانات السيارات' },
    // باقي الأقسام
    { href: '/exhibitor/profile', icon: <FiUser size={20} />, label: 'الملف الشخصي' },
    { href: '/exhibitor/settings', icon: <FiSettings size={20} />, label: 'الإعدادات' },
  ]

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-72 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white h-screen flex flex-col sticky top-0 shadow-2xl z-30"
      style={{ minHeight: '100vh' }}
    >
      {/* Header */}
      <div className="p-6 border-b border-indigo-700 flex items-center space-x-3 rtl:space-x-reverse">
        <Avatar
          size="large"
          src="https://randomuser.me/api/portraits/men/1.jpg"
          className="border-2 border-white shadow"
        />
        <div>
          <h2 className="font-bold">معرض السيارات الفاخرة</h2>
          <p className="text-xs text-indigo-200">مسؤول النظام</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar">
        <ul className="space-y-2 p-4">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg transition-all
                    ${pathname === item.href
                      ? 'bg-white text-indigo-800 shadow-md'
                      : 'hover:bg-indigo-700 hover:bg-opacity-50'
                    }
                  `}
                >
                  <span className={`${pathname === item.href ? 'text-indigo-600' : 'text-indigo-200'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-indigo-700">
        <Link href="/logout">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg hover:bg-indigo-700 hover:bg-opacity-50 text-red-100"
          >
            <FiLogOut size={20} />
            <span className="font-medium">تسجيل الخروج</span>
          </motion.div>
        </Link>
      </div>

      {/* شريط تمرير أنيق (Tailwind + custom-scrollbar) */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 7px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4f46e5;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </motion.aside>
  )
}