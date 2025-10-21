'use client';

import LoadingLink from "@/components/LoadingLink";
import { motion } from 'framer-motion';
import {
  FiRadio,
  FiHome,
  FiPlusSquare,
  FiLayers,
  FiDollarSign,
  FiBarChart2,
  FiUser,
  FiSettings,
  FiStar,
  FiTruck,
  FiGift,
  FiDatabase,
  FiLogOut,
} from 'react-icons/fi';
import { FaWallet, FaMoneyCheckAlt, FaChartBar } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { Avatar } from 'antd';
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useAuthStore } from '@/store/authStore';

/* ===== أدوات مساعدة ===== */
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/* ===== عناصر القائمة ===== */
const navItems = [
  { href: '/exhibitor', icon: FiHome, label: 'الرئيسية' },
  { href: '/exhibitor/add-car', icon: FiPlusSquare, label: 'إضافة سيارة' },
  { href: '/exhibitor/all-cars', icon: FiLayers, label: 'جميع السيارات' },
  { href: '/exhibitor/auctions', icon: FiDollarSign, label: 'المزادات' },
  { href: '/exhibitor/live-sessions', icon: FiRadio, label: 'جلسات البث المباشر' },
  { href: '#', icon: FiBarChart2, label: 'التحليلات' },
  { href: '#', icon: FaWallet, label: 'رصيد المحفظة' },
  { href: '#', icon: FiStar, label: 'التقييمات' },
  { href: '#', icon: FiTruck, label: 'الشحن' },
  { href: '#', icon: FaMoneyCheckAlt, label: 'خانة السعي' },
  { href: '#', icon: FiGift, label: 'خدمات إضافية' },
  { href: '#', icon: FaChartBar, label: 'العمليات المالية' },
  { href: '#', icon: FiDatabase, label: 'بيانات السيارات' },
  { href: '#', icon: FiUser, label: 'الملف الشخصي' },
  { href: '#', icon: FiSettings, label: 'الإعدادات' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useLoadingRouter(); // ممكن تحتاجه لاحقًا
  const { user, logout } = useAuthStore();

  const isItemActive = (href: string) =>
    href !== '#' && (pathname === href || pathname.startsWith(href + '/'));

  return (
    <motion.aside
      dir="rtl"
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative w-72 h-screen flex flex-col sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/70 shadow-2xl"
    >
      {/* زخرفة خفيفة */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl bg-violet-600/10" />
        <div className="absolute bottom-0 -right-24 w-72 h-72 rounded-full blur-3xl bg-cyan-400/10" />
      </div>

      {/* Header */}
      <div className="relative p-6 border-b border-slate-800/70 flex items-center gap-4">
        <Avatar
          size="large"
          src="https://saraahah.com/images/profile.png"
          className="border border-slate-700 shadow-md transition-transform hover:scale-[1.03]"
        />
        <div className="min-w-0">
          {/* 👇 ثابتة زي ما طلبت */}
          <h2 className="font-bold text-sm md:text-base text-slate-100 truncate">
            {user?.venue_name || 'معرض السيارات'}
          </h2>
          <p className="text-xs text-slate-400">مرحباً، {user?.first_name || 'زائر'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);

            return (
              <li key={item.href}>
                <LoadingLink href={item.href}>
                  <motion.div
                    whileHover={{ x: 2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-slate-200',
                      'border border-transparent hover:border-slate-800/60 hover:bg-white/5',
                      active &&
                        'bg-gradient-to-l from-violet-600/25 via-violet-500/15 to-cyan-400/15 ring-1 ring-violet-400/40 shadow-[0_8px_24px_-12px_rgba(139,92,246,0.45)]'
                    )}
                  >
                    <span
                      className={cx(
                        'grid place-items-center rounded-lg w-9 h-9',
                        'border border-slate-800/60',
                        'bg-slate-900/50 group-hover:bg-slate-900/70',
                        active && 'bg-violet-600/25 ring-1 ring-violet-400/40'
                      )}
                    >
                      <Icon size={18} className={cx(active ? 'text-white' : 'text-slate-300 group-hover:text-white')} />
                    </span>
                    <span className={cx('truncate text-sm', active ? 'font-semibold text-white' : 'text-slate-200')}>
                      {item.label}
                    </span>
                  </motion.div>
                </LoadingLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="relative p-4 border-t border-slate-800/70">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-rose-200 hover:text-white hover:bg-rose-600/20 border border-transparent hover:border-rose-500/30 transition-all duration-200 group"
        >
          <FiLogOut size={18} className="text-rose-300 group-hover:text-rose-100" />
          <span className="font-medium text-sm">تسجيل الخروج</span>
        </button>
      </div>

      {/* Scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(139,92,246,0.45), rgba(34,211,238,0.25));
          border-radius: 8px;
          border: 2px solid rgba(2,6,23,0.7);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(139,92,246,0.7), rgba(34,211,238,0.45));
        }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </motion.aside>
  );
}
