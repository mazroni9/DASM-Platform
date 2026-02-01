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
  UserCog,
  DollarSign,
  Tags,
  TestTube,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { isAdmin, isModerator, logout } = useAuth();
  const { can, canAny } = usePermission();
  const router = useLoadingRouter();

  useEffect(() => {
    if (!isAdmin && !isModerator) {
      router.replace("/auth/login?returnUrl=/admin");
    }
  }, [isAdmin, isModerator, router]);

  const navigation = [
    { name: "الرئيسية", href: "/", icon: Home },
    { name: "لوحة القيادة", href: "/admin", icon: LayoutDashboard },

    {
      name: "المستخدمين والصلاحيات",
      href: "#",
      type: "header",
      icon: Users,
      permissions: [
        "users.view",
        "exhibitors.view",
        "staff.view",
        "roles.view",
        "groups.view",
        "organizations.view",
      ],
    },
    {
      name: "إدارة المستخدمين",
      href: "/admin/users",
      icon: Users,
      permission: "users.view",
    },
    {
      name: "ملاك المعارض",
      href: "/admin/venue-owners",
      icon: Building,
      permission: "exhibitors.view",
    },
    {
      name: "إدارة الموظفين",
      href: "/admin/staff",
      icon: Shield,
      permission: "staff.view",
    },
    {
      name: "إدارة الأدوار",
      href: "/admin/roles",
      icon: UserCog,
      permission: "roles.view",
    },
    {
      name: "شجرة الصلاحيات",
      href: "/admin/permissions",
      icon: Shield,
      permission: "permissions.view",
    },
    {
      name: "إدارة القروبات",
      href: "/admin/groups",
      icon: Users,
      permission: "groups.view",
    },
    {
      name: "إدارة المنظمات",
      href: "/admin/organizations",
      icon: Building,
      permission: "organizations.view",
    },

    {
      name: "العمولات والخطط",
      href: "#",
      type: "header",
      icon: HandCoins,
      permissions: ["commissions.view", "subscription_plans.view"],
    },
    {
      name: "إدارة العمولات",
      href: "/admin/commission-tiers",
      icon: HandCoins,
      permission: "commissions.view",
    },
    {
      name: "خطط الاشتراك",
      href: "/admin/subscription-plans",
      icon: CreditCard,
      permission: "subscription_plans.view",
    },
    {
      name: "إدارة المبيعات",
      href: "/admin/sales",
      icon: DollarSign,
      permission: "commissions.view",
    },

    {
      name: "السيارات والمزادات",
      href: "#",
      type: "header",
      icon: Car,
      permissions: ["cars.view", "auctions.view"],
    },
    {
      name: "السيارات",
      href: "/admin/cars",
      icon: Car,
      permission: "cars.view",
    },
    {
      name: "المزادات",
      href: "/admin/auctions",
      icon: Car,
      permission: "auctions.view",
    },

    {
      name: "الجلسات والبث",
      href: "#",
      type: "header",
      icon: Calendar,
      permissions: [
        "sessions.view",
        "live_streams.view",
        "youtube_channels.view",
      ],
    },
    {
      name: "إدارة الجلسات",
      href: "/admin/sessions",
      icon: Calendar,
      permission: "sessions.view",
    },
    {
      name: "إدارة البث",
      href: "/admin/live-stream",
      icon: Youtube,
      permission: "live_streams.view",
    },
    {
      name: "قنوات YouTube",
      href: "/admin/youtube-channels",
      icon: Radio,
      permission: "youtube_channels.view",
    },

    // ✅ NEW: Blog Section
    {
      name: "المدونة",
      href: "#",
      type: "header",
      icon: FileText,
      // permissions: ["blog_posts.view", "blog_categories.view"],
    },
    {
      name: "المقالات",
      href: "/admin/blog/posts",
      icon: FileText,
      // permission: "blog_posts.view",
    },
    {
      name: "التصنيفات",
      href: "/admin/blog/categories",
      icon: Tags,
      // permission: "blog_categories.view",
    },

    {
      name: "السجلات",
      href: "#",
      type: "header",
      icon: FileText,
      permissions: ["auction_logs.view", "activity_logs.view"],
    },
    {
      name: "سجلات المزايدات",
      href: "/admin/bids-logs",
      icon: FileText,
      permission: "auction_logs.view",
    },
    {
      name: "سجلات النشاط",
      href: "/admin/activity-logs",
      icon: FileText,
      permission: "activity_logs.view",
    },
    {
      name: "اختبارات المزادات",
      href: "/admin/auction-tests",
      icon: TestTube,
      permission: "auction_tests.view",
    },

    {
      name: "التقارير والإعدادات",
      href: "#",
      type: "header",
      icon: BarChart,
      permissions: ["activity_logs.view", "users.view"],
    },

    // ✅ NEW TAB: Similar Price Analysis
    {
      name: "تحليل الأسعار المشابهة",
      href: "/similar-price-analysis",
      icon: BarChart3,
      // لو عندك Permission لاحقاً:
      // permission: "reports.view",
    },

    {
      name: "التقارير",
      href: "/admin/reports",
      icon: BarChart,
      permission: "activity_logs.view",
    },
    {
      name: "الإعدادات",
      href: "/admin/settings",
      icon: Settings,
      permission: "users.view",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/admin" && pathname === "/admin") return true;
    if (path !== "/admin" && pathname?.startsWith(`${path}/`)) return true;
    return pathname === path;
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground overflow-x-hidden"
      dir="rtl"
    >
      {/* حاوية واسعة ومريحة: لا تضغط المحتوى أفقيًا */}
      <div className="w-full max-w-screen-2xl mx-auto px-1 pb-8">
        {/* Grid: سايدبار ثابت 20rem + محتوى مرن */}
        <div className="grid lg:grid-cols-[20rem,1fr] pt-4 lg:pt-6 items-start">
          {/* Sidebar (Desktop only) */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              {/* Sidebar Header */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary text-primary-foreground p-2 rounded-xl">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">لوحة الإدارة</h2>
                    <p className="text-xs text-foreground/70">
                      نظام إدارة المزادات
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="bg-card border border-border rounded-2xl p-4">
                <h3 className="text-sm font-bold mb-3">القائمة الرئيسية</h3>
                <ul className="space-y-2">
                  {navigation.map((item) => {
                    // Check permission
                    if (item.type === "header") {
                      if (item.permissions && !canAny(item.permissions))
                        return null;
                    } else if ((item as any).permission) {
                      if (!can((item as any).permission)) return null;
                    }

                    const Icon = item.icon as any;
                    const active = isActive(item.href);

                    if (item.type && item.type === "header") {
                      return (
                        <h3
                          key={item.name}
                          className="text-sm text-primary font-bold pb-1 pt-3 flex items-center"
                        >
                          <Icon
                            style={{ width: "1em", height: "1em" }}
                            className="ms-2 me-1"
                          />
                          {item.name}
                        </h3>
                      );
                    }

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
                              active
                                ? "text-primary"
                                : "text-foreground/70 group-hover:text-foreground"
                            }`}
                          />
                          <span className="ms-1 flex-1 text-sm font-medium">
                            {item.name}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 ${
                              active ? "text-primary" : "text-foreground/50"
                            }`}
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
          <main className="min-w-0 w-full">{children}</main>
        </div>
      </div>
    </div>
  );
}
