"use client";

import React from "react";
import LoadingLink from "@/components/LoadingLink";
import { motion } from "framer-motion";
import {
  FiRadio,
  FiHome,
  FiPlusSquare,
  FiLayers,
  FiDollarSign,
  FiBarChart2,
  FiUser,
  FiStar,
  FiTruck,
  FiGift,
  FiDatabase,
  FiLogOut,
  FiCalendar,
} from "react-icons/fi";
import { FaWallet, FaMoneyCheckAlt, FaChartBar } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { Avatar } from "antd";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useAuthStore } from "@/store/authStore";

/* ===== أدوات مساعدة ===== */
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
const normalizePath = (p?: string) => {
  if (!p) return "/";
  const trimmed = p.replace(/\/+$/, "");
  return trimmed.length ? trimmed : "/";
};

/* ===== عناصر القائمة ===== */
const navItems = [
  { href: "/exhibitor", icon: FiHome, label: "الرئيسية" },
  { href: "/exhibitor/add-car", icon: FiPlusSquare, label: "إضافة سيارة" },
  { href: "/exhibitor/all-cars", icon: FiLayers, label: "جميع السيارات" },
  { href: "/exhibitor/auctions", icon: FiDollarSign, label: "المزادات" },

  // ✅ جلسات المزاد
  { href: "/exhibitor/sessions", icon: FiCalendar, label: "جلسات المزاد" },

  {
    href: "/exhibitor/live-sessions",
    icon: FiRadio,
    label: "جلسات البث المباشر",
  },

  { href: "/exhibitor/analytics", icon: FiBarChart2, label: "التحليلات" },

  // ✅ NEW TAB
  {
    href: "/similar-price-analysis",
    icon: FiBarChart2,
    label: "تحليل الأسعار المشابهة",
  },

  { href: "/exhibitor/wallet", icon: FaWallet, label: "رصيد المحفظة" },
  { href: "/exhibitor/ratings", icon: FiStar, label: "التقييمات" },
  { href: "/exhibitor/shipping", icon: FiTruck, label: "الشحن" },
  { href: "/exhibitor/commission", icon: FaMoneyCheckAlt, label: "خانة السعي" },
  { href: "/exhibitor/extra-services", icon: FiGift, label: "خدمات إضافية" },
  { href: "/exhibitor/financial", icon: FaChartBar, label: "العمليات المالية" },
  { href: "/exhibitor/cars-data", icon: FiDatabase, label: "بيانات السيارات" },
  { href: "/exhibitor/profile", icon: FiUser, label: "الملف الشخصي" },
];

export function Sidebar() {
  const pathname = usePathname();
  const _router = useLoadingRouter(); // احتياطي لو احتجناه لاحقًا
  const { user, logout } = useAuthStore();

  const currentPath = normalizePath(pathname);

  // ✅ الرئيسية exact فقط، وباقي العناصر exact أو يبدأ بمسار فرعي
  const isItemActive = (href: string) => {
    const h = normalizePath(href);
    if (h === "/exhibitor") {
      return currentPath === h; // الرئيسية لا تكون Active إلا لو المسار مطابق تمامًا
    }
    return currentPath === h || currentPath.startsWith(h + "/");
  };

  return (
    <motion.aside
      dir="rtl"
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
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
            {user?.venue_name || "معرض السيارات"}
          </h2>
          <p className="text-xs text-foreground/70">
            مرحباً، {user?.first_name || "زائر"}
          </p>
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
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-foreground",
                      "border border-transparent hover:border-border/60 hover:bg-background/5",
                      active &&
                        "bg-primary/10 ring-1 ring-primary/40 shadow-[0_8px_24px_-12px_rgba(139,92,246,0.45)]"
                    )}
                  >
                    <span
                      className={cx(
                        "grid place-items-center rounded-lg w-9 h-9",
                        "border border-border/60",
                        "bg-background/50 group-hover:bg-background/70",
                        active && "bg-primary/25 ring-1 ring-primary/40"
                      )}
                    >
                      <Icon
                        size={18}
                        className={cx(
                          active
                            ? "text-primary"
                            : "text-foreground/80 group-hover:text-primary"
                        )}
                      />
                    </span>
                    <span
                      className={cx(
                        "truncate text-sm",
                        active ? "font-semibold text-primary" : "text-foreground"
                      )}
                    >
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
          onClick={() => logout()}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all duration-200 group"
        >
          <FiLogOut
            size={18}
            className="text-red-500 group-hover:text-red-400"
          />
          <span className="font-medium text-sm">تسجيل الخروج</span>
        </button>
      </div>

      {/* Scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: hsl(var(--primary) / 0.5);
          border-radius: 8px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: hsl(var(--primary) / 0.8);
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </motion.aside>
  );
}
