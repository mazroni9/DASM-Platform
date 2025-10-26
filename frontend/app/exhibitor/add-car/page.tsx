'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu } from 'react-icons/fi';
import { Header } from '../../../components/exhibitor/Header';
import { Sidebar } from '../../../components/exhibitor/sidebar';
import AddCar from '../../../components/exhibitor/AddCar';

export default function ExhibitorDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // تأكيد التنفيذ على الكلاينت لتفادي مشاكل الهيدريشن
  useEffect(() => { setIsClient(true); }, []);

  if (!isClient) {
    return (
      <div dir="rtl" className="min-h-dvh flex bg-slate-950">
        <div className="hidden md:block w-72 bg-slate-900/80 backdrop-blur animate-pulse" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-slate-900/70 border-b border-slate-800 animate-pulse" />
          <main className="flex-1 bg-slate-950" />
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-dvh bg-slate-950 text-slate-100 flex relative">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-72 shrink-0 sticky top-0 min-h-dvh bg-gradient-to-b from-slate-950 via-slate-930 to-slate-950 border-l border-slate-800/60">
        <Sidebar />
      </aside>

      {/* Drawer (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed inset-y-0 left-0 right-auto z-50 md:hidden w-72 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 border-l border-slate-800/60 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <Sidebar />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <section className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30">
          <Header />
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto">
          {/* خلفيات ناعمة موحّدة مع الثيم */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_300px_at_100%_-50px,rgba(124,58,237,0.12),transparent)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_200px_at_0%_-80px,rgba(99,102,241,0.10),transparent)]" />
          </div>

          {/* محتوى الصفحة */}
          <div className="relative px-3 md:px-6 py-4">
            {/* بطاقات/نموذج متمركزة داخل كونتينر متجاوب */}
            <div className="max-w-7xl mx-auto">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur p-3 md:p-6 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]">
                <AddCar />
              </div>
            </div>
          </div>
        </main>
      </section>

      {/* FAB (Mobile) لفتح القائمة */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 left-6 z-40 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_10px_15px_-3px_rgba(147,51,234,0.35),0_4px_6px_-4px_rgba(0,0,0,0.35)] hover:from-violet-700 hover:to-fuchsia-700 active:scale-95 transition-transform"
        aria-label="فتح القائمة"
      >
        <FiMenu size={22} />
      </button>
    </div>
  );
}
