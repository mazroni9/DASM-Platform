'use client';

import LoadingLink from "@/components/LoadingLink";
import { motion } from 'framer-motion';
import {
  Radio,
  Home,
  PlusSquare,
  Layers,
  DollarSign,
  BarChart2,
  User,
  Settings,
  Star,
  Truck,
  Gift,
  Database,
  LogOut,
  Calendar,
} from 'lucide-react';
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
  { href: '/exhibitor',                 icon: Home,       label: 'الرئيسية' },
  { href: '/exhibitor/add-car',         icon: PlusSquare, label: 'إضافة سيارة' },
  { href: '/exhibitor/all-cars',        icon: Layers,     label: 'جميع السيارات' },
  { href: '/exhibitor/auctions',        icon: DollarSign, label: 'المزادات' },
  { href: '/exhibitor/sessions',        icon: Calendar,   label: 'جلسات المزاد' },
  { href: '/exhibitor/live-sessions',   icon: Radio,      label: 'جلسات البث المباشر' },
  { href: '#',                          icon: BarChart2,  label: 'التحليلات' },
  { href: '#',                          icon: Wallet,     label: 'رصيد المحفظة' },
  { href: '#',                          icon: Star,       label: 'التقييمات' },
  { href: '#',                          icon: Truck,      label: 'الشحن' },
  { href: '#',                          icon: DollarSign, label: 'خانة السعي' },
  { href: '#',                          icon: Gift,       label: 'خدمات إضافية' },
  { href: '#',                          icon: BarChart2,   label: 'العمليات المالية' },
  { href: '#',                          icon: Database,   label: 'بيانات السيارات' },
  { href: '#',                          icon: User,       label: 'الملف الشخصي' },
  { href: '#',                          icon: Settings,   label: 'الإعدادات' },
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
      className="relative w-72 h-screen flex flex-col sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-r border-border shadow-2xl"
    >

      {/* Header */}
      <div className="relative p-6 border-b border-border flex items-center gap-4">
        <Avatar
          size="large"
          src="https://saraahah.com/images/profile.png"
          className="border border-border shadow-md transition-transform hover:scale-[1.03]"
        />
        <div className="min-w-0">
          <h2 className="font-bold text-sm md:text-base text-foreground truncate">
            {user?.venue_name || 'معرض السيارات'}
          </h2>
          <p className="text-xs text-foreground/70">مرحباً، {user?.first_name || 'زائر'}</p>
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
                      'group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-foreground',
                      'border border-transparent hover:border-border/60 hover:bg-background/5',
                      active &&
                        'bg-primary/10 ring-1 ring-primary/40 shadow-[0_8px_24px_-12px_rgba(139,92,246,0.45)]'
                    )}
                  >
                    <span
                      className={cx(
                        'grid place-items-center rounded-lg w-9 h-9',
                        'border border-border/60',
                        'bg-background/50 group-hover:bg-background/70',
                        active && 'bg-primary/25 ring-1 ring-primary/40'
                      )}
                    >
                      <Icon size={18} className={cx(active ? 'text-white' : 'text-foreground/80 group-hover:text-white')} />
                    </span>
                    <span className={cx('truncate text-sm', active ? 'font-semibold text-white' : 'text-foreground')}>
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
      <div className="relative p-4 border-t border-border">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all duration-200 group"
        >
          <LogOut size={18} className="text-red-500 group-hover:text-red-400" />
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
