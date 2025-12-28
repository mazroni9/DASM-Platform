"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu } from "react-icons/fi";
import { Header } from "../../../components/exhibitor/Header";
import { Sidebar } from "../../../components/exhibitor/sidebar";
import AddCar from "../../../components/exhibitor/AddCar";

export default function ExhibitorDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // تأكيد التنفيذ على الكلاينت لتفادي مشاكل الهيدريشن
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div dir="rtl" className="min-h-dvh flex bg-background">
        <div className="hidden md:block w-72 bg-card backdrop-blur animate-pulse" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-card border-b border-border animate-pulse" />
          <main className="flex-1 bg-background" />
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-dvh bg-background text-foreground flex relative"
    >
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-72 shrink-0 sticky top-0 min-h-dvh bg-card border-l border-border">
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
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed inset-y-0 left-0 right-auto z-50 md:hidden w-72 bg-card border-l border-border shadow-2xl"
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
          <div className="relative">{/* Removed gradients */}</div>

          {/* محتوى الصفحة */}
          <div className="relative px-3 md:px-6 py-4">
            {/* بطاقات/نموذج متمركزة داخل كونتينر متجاوب */}
            <div className="max-w-7xl mx-auto">
              <div className="rounded-2xl border border-border bg-card p-3 md:p-6 shadow-sm">
                <AddCar />
              </div>
            </div>
          </div>
        </main>
      </section>

      {/* FAB (Mobile) لفتح القائمة */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 left-6 z-40 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-transform"
        aria-label="فتح القائمة"
      >
        <FiMenu size={22} />
      </button>
    </div>
  );
}
