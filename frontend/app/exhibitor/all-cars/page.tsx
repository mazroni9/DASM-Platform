'use client';

import { useEffect, useState } from 'react';
import { Header } from '../../../components/exhibitor/Header';
import { Sidebar } from '../../../components/exhibitor/sidebar';
import AllCars from '../../../components/exhibitor/AllCars';
import { FiMenu } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExhibitorDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // ✅ نتأكد إننا على الكلاينت (حل مشاكل الهيدرشن)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ إقفال سكرول الصفحة في وضع السايدبار على الجوال
  useEffect(() => {
    if (!isClient) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = isSidebarOpen ? 'hidden' : prev || '';
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, [isSidebarOpen, isClient]);

  // ✅ إغلاق بالق клавيش Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ⏳ Placeholder أثناء التحميل الأول (موحّد داكن)
  if (!isClient) {
    return (
      <div dir="rtl" className="flex min-h-screen bg-slate-950 text-slate-100">
        <div className="hidden md:block w-72 bg-slate-900/80 border-r border-slate-800 animate-pulse"></div>
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-slate-900/80 border-b border-slate-800 animate-pulse"></div>
          <main className="p-6 flex-1 bg-slate-950"></main>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex min-h-screen bg-slate-950 text-slate-100 relative">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar (Mobile Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[60] md:hidden flex"
            aria-modal="true"
            role="dialog"
          >
            {/* Overlay */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="إغلاق القائمة"
            />
            {/* Drawer */}
            <motion.div className="relative w-72 h-full">
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-0">
        <Header />
        <main className="p-4 md:p-6 flex-1 overflow-auto">
          <AllCars />
        </main>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 left-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-4 rounded-full shadow-xl z-50 hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200"
        style={{ boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.35), 0 4px 6px -4px rgba(0, 0, 0, 0.4)' }}
        aria-label="فتح القائمة"
      >
        <FiMenu size={22} />
      </button>
    </div>
  );
}
