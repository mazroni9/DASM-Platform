// app/dashboard/layout.tsx
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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const router = useLoadingRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dashboard");
    }
  }, [isLoggedIn, router]);

  const tabs = [
    {
      name: "لوحة التحكم",
      href: "/dashboard",
      icon: BarChart3,
      description: "نظرة عامة على إحصائياتك",
    },
    {
      name: "سيارتي",
      href: "/dashboard/mycars",
      icon: Car,
      description: "إدارة سياراتك المعروضة",
    },
    {
      name: "المزايدات",
      href: "/dashboard/bids-history",
      icon: SaudiRiyal,
      description: "سجل المزايدات",
    },
    {
      name: "مشترياتي",
      href: "/dashboard/my-purchases",
      icon: ShoppingCart,
      description: "تتبع مشترياتك النشطة",
    },
    {
      name: "مبيعاتي",
      href: "/dashboard/my-sales",
      icon: ShoppingBag,
      description: "عرض وتتبع مبيعاتك",
    },
    {
      name: "محفظتي",
      href: "/dashboard/my-wallet",
      icon: Wallet,
      description: "إدارة رصيدك المالي",
    },
    {
      name: "تحويلاتي",
      href: "/dashboard/my-transfers",
      icon: ArrowRight,
      description: "سجل التحويلات المالية",
    },
    {
      name: "خدمات الشحن",
      href: "/dashboard/shipping",
      icon: Truck,
      description: "إدارة خدمات الشحن",
    },
    {
      name: "الملف الشخصي",
      href: "/dashboard/profile",
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
      name: "التقارير",
      icon: BarChart3,
      href: "/dashboard/reports",
      color: "bg-primary hover:bg-primary/90 text-primary-foreground",
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
      {/* لا يوجد هيدر */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* نقلنا الـpadding العلوي هنا لضبط محاذاة السايدبار مع المحتوى */}
        <div className="flex flex-col lg:flex-row gap-6 pt-4 lg:pt-6 items-start">
          {/* الشريط الجانبي (يظهر على الشاشات الكبيرة فقط) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
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
