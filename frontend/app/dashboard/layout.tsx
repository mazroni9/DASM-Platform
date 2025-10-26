// app/dashboard/layout.tsx
"use client";

import { useEffect, useState } from "react";
import LoadingLink from "@/components/LoadingLink";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  ShoppingCart,
  CreditCard,
  ShoppingBag,
  Truck,
  ArrowRight,
  Bell,
  Search,
  Menu,
  X,
  Settings,
  BarChart3,
  Shield,
  Eye,
  LogOut,
  Car,
  TrendingUp,
  Package,
  Wallet,
  MessageCircle,
  HelpCircle,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { UserRole } from "@/types/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, isLoggedIn } = useAuth();
  const router = useLoadingRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dashboard");
    }
  }, [isLoggedIn, router]);
  
  // ألوان مخصصة لكل تبويب مع تحسينات للـ hover
  const tabColors = {
    "/dashboard": { 
      bg: "from-blue-900/20 to-cyan-900/20", 
      hoverBg: "from-blue-800/30 to-cyan-800/30",
      border: "border-blue-500/30", 
      hoverBorder: "border-blue-400/50",
      text: "text-blue-300", 
      hoverText: "text-blue-200",
      icon: "text-blue-400",
      hoverIcon: "text-blue-300",
      glow: "shadow-blue-500/10"
    },
    "/dashboard/mycars": { 
      bg: "from-purple-900/20 to-indigo-900/20", 
      hoverBg: "from-purple-800/30 to-indigo-800/30",
      border: "border-purple-500/30", 
      hoverBorder: "border-purple-400/50",
      text: "text-purple-300", 
      hoverText: "text-purple-200",
      icon: "text-purple-400",
      hoverIcon: "text-purple-300",
      glow: "shadow-purple-500/10"
    },
    "/dashboard/my-purchases": { 
      bg: "from-sky-900/20 to-cyan-900/20", 
      hoverBg: "from-sky-800/30 to-cyan-800/30",
      border: "border-sky-500/30", 
      hoverBorder: "border-sky-400/50",
      text: "text-sky-300", 
      hoverText: "text-sky-200",
      icon: "text-sky-400",
      hoverIcon: "text-sky-300",
      glow: "shadow-sky-500/10"
    },
    "/dashboard/my-sales": { 
      bg: "from-emerald-900/20 to-teal-900/20", 
      hoverBg: "from-emerald-800/30 to-teal-800/30",
      border: "border-emerald-500/30", 
      hoverBorder: "border-emerald-400/50",
      text: "text-emerald-300", 
      hoverText: "text-emerald-200",
      icon: "text-emerald-400",
      hoverIcon: "text-emerald-300",
      glow: "shadow-emerald-500/10"
    },
    "/dashboard/my-wallet": { 
      bg: "from-amber-900/20 to-yellow-900/20", 
      hoverBg: "from-amber-800/30 to-yellow-800/30",
      border: "border-amber-500/30", 
      hoverBorder: "border-amber-400/50",
      text: "text-amber-300", 
      hoverText: "text-amber-200",
      icon: "text-amber-400",
      hoverIcon: "text-amber-300",
      glow: "shadow-amber-500/10"
    },
    "/dashboard/my-transfers": { 
      bg: "from-rose-900/20 to-pink-900/20", 
      hoverBg: "from-rose-800/30 to-pink-800/30",
      border: "border-rose-500/30", 
      hoverBorder: "border-rose-400/50",
      text: "text-rose-300", 
      hoverText: "text-rose-200",
      icon: "text-rose-400",
      hoverIcon: "text-rose-300",
      glow: "shadow-rose-500/10"
    },
    "/dashboard/shipping": { 
      bg: "from-violet-900/20 to-fuchsia-900/20", 
      hoverBg: "from-violet-800/30 to-fuchsia-800/30",
      border: "border-violet-500/30", 
      hoverBorder: "border-violet-400/50",
      text: "text-violet-300", 
      hoverText: "text-violet-200",
      icon: "text-violet-400",
      hoverIcon: "text-violet-300",
      glow: "shadow-violet-500/10"
    },
    "/dashboard/profile": { 
      bg: "from-gray-900/20 to-slate-900/20", 
      hoverBg: "from-gray-800/30 to-slate-800/30",
      border: "border-gray-500/30", 
      hoverBorder: "border-gray-400/50",
      text: "text-gray-300", 
      hoverText: "text-gray-200",
      icon: "text-gray-400",
      hoverIcon: "text-gray-300",
      glow: "shadow-gray-500/10"
    },
  };

  const tabs = [
    { name: "لوحة التحكم", href: "/dashboard", icon: BarChart3, description: "نظرة عامة على إحصائياتك" },
    { name: "سيارتي", href: "/dashboard/mycars", icon: Car, description: "إدارة سياراتك المعروضة" },
    { name: "مشترياتي", href: "/dashboard/my-purchases", icon: ShoppingCart, description: "تتبع مشترياتك النشطة" },
    { name: "مبيعاتي", href: "/dashboard/my-sales", icon: ShoppingBag, description: "عرض وتتبع مبيعاتك" },
    { name: "محفظتي", href: "/dashboard/my-wallet", icon: Wallet, description: "إدارة رصيدك المالي" },
    { name: "تحويلاتي", href: "/dashboard/my-transfers", icon: ArrowRight, description: "سجل التحويلات المالية" },
    { name: "خدمات الشحن", href: "/dashboard/shipping", icon: Truck, description: "إدارة خدمات الشحن" },
    { name: "الملف الشخصي", href: "/dashboard/profile", icon: User, description: "تعديل بياناتك الشخصية" },
  ];

  // استخدام Plus من lucide-react مباشرة
  const quickActions = [
    { name: "إضافة سيارة", icon: Plus, href: "/add/Car", color: "from-green-500 to-emerald-600", hoverColor: "from-green-600 to-emerald-700" },
    { name: "عرض المزادات", icon: Eye, href: "/auctions", color: "from-blue-500 to-cyan-600", hoverColor: "from-blue-600 to-cyan-700" },
    { name: "التقارير", icon: BarChart3, href: "/dashboard/reports", color: "from-purple-500 to-pink-600", hoverColor: "from-purple-600 to-pink-700" },
    { name: "الدعم", icon: MessageCircle, href: "/support", color: "from-orange-500 to-red-600", hoverColor: "from-orange-600 to-red-700" },
  ];

  const userName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
    : "مستخدم";

  const handleLogout = () => {
    // إضافة منطق تسجيل الخروج هنا
    router.push("/auth/login");
  };

  const roleLabel = (r?: UserRole | string) => {
    const role = user.role;
    switch (role) {
      case UserRole.ADMIN:
        return "مسؤول";
      case UserRole.MODERATOR:
        return "مشرف";
      case UserRole.VENUE_OWNER:
        return "مالك معرض";
      case UserRole.INVESTOR:
        return "مستثمر";
      default:
        return "مستخدم";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100">
      {/* Header - تم إصلاح z-index */}
      <header className="sticky top-0 z-30 py-3 px-4 sm:px-6 lg:px-8 border-b border-gray-800/50 backdrop-blur-xl bg-gray-900/80">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-gray-800/50 border border-gray-700 hover:bg-gray-700/60 transition-all duration-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <LoadingLink
              href="/"
              className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium border border-white/10 hover:scale-105 hover:from-indigo-500/90 hover:to-purple-500/90"
              style={{
                color: 'white !important'
              }}
            >
              <Home className="w-4 h-4 transition-transform group-hover:scale-110 text-white" />
              <span 
                className="text-sm text-white group-hover:text-white transition-colors duration-300"
                style={{
                  color: 'white !important'
                }}
              >
                الرئيسية
              </span>
            </LoadingLink>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="hidden md:flex items-center gap-2 bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 backdrop-blur-sm hover:bg-gray-700/50 hover:border-gray-600 transition-all duration-300">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث..."
                className="bg-transparent border-none outline-none text-sm w-32 lg:w-48 text-gray-300 placeholder-gray-500"
                style={{
                  color: 'rgb(209 213 219) !important'
                }}
              />
            </div>

            {/* Notifications */}
            <button className="p-2 rounded-xl bg-gray-800/50 border border-gray-700 hover:bg-gray-700/60 hover:border-gray-600 transition-all duration-300 relative">
              <Bell className="w-4 h-4 text-gray-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-900"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                {userName.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p 
                  className="text-sm font-medium text-white leading-tight"
                  style={{
                    color: 'white !important'
                  }}
                >
                  {userName}
                </p>
                <p className="text-xs text-gray-400 leading-tight">
                 {roleLabel(user?.role)}
                </p>
              </div>
            </div>

            {/* Settings & Logout */}
            <div className="flex gap-1">
              <LoadingLink href="/dashboard/profile">
              <button className="p-2 rounded-xl bg-gray-800/50 border border-gray-700 hover:bg-gray-700/60 hover:border-gray-600 transition-all duration-300">
                <Settings className="w-4 h-4 text-gray-400" />
              </button>
              </LoadingLink>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 hover:border-red-400/50 transition-all duration-300"
              >
                <LogOut className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4">
                <h3 
                  className="text-sm font-bold text-white mb-3"
                  style={{
                    color: 'white !important'
                  }}
                >
                  إجراءات سريعة
                </h3>
                <div className="space-y-2">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <LoadingLink
                        key={action.name}
                        href={action.href}
                        className="group flex items-center gap-2 p-2 rounded-lg bg-gray-800/30 border border-gray-700/30 hover:bg-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg bg-gradient-to-r flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                          action.color,
                          "group-hover:" + action.hoverColor
                        )}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <span 
                          className="text-xs font-medium text-gray-200 group-hover:text-white transition-colors duration-300"
                          style={{
                            color: 'rgb(229 231 235) !important'
                          }}
                        >
                          {action.name}
                        </span>
                      </LoadingLink>
                    );
                  })}
                </div>
              </div>

              {/* Main Navigation */}
              <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4">
                <h3 
                  className="text-sm font-bold text-white mb-3"
                  style={{
                    color: 'white !important'
                  }}
                >
                  القائمة الرئيسية
                </h3>
                <div className="space-y-1">
                  {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    const colorConfig = tabColors[tab.href] || tabColors["/dashboard/profile"];
                    const Icon = tab.icon;
                    
                    return (
                      <LoadingLink
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                          "group flex items-center gap-2 p-3 rounded-lg transition-all duration-300 border",
                          isActive
                            ? `${colorConfig.bg} ${colorConfig.border} ${colorConfig.text} ${colorConfig.glow} shadow-lg`
                            : `bg-gray-800/30 border-gray-700/30 text-gray-300 hover:${colorConfig.hoverBg} hover:${colorConfig.hoverBorder} hover:${colorConfig.hoverText}`
                        )}
                        style={
                          isActive ? {} : {
                            color: 'rgb(209 213 219) !important'
                          }
                        }
                      >
                        <div className={cn(
                          "p-1.5 rounded-md transition-all duration-300",
                          isActive 
                            ? `${colorConfig.icon} bg-white/10` 
                            : "text-gray-400 bg-gray-700/30 group-hover:bg-white/10 group-hover:text-white"
                        )}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <span 
                          className="font-medium text-sm flex-1 transition-colors duration-300"
                          style={{
                            color: 'inherit !important'
                          }}
                        >
                          {tab.name}
                        </span>
                        {isActive && (
                          <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                        )}
                      </LoadingLink>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" 
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="fixed inset-y-0 right-0 z-50 w-80 bg-gray-900/95 backdrop-blur-xl border-l border-gray-800 p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-lg font-bold text-white"
                style={{
                  color: 'white !important'
                }}
              >
                القائمة
              </h2>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-gray-800/50 border border-gray-700 hover:bg-gray-700/60 hover:border-gray-600 transition-all duration-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Quick Actions Mobile */}
              <div>
                <h3 
                  className="text-sm font-bold text-white mb-3"
                  style={{
                    color: 'white !important'
                  }}
                >
                  إجراءات سريعة
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <LoadingLink
                        key={action.name}
                        href={action.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="group flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-800/30 border border-gray-700/30 hover:bg-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg bg-gradient-to-r flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                          action.color,
                          "group-hover:" + action.hoverColor
                        )}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span 
                          className="text-xs font-medium text-gray-200 group-hover:text-white transition-colors duration-300 text-center"
                          style={{
                            color: 'rgb(229 231 235) !important'
                          }}
                        >
                          {action.name}
                        </span>
                      </LoadingLink>
                    );
                  })}
                </div>
              </div>

              {/* Main Navigation Mobile */}
              <div>
                <h3 
                  className="text-sm font-bold text-white mb-3"
                  style={{
                    color: 'white !important'
                  }}
                >
                  القائمة الرئيسية
                </h3>
                <div className="space-y-1">
                  {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    const colorConfig = tabColors[tab.href] || tabColors["/dashboard/profile"];
                    const Icon = tab.icon;
                    
                    return (
                      <LoadingLink
                        key={tab.href}
                        href={tab.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "group flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border",
                          isActive
                            ? `${colorConfig.bg} ${colorConfig.border} ${colorConfig.text} shadow-lg`
                            : `bg-gray-800/30 border-gray-700/30 text-gray-300 hover:${colorConfig.hoverBg} hover:${colorConfig.hoverBorder} hover:${colorConfig.hoverText}`
                        )}
                        style={
                          isActive ? {} : {
                            color: 'rgb(209 213 219) !important'
                          }
                        }
                      >
                        <Icon className="w-4 h-4 transition-colors duration-300" />
                        <span 
                          className="font-medium text-sm flex-1 transition-colors duration-300"
                          style={{
                            color: 'inherit !important'
                          }}
                        >
                          {tab.name}
                        </span>
                        {isActive && (
                          <div className="w-2 h-2 bg-current rounded-full"></div>
                        )}
                      </LoadingLink>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}