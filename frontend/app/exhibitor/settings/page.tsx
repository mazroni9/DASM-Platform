"use client";

import { useEffect, useState } from "react";
import { Header } from "../../../components/exhibitor/Header";
import { Sidebar } from "../../../components/exhibitor/sidebar";
import SettingsPage from "../../../components/exhibitor/SettingsPage";
import { FiMenu } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

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
      <div dir="rtl" className="flex min-h-screen bg-background">
        {/* تحميل وهمي للـ Sidebar */}
        <div className="hidden md:block w-72 bg-card border-l border-border animate-pulse"></div>
        {/* تحميل وهمي للـ Header والـ Main */}
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-card border-b border-border animate-pulse"></div>
          <main className="p-6 flex-1 bg-background"></main>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="flex min-h-screen bg-background relative text-foreground"
    >
      {/* الشريط الجانبي - يظهر فقط على الشاشات المتوسطة فأكبر */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* الشريط الجانبي - نسخة الجوال (Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 md:hidden flex"
            role="dialog"
            aria-modal="true"
          >
            {/* الخلفية الشفافة */}
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="إغلاق القائمة"
            />
            {/* الشريط نفسه */}
            <motion.div className="relative w-72 ml-auto h-full">
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col w-0">
        <Header />
        <main className="flex-1 overflow-auto bg-background">
          <SettingsPage />
        </main>
      </div>

      {/* زر القائمة - يظهر فقط على الجوال */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-xl z-50 hover:bg-primary/90 transition-all duration-200 flex items-center justify-center"
        aria-label="فتح القائمة"
        title="القائمة"
      >
        <FiMenu size={22} />
      </button>
    </div>
  );
}
