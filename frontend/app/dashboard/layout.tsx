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
  Wallet,
  MessageCircle,
  Plus,
  SaudiRiyal,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { UserRole } from "@/types/types";
import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, isLoggedIn, logout } = useAuth();
  const router = useLoadingRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dashboard");
    }
  }, [isLoggedIn, router]);

  const tabs = [
    { name: "لوحة التحكم", href: "/dashboard", icon: BarChart3, description: "نظرة عامة على إحصائياتك" },
    { name: "سيارتي", href: "/dashboard/mycars", icon: Car, description: "إدارة سياراتك المعروضة" },
    { name: "المزايدات", href: "/dashboard/bids-history", icon: SaudiRiyal, description: "سجل المزايدات" },
    { name: "مشترياتي", href: "/dashboard/my-purchases", icon: ShoppingCart, description: "تتبع مشترياتك النشطة" },
    { name: "مبيعاتي", href: "/dashboard/my-sales", icon: ShoppingBag, description: "عرض وتتبع مبيعاتك" },
    { name: "محفظتي", href: "/dashboard/my-wallet", icon: Wallet, description: "إدارة رصيدك المالي" },
    { name: "تحويلاتي", href: "/dashboard/my-transfers", icon: ArrowRight, description: "سجل التحويلات المالية" },
    { name: "خدمات الشحن", href: "/dashboard/shipping", icon: Truck, description: "إدارة خدمات الشحن" },
    { name: "الملف الشخصي", href: "/dashboard/profile", icon: User, description: "تعديل بياناتك الشخصية" },
  ];

  const quickActions = [
    { name: "إضافة سيارة", icon: Plus, href: "/add/Car", color: "bg-secondary hover:bg-secondary/90" },
    { name: "عرض المزادات", icon: Eye, href: "/auctions", color: "bg-primary hover:bg-primary/90" },
    { name: "التقارير", icon: BarChart3, href: "/dashboard/reports", color: "bg-primary hover:bg-primary/90" },
    { name: "الدعم", icon: MessageCircle, href: "/support", color: "bg-primary hover:bg-primary/90" },
  ];

  const userName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
    : "مستخدم";

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const roleLabel = (r?: UserRole | string) => {
    const role = user?.role;
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 py-3 px-4 sm:px-6 lg:px-8 border-b border-border backdrop-blur-xl bg-card/80">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-card/50 border border-border hover:bg-border transition-all duration-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <LoadingLink
              href="/"
              className="group flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium border border-white/10 hover:scale-105 hover:bg-primary/90"
            >
              <Home className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="text-sm">
                الرئيسية
              </span>
            </LoadingLink>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-card/50 border border-border rounded-xl px-3 py-2 backdrop-blur-sm hover:bg-border transition-all duration-300">
              <Search className="w-4 h-4 text-foreground/70" />
              <input
                type="text"
                placeholder="ابحث..."
                className="bg-transparent border-none outline-none text-sm w-32 lg:w-48 text-foreground placeholder-foreground/50"
              />
            </div>

            <button className="p-2 rounded-xl bg-card/50 border border-border hover:bg-border transition-all duration-300 relative">
              <Bell className="w-4 h-4 text-foreground/70" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-card"></span>
            </button>

            <ThemeToggle />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-bold">
                {userName.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {userName}
                </p>
                <p className="text-xs text-foreground/70 leading-tight">
                 {roleLabel(user?.role)}
                </p>
              </div>
            </div>

            <div className="flex gap-1">
              <LoadingLink href="/dashboard/profile">
              <button className="p-2 rounded-xl bg-card/50 border border-border hover:bg-border transition-all duration-300">
                <Settings className="w-4 h-4 text-foreground/70" />
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
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">
                  إجراءات سريعة
                </h3>
                <div className="space-y-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <LoadingLink
                        key={action.name}
                        href={action.href}
                        className="group flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border hover:bg-border transition-all duration-300"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 text-white",
                          action.color,
                        )}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-medium text-foreground group-hover:text-foreground/80 transition-colors duration-300">
                          {action.name}
                        </span>
                      </LoadingLink>
                    );
                  })}
                </div>
              </div>

              <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">
                  القائمة الرئيسية
                </h3>
                <div className="space-y-1">
                  {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    const Icon = tab.icon;
                    
                    return (
                      <LoadingLink
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                          "group flex items-center gap-2 p-3 rounded-lg transition-all duration-300 border",
                          isActive
                            ? "bg-primary/10 border-primary/20 text-primary shadow-lg"
                            : "bg-background/30 border-border text-foreground/70 hover:bg-border hover:border-border hover:text-foreground"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-md transition-all duration-300",
                          isActive 
                            ? "bg-white/10" 
                            : "bg-border/30 group-hover:bg-background/10 group-hover:text-foreground"
                        )}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className="font-medium text-sm flex-1 transition-colors duration-300">
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

          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>

      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" 
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="fixed inset-y-0 right-0 z-50 w-80 bg-card/95 backdrop-blur-xl border-l border-border p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">
                القائمة
              </h2>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-card/50 border border-border hover:bg-border transition-all duration-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3">
                  إجراءات سريعة
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <LoadingLink
                        key={action.name}
                        href={action.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="group flex flex-col items-center gap-1 p-3 rounded-xl bg-background/30 border border-border hover:bg-border transition-all duration-300"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 text-white",
                          action.color
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium text-foreground group-hover:text-foreground/80 transition-colors duration-300 text-center">
                          {action.name}
                        </span>
                      </LoadingLink>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground mb-3">
                  القائمة الرئيسية
                </h3>
                <div className="space-y-1">
                  {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    const Icon = tab.icon;
                    
                    return (
                      <LoadingLink
                        key={tab.href}
                        href={tab.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "group flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border",
                          isActive
                            ? "bg-primary/10 border-primary/20 text-primary shadow-lg"
                            : "bg-background/30 border-border text-foreground/70 hover:bg-border hover:border-border hover:text-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4 transition-colors duration-300" />
                        <span className="font-medium text-sm flex-1 transition-colors duration-300">
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