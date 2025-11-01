'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, Badge, Dropdown } from 'antd';
import { FiBell, FiLogOut, FiUser, FiHome } from 'react-icons/fi';
import { useLoadingRouter } from '@/hooks/useLoadingRouter';
import { useAuthStore } from '@/store/authStore';

/* ============== UI Helpers ============== */
const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-800 overflow-hidden ${className}`}>
    {children}
  </div>
);

const MenuItem = ({
  icon,
  label,
  onClick,
  danger,
}: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
  <button
    onClick={onClick}
    className={`w-full text-right px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${
      danger ? 'text-rose-400 hover:bg-rose-500/10' : 'text-slate-200 hover:bg-slate-800/60'
    }`}
  >
    <span className={danger ? 'text-rose-400' : 'text-slate-400'}>{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);

/* ============== Header ============== */
export function Header() {
  const router = useLoadingRouter();
  const { user, logout } = useAuthStore();

  // لا بيانات تجريبية؛ العداد صفر بشكل افتراضي (هنربطه بالباك-إند لاحقًا)
  const unreadCount = 0;

  /* ============== Menus ============== */
  const userMenu = (
    <Panel className="w-72">
      <div className="px-5 py-4 bg-gradient-to-l from-violet-600/90 to-fuchsia-600/90 text-white">
        <p className="font-bold text-sm truncate">{user?.venue_name || 'معرض السيارات'}</p>
        <p className="text-xs opacity-90">مرحباً، {user?.first_name || 'زائر'}</p>
      </div>
      <div className="py-2">
        <MenuItem icon={<FiHome size={16} />} label="الرئيسية" onClick={() => router.push('/exhibitor')} />
        <MenuItem icon={<FiUser size={16} />} label="الملف الشخصي" onClick={() => router.push('/exhibitor/profile')} />
        {/* تم إزالة زر الإعدادات حسب الطلب */}
        <div className="border-t border-slate-800 my-1" />
        <MenuItem icon={<FiLogOut size={16} />} label="تسجيل الخروج" onClick={logout} danger />
      </div>
    </Panel>
  );

  const notificationMenu = (
    <Panel className="w-80">
      <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
        <h3 className="font-bold text-slate-100 text-sm">الإشعارات</h3>
        <Badge count={unreadCount} color="#7c3aed" />
      </div>

      {/* لا عناصر تجريبية؛ Placeholder فقط */}
      <div className="p-6 text-center text-slate-400">
        <div className="text-xl mb-2">🔔</div>
        <p className="text-sm">لا توجد إشعارات حاليًا</p>
      </div>
    </Panel>
  );

  /* ============== Render ============== */
  return (
    <motion.header
      dir="rtl"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/70"
    >
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Brand فقط – تم إزالة البحث بالكامل */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-slate-300 text-sm font-medium truncate">
                {user?.venue_name || 'معرض السيارات'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Dropdown trigger={['click']} placement="bottomLeft" dropdownRender={() => notificationMenu}>
              <button
                aria-label="الإشعارات"
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900/60 transition-colors"
              >
                <Badge count={unreadCount} offset={[-4, 4]} size="small" color="#7c3aed">
                  <FiBell size={20} className="text-white" />
                </Badge>
              </button>
            </Dropdown>

            <Dropdown trigger={['click']} placement="bottomLeft" dropdownRender={() => userMenu}>
              <button aria-label="قائمة المستخدم" className="flex items-center gap-2 group rounded-full">
                <Avatar
                  size="large"
                  src="https://saraahah.com/images/profile.png"
                  className="border border-slate-700 shadow-md transition-transform group-hover:scale-[1.02]"
                />
                <div className="hidden md:flex flex-col text-right">
                  <p className="font-semibold text-sm text-slate-100 truncate max-w-[140px]">
                    {user?.venue_name || 'معرض السيارات'}
                  </p>
                  <p className="text-xs text-slate-400">مرحباً، {user?.first_name || 'زائر'}</p>
                </div>
              </button>
            </Dropdown>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
