// Admin layout provides a consistent structure for all admin pages
// No top header / no mobile overlay. Fixed-width sidebar + fluid content using CSS Grid.

"use client";

import { useEffect } from "react";
import LoadingLink from "@/components/LoadingLink";
import { usePathname } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import {
  LayoutDashboard,
  Users,
  Youtube,
  Car,
  FileText,
  Settings,
  Radio,
  BarChart,
  LogOut,
  Home,
  HandCoins,
  CreditCard,
  Shield,
  Calendar,
  ChevronRight,
  Building,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { isAdmin, logout } = useAuth();
  const router = useLoadingRouter();

  useEffect(() => {
    if (!isAdmin) {
      router.push("/auth/login?returnUrl=/admin");
    }
  }, [isAdmin, router]);

  const navigation = [
    { name: "الرئيسية", href: "/", icon: Home },
    { name: "لوحة القيادة", href: "/admin", icon: LayoutDashboard },
    { name: "إدارة المستخدمين", href: "/admin/users", icon: Users },
    { name: "ملاك المعارض", href: "/admin/venue-owners", icon: Building },
    { name: "إدارة المشرفين", href: "/admin/moderators", icon: Shield },
    { name: "إدارة العمولات", href: "/admin/commission-tiers", icon: HandCoins },
    { name: "خطط الاشتراك", href: "/admin/subscription-plans", icon: CreditCard },
    { name: "إدارة الجلسات", href: "/admin/sessions", icon: Calendar },
    { name: "إدارة البث", href: "/admin/live-stream", icon: Youtube },
    { name: "قنوات YouTube", href: "/admin/youtube-channels", icon: Radio },
    { name: "المزادات", href: "/admin/auctions", icon: Car },
    { name: "سجلات المزايدات", href: "/admin/bids-logs", icon: FileText },
    { name: "سجلات النشاط", href: "/admin/activity-logs", icon: FileText },
    { name: "السيارات", href: "/admin/cars", icon: Car },
    { name: "التقارير", href: "/admin/reports", icon: BarChart },
    { name: "الإعدادات", href: "/admin/settings", icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === "/admin" && pathname === "/admin") return true;
    if (path !== "/admin" && pathname?.startsWith(`${path}/`)) return true;
    return pathname === path;
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir="rtl">
      {/* حاوية واسعة ومريحة: لا تضغط المحتوى أفقيًا */}
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Grid: سايدبار ثابت 20rem + محتوى مرن */}
        <div className="grid lg:grid-cols-[20rem,1fr] gap-6 pt-4 lg:pt-6 items-start">
          {/* Sidebar (Desktop only) */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              {/* Sidebar Header */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary p-2 rounded-xl">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">لوحة الإدارة</h2>
                    <p className="text-xs text-foreground/70">نظام إدارة المزادات</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="bg-card border border-border rounded-2xl p-4">
                <h3 className="text-sm font-bold mb-3">القائمة الرئيسية</h3>
                <ul className="space-y-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <li key={item.name}>
                        <LoadingLink
                          href={item.href}
                          className={`group flex items-center p-3 rounded-xl transition-all border
                            ${
                              active
                                ? "bg-primary/10 text-primary border-primary/30 shadow"
                                : "bg-background/30 text-foreground/70 border-border hover:bg-border hover:text-foreground"
                            }`}
                        >
                          <Icon
                            className={`w-5 h-5 ms-2 ${
                              active ? "text-primary" : "text-foreground/70 group-hover:text-foreground"
                            }`}
                          />
                          <span className="flex-1 text-sm font-medium">{item.name}</span>
                          <ChevronRight
                            className={`w-4 h-4 ${active ? "text-primary" : "text-foreground/50"}`}
                          />
                        </LoadingLink>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Sidebar Footer */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full p-3 rounded-xl text-red-500 border border-red-500/30 hover:bg-red-500/10 transition"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">تسجيل الخروج</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
