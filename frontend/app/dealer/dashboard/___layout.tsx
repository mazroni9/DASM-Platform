// app/dealer/dashboard/layout.tsx
"use client";

import { useEffect } from "react";
import LoadingLink from "@/components/LoadingLink";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Wallet,
  Eye,
  Car,
  ListChecks,
  BarChart3,
  Settings,
  Bell,
  FileText,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";

interface DealerDashboardLayoutProps {
  children: React.ReactNode;
}

export default function DealerDashboardLayout({
  children,
}: DealerDashboardLayoutProps) {
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();
  const router = useLoadingRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dealer/dashboard");
    }
    // Check if user is a dealer
    if (user && user.type !== "dealer") {
      router.push("/dashboard");
    }
  }, [isLoggedIn, user, router]);

  const mainMenuItems = [
    {
      name: "لوحة التحكم",
      href: "/dealer/dashboard",
      icon: LayoutDashboard,
      description: "نظرة عامة شاملة",
    },
    {
      name: "المحفظة",
      href: "/dealer/dashboard/wallet",
      icon: Wallet,
      description: "إدارة الرصيد والتمويل",
    },
    {
      name: "قوائم المراقبة",
      href: "/dealer/dashboard/watchlists",
      icon: ListChecks,
      description: "متابعة السيارات المفضلة",
    },
    {
      name: "المزادات النشطة",
      href: "/dealer/dashboard/auctions",
      icon: Eye,
      description: "المزادات الجارية",
    },
    {
      name: "مشترياتي",
      href: "/dealer/dashboard/purchases",
      icon: ShoppingCart,
      description: "سجل المشتريات",
    },
    {
      name: "مبيعاتي",
      href: "/dealer/dashboard/sales",
      icon: ShoppingBag,
      description: "سجل المبيعات",
    },
    {
      name: "سياراتي",
      href: "/dealer/dashboard/cars",
      icon: Car,
      description: "إدارة معرض السيارات",
    },
    {
      name: "التقارير",
      href: "/dealer/dashboard/reports",
      icon: BarChart3,
      description: "تحليلات وإحصائيات",
    },
  ];

  const secondaryMenuItems = [
    {
      name: "الإشعارات",
      href: "/dealer/dashboard/notifications",
      icon: Bell,
    },
    {
      name: "السجل المالي",
      href: "/dealer/dashboard/transactions",
      icon: FileText,
    },
    {
      name: "الاشتراك",
      href: "/dealer/dashboard/subscription",
      icon: CreditCard,
    },
    {
      name: "الإعدادات",
      href: "/dealer/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-col lg:flex-row gap-6 pt-4 lg:pt-6 items-start">
          {/* الشريط الجانبي */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              {/* شعار تاجر السيارات المحترف */}
              <div className="bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-yellow-500/20 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <span className="text-2xl">👑</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">
                      تاجر السيارات المحترف
                    </h2>
                    <p className="text-xs text-amber-400">PRO Dealer</p>
                  </div>
                </div>
              </div>

              {/* القائمة الرئيسية */}
              <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4">
                <h3 className="text-sm font-bold text-foreground/70 mb-3">
                  القائمة الرئيسية
                </h3>
                <div className="space-y-1">
                  {mainMenuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <LoadingLink
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 border",
                          isActive
                            ? "bg-primary/10 border-primary/20 text-primary shadow-lg shadow-primary/10"
                            : "bg-background/30 border-transparent text-foreground/70 hover:bg-border hover:border-border hover:text-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "p-2 rounded-lg transition-all duration-300",
                            isActive
                              ? "bg-primary/20"
                              : "bg-border/50 group-hover:bg-background/50"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-sm block">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-foreground/50 block">
                            {item.description}
                          </span>
                        </div>
                        {isActive && (
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        )}
                      </LoadingLink>
                    );
                  })}
                </div>
              </div>

              {/* القائمة الثانوية */}
              <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4">
                <h3 className="text-sm font-bold text-foreground/70 mb-3">
                  إعدادات الحساب
                </h3>
                <div className="space-y-1">
                  {secondaryMenuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <LoadingLink
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-2 p-2.5 rounded-lg transition-all duration-300",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/60 hover:bg-border hover:text-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{item.name}</span>
                      </LoadingLink>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* مساحة المحتوى الرئيسية */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
