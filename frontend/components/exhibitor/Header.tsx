'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, Badge, Dropdown, Tooltip } from 'antd';
import { FiSearch, FiBell, FiLogOut, FiUser, FiHome, FiSettings, FiX } from 'react-icons/fi';
import { useLoadingRouter } from '@/hooks/useLoadingRouter';
import { useAuthStore } from '@/store/authStore';

/* ============== Utilities ============== */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  return isMobile;
};

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
    className={`w-full text-right px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${danger ? 'text-rose-400 hover:bg-rose-500/10' : 'text-slate-200 hover:bg-slate-800/60'}`}
  >
    <span className={danger ? 'text-rose-400' : 'text-slate-400'}>{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);

/* ============== Header ============== */
export function Header() {
  const router = useLoadingRouter();
  const { user, logout } = useAuthStore();

  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [openInlineSearch, setOpenInlineSearch] = useState(false);
  const [openOverlaySearch, setOpenOverlaySearch] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const notifications = useMemo(
    () => [
      { id: 1, title: 'طلب جديد', description: 'لديك طلب حجز جديد لسيارة مرسيدس' },
      { id: 2, title: 'مزاد قادم', description: 'مزاد سيارة كلاسيكية يبدأ بعد 3 أيام' },
      { id: 3, title: 'رسالة جديدة', description: 'لديك رسالة من العميل أحمد محمد' },
    ],
    []
  );

  const runSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/exhibitor/search?q=${encodeURIComponent(q)}`);
    setSearchQuery('');
    setOpenInlineSearch(false);
    setOpenOverlaySearch(false);
  };

  // Shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey);
      if (e.key === '/' || isK) {
        e.preventDefault();
        if (isMobile) setOpenOverlaySearch(true);
        else {
          setOpenInlineSearch(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      }
      if (e.key === 'Escape') {
        setOpenInlineSearch(false);
        setOpenOverlaySearch(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobile]);

  useEffect(() => {
    if (openInlineSearch) inputRef.current?.focus();
  }, [openInlineSearch]);

  /* ============== Menus ============== */
  const userMenu = (
    <Panel className="w-72">
      <div className="px-5 py-4 bg-gradient-to-l from-violet-600/90 to-fuchsia-600/90 text-white">
        {/* 👇 لا تغيّر هذا السطر */}
        <p className="font-bold text-sm truncate">{user?.venue_name || 'معرض السيارات'}</p>
        <p className="text-xs opacity-90">مرحباً، {user?.first_name || 'زائر'}</p>
      </div>
      <div className="py-2">
        <MenuItem icon={<FiHome size={16} />} label="الرئيسية" onClick={() => router.push('/exhibitor')} />
        <MenuItem icon={<FiUser size={16} />} label="الملف الشخصي" onClick={() => router.push('/exhibitor/profile')} />
        <MenuItem icon={<FiSettings size={16} />} label="الإعدادات" onClick={() => router.push('/exhibitor/settings')} />
        <div className="border-t border-slate-800 my-1" />
        <MenuItem icon={<FiLogOut size={16} />} label="تسجيل الخروج" onClick={logout} danger />
      </div>
    </Panel>
  );

  const notificationMenu = (
    <Panel className="w-80">
      <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
        <h3 className="font-bold text-slate-100 text-sm">الإشعارات</h3>
        <Badge count={notifications.length} color="#7c3aed" />
      </div>
      <div className="max-h-64 overflow-y-auto">
        {notifications.map((n) => (
          <div key={n.id} className="p-4 hover:bg-slate-800/60 border-b border-slate-800 last:border-0 cursor-pointer transition-colors">
            <p className="font-semibold text-slate-100 text-sm">{n.title}</p>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{n.description}</p>
            <p className="text-[11px] text-slate-500 mt-1">منذ ساعتين</p>
          </div>
        ))}
      </div>
      <div className="text-center py-3 border-t border-slate-800 bg-slate-900/60">
        <button className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">عرض جميع الإشعارات</button>
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
          {/* Search / Brand */}
          <div className="flex-1 min-w-0">
            {!openInlineSearch ? (
              <div className="flex items-center gap-2">
                <Tooltip title="بحث سريع ( / أو Ctrl + K )">
                  <button
                    aria-label="فتح البحث"
                    onClick={() => (isMobile ? setOpenOverlaySearch(true) : setOpenInlineSearch(true))}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900/60 transition-colors"
                  >
                    <FiSearch size={18} />
                  </button>
                </Tooltip>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="h-6 w-[1px] bg-slate-800" />
                  <div className="text-slate-300 text-sm">{user?.venue_name || 'معرض السيارات'}</div>
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                <motion.div key="inline-search" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <FiSearch size={18} />
                    </span>
                    <input
                      ref={inputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                      onBlur={() => { if (!searchQuery) setOpenInlineSearch(false); }}
                      placeholder="ابحث عن سيارة، عميل، طلب..."
                      className="h-10 w-full rounded-xl bg-slate-900/70 text-slate-100 placeholder-slate-500 border border-slate-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 outline-none pr-4 pl-10"
                    />
                    <button
                      aria-label="إغلاق"
                      onClick={() => { setOpenInlineSearch(false); setSearchQuery(''); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Dropdown trigger={['click']} placement="bottomLeft" dropdownRender={() => notificationMenu}>
              <button aria-label="الإشعارات" className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900/60 transition-colors">
                <Badge count={notifications.length} offset={[-4, 4]} size="small" color="#7c3aed">
                  <FiBell size={20} />
                </Badge>
              </button>
            </Dropdown>

            <Dropdown trigger={['click']} placement="bottomLeft" dropdownRender={() => userMenu}>
              <button aria-label="قائمة المستخدم" className="flex items-center gap-2 group rounded-full">
                <Avatar size="large" src="https://saraahah.com/images/profile.png" className="border border-slate-700 shadow-md transition-transform group-hover:scale-[1.02]" />
                <div className="hidden md:flex flex-col text-right">
                  <p className="font-semibold text-sm text-slate-100 truncate max-w-[140px]">{user?.venue_name || 'معرض السيارات'}</p>
                  <p className="text-xs text-slate-400">مرحباً، {user?.first_name || 'زائر'}</p>
                </div>
              </button>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {openOverlaySearch && (
          <motion.div dir="rtl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60">
            <div className="absolute inset-x-0 top-0 p-3">
              <Panel className="max-w-2xl mx-auto">
                <div className="p-3 flex items-center gap-2">
                  <span className="text-slate-400 pl-1">
                    <FiSearch size={18} />
                  </span>
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                    placeholder="ابحث عن سيارة، عميل، طلب..."
                    className="h-11 flex-1 rounded-lg bg-slate-900/70 text-slate-100 placeholder-slate-500 border border-slate-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 outline-none px-3"
                  />
                  <button
                    aria-label="إغلاق البحث"
                    onClick={() => { setOpenOverlaySearch(false); setSearchQuery(''); }}
                    className="w-11 h-11 inline-flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800/60 transition-colors"
                  >
                    <FiX size={18} />
                  </button>
                </div>
                <div className="px-3 pb-3 flex justify-end">
                  <button onClick={runSearch} className="px-4 h-10 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors">بحث</button>
                </div>
              </Panel>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
