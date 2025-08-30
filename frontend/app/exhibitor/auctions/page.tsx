'use client';

import { useEffect, useState } from 'react';
import { Header } from '../../../components/exhibitor/Header';
import { Sidebar } from '../../../components/exhibitor/sidebar';
import AuctionPage from '../../../components/exhibitor/AuctionPage';
import { FiMenu } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExhibitorDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 🔹 التأكد أننا في الكلاينت (لحل مشكلة الهيدرات)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 🔹 منع العرض حتى يبدأ الكلاينت
  if (!isClient) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {/* تحميل وهمي للـ Sidebar */}
        <div className="hidden md:block w-72 bg-gray-900 animate-pulse"></div>
        {/* تحميل وهمي للـ Header والـ Main */}
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-white animate-pulse"></div>
          <main className="p-6 flex-1 bg-gray-50"></main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* الشريط الجانبي - يظهر فقط على الشاشات المتوسطة فأكبر */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* الشريط الجانبي - نسخة الجوال (Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-40 md:hidden flex"
          >
            {/* الخلفية الشفافة */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* الشريط نفسه */}
            <motion.div className="relative w-72 bg-gradient-to-b from-slate-900 via-indigo-900 to-indigo-950 shadow-2xl">
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col w-0">
        <Header />
        <main className="p-4 md:p-6 flex-1 overflow-auto bg-gray-50">
          <AuctionPage />
        </main>
      </div>

      {/* زر القائمة - يظهر فقط على الجوال */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 left-6 bg-gradient-to-r from-indigo-600 to-fuchsia-500 text-white p-4 rounded-full shadow-xl z-30 hover:from-indigo-700 hover:to-fuchsia-600 transition-all duration-200 flex items-center justify-center"
        style={{ boxShadow: '0 10px 15px -3px rgba(147, 51, 234, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)' }}
        aria-label="فتح القائمة"
      >
        <FiMenu size={24} />
      </button>
    </div>
  );
}