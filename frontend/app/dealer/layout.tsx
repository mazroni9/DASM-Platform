// app/dealer/layout.tsx
"use client";

import { useEffect } from "react";
import LoadingLink from "@/components/LoadingLink";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import {
  User,
  ShoppingCart,
  ShoppingBag,
  Truck,
  BarChart3,
  Eye,
  Car,
  Wallet,
  MessageCircle,
  Plus,
  SaudiRiyal,
  ArrowRight,
  Crown,
  Activity,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";

interface DealerLayoutProps {
  children: React.ReactNode;
}

export default function DealerLayout({ children }: DealerLayoutProps) {
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();
  const router = useLoadingRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/auth/login?returnUrl=/dealer");
    }
    // Check if user is dealer - redirect to correct dashboard using replace
    if (isLoggedIn && user && user.type !== "dealer") {
      router.replace("/dashboard");
    }
  }, [isLoggedIn, user, router]);

  const tabs = [
    {
      name: "لوحة التاجر",
      href: "/dealer/dashboard",
      icon: Crown,
      description: "لوحة التاجر المحترف",
    },
    {
      name: "سياراتي",
      href: "/dealer/mycars",
      icon: Car,
      description: "إدارة سياراتك المعروضة",
    },
    {
      name: "المزايدات",
      href: "/dealer/bids-history",
      icon: SaudiRiyal,
      description: "سجل المزايدات",
    },
    {
      name: "مشترياتي",
      href: "/dealer/my-purchases",
      icon: ShoppingCart,
      description: "تتبع مشترياتك النشطة",
    },
    {
      name: "مبيعاتي",
      href: "/dealer/my-sales",
      icon: ShoppingBag,
      description: "عرض وتتبع مبيعاتك",
    },
    {
      name: "محفظتي",
      href: "/dealer/my-wallet",
      icon: Wallet,
      description: "إدارة رصيدك المالي",
    },
    {
      name: "تحويلاتي",
      href: "/dealer/my-transfers",
      icon: ArrowRight,
      description: "سجل التحويلات المالية",
    },

    // ✅ NEW TAB
    {
      name: "تحليل الأسعار المشابهة",
      href: "/similar-price-analysis",
      icon: TrendingUp,
      description: "تحليل الأسعار المشابهة المشابهة",
    },

    {
      name: "خدمات الشحن",
      href: "/dealer/shipping",
      icon: Truck,
      description: "إدارة خدمات الشحن",
    },
    {
      name: "الملف الشخصي",
      href: "/dealer/profile",
      icon: User,
      description: "تعديل بياناتك الشخصية",
    },
  ];

  const quickActions = [
    {
      name: "إضافة سيارة",
      icon: Plus,
      href: "/add/Car",
      color: "bg-secondary hover:bg-secondary/90 text-white",
    },
    {
      name: "عرض المزادات",
      icon: Eye,
      href: "/auctions",
      color: "bg-primary hover:bg-primary/90 text-primary-foreground",
    },
    {
      name: "نشاط التاجر",
      icon: Activity,
      href: "/dealer/dashboard",
      color: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    {
      name: "الدعم",
      icon: MessageCircle,
      href: "/support",
      color: "bg-primary hover:bg-primary/90 text-primary-foreground",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto px-3 sm:px-6  pb-8">
        <div className="flex flex-col lg:flex-row gap-6 pt-4 lg:pt-6 items-start">
          {/* الشريط الجانبي */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              {/* Dealer Badge */}
              <div className="bg-gradient-to-l from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-foreground">
                    التاجر المحترف
                  </span>
                </div>
                <p className="text-xs text-foreground/50 mt-1">
                  حساب تاجر معتمد
                </p>
              </div>

              {/* إجراءات سريعة */}
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
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                            action.color,
                          )}
                        >
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

              {/* القائمة الرئيسية */}
              <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">
                  القائمة الرئيسية
                </h3>
                <div className="space-y-1">
                  {tabs.map((tab) => {
                    const isActive =
                      pathname === tab.href ||
                      (tab.href !== "/dealer/dashboard" &&
                        pathname?.startsWith(tab.href + "/"));

                    const Icon = tab.icon;

                    return (
                      <LoadingLink
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                          "group flex items-center gap-2 p-3 rounded-lg transition-all duration-300 border",
                          isActive
                            ? "bg-primary/10 border-primary/20 text-primary shadow-lg"
                            : "bg-background/30 border-border text-foreground/70 hover:bg-border hover:border-border hover:text-foreground",
                        )}
                      >
                        <div
                          className={cn(
                            "p-1.5 rounded-md transition-all duration-300",
                            isActive
                              ? "bg-white/10"
                              : "bg-border/30 group-hover:bg-background/10 group-hover:text-foreground",
                          )}
                        >
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className="font-medium text-sm flex-1 transition-colors duration-300">
                          {tab.name}
                        </span>
                        {isActive && (
                          <div className="w-1.5 h-1.5 bg-current rounded-full" />
                        )}
                      </LoadingLink>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* مساحة المحتوى */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
