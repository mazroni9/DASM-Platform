// Admin layout provides a consistent structure for all admin pages
// No top header / no mobile overlay. Fixed-width sidebar + fluid content using CSS Grid.

"use client";

import { useEffect, useState, type ElementType } from "react";
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
  ScrollText,
  Mail,
  MessageSquare,
  ClipboardList,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { ThemeToggle } from "@/components/ThemeToggle";
import api from "@/lib/axios";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const {
    isAdmin,
    isModerator,
    isProgrammer,
    isSuperAdmin,
    logout,
    hydrated,
    token,
  } = useAuth();
  const { can, canAny } = usePermission();
  const router = useLoadingRouter();

  const [shellReady, setShellReady] = useState(false);
  const [approvalQueueAccess, setApprovalQueueAccess] = useState(false);

  const isStaff = isAdmin || isModerator || isProgrammer;

  useEffect(() => {
    if (!hydrated) return;

    if (isStaff) {
      setApprovalQueueAccess(true);
      setShellReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/admin/approval-requests/capabilities");
        const ok = res.data?.data?.can_access_queue === true;
        if (!cancelled) setApprovalQueueAccess(ok);
      } catch {
        if (!cancelled) setApprovalQueueAccess(false);
      } finally {
        if (!cancelled) setShellReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, isStaff, token]);

  useEffect(() => {
    if (!shellReady) return;
    const allowed = isStaff || approvalQueueAccess;
    if (!allowed) {
      router.replace("/auth/login?returnUrl=/admin");
    }
  }, [shellReady, isStaff, approvalQueueAccess, router]);

  const navigation = [
    { name: "الرئيسية", href: "/", icon: Home },
    { name: "لوحة القيادة", href: "/admin", icon: LayoutDashboard },
    {
      name: "طابور الموافقات",
      href: "/admin/approval-requests",
      icon: ClipboardList,
      operationalQueue: true,
    },
    {
      name: "مجموعة الموافقات التشغيلية",
      href: "/admin/approval-group",
      icon: UserCheck,
      superAdminOnlyNav: true,
    },

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

    // ✅ Blog Section
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

    // ✅ Market Council (مجلس السوق)
    {
      name: "مجلس السوق",
      href: "#",
      type: "header",
      icon: FileText,
    },
    {
      name: "صلاحيات مجلس السوق",
      href: "/admin/market-council/permissions",
      icon: Shield,
    },
    {
      name: "مقالات مجلس السوق",
      href: "/admin/market-council/articles",
      icon: FileText,
    },
    {
      name: "تصنيفات مجلس السوق",
      href: "/admin/market-council/categories",
      icon: Tags,
    },
    {
      name: "تعليقات مجلس السوق",
      href: "/admin/market-council/comments",
      icon: MessageSquare,
    },

    // ✅ NEW: Newsletter Section
    {
      name: "النشرة البريدية",
      href: "#",
      type: "header",
      icon: Mail,
      // permissions: ["newsletter_subscribers.view"],
    },
    {
      name: "إدارة الإيميلات",
      href: "/admin/newsletter-subscribers",
      icon: Mail,
      // permission: "newsletter_subscribers.view",
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
      name: "سجل المزادات الفوري",
      href: "/admin/auction-activity-log",
      icon: ScrollText,
      permission: "auctions.view",
    },
    {
      name: "تحليلات اختبارات المزادات",
      href: "/admin/auction-testing-analytics",
      icon: BarChart3,
      permission: "auctions.view",
    },

    {
      name: "التقارير والإعدادات",
      href: "#",
      type: "header",
      icon: BarChart,
      permissions: ["activity_logs.view", "users.view"],
    },

    // ✅ Similar Price Analysis
    {
      name: "تحليل الأسعار المشابهة",
      href: "/similar-price-analysis",
      icon: BarChart3,
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
                    const navItem = item as {
                      operationalQueue?: boolean;
                      superAdminOnlyNav?: boolean;
                      permission?: string;
                      permissions?: string[];
                      type?: string;
                      name: string;
                      href: string;
                      icon: ElementType;
                    };
                    if (navItem.operationalQueue && !isStaff && !approvalQueueAccess) {
                      return null;
                    }
                    if (navItem.superAdminOnlyNav && !isSuperAdmin) {
                      return null;
                    }
                    // Check permission
                    if (item.type === "header") {
                      if (item.permissions && !canAny(item.permissions))
                        return null;
                    } else if (navItem.permission) {
                      if (!can(navItem.permission)) return null;
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
                            ${active
                              ? "bg-primary/10 text-primary border-primary/30 shadow"
                              : "bg-background/30 text-foreground/70 border-border hover:bg-border hover:text-foreground"
                            }`}
                        >
                          <Icon
                            className={`w-5 h-5 ms-2 ${active
                                ? "text-primary"
                                : "text-foreground/70 group-hover:text-foreground"
                              }`}
                          />
                          <span className="ms-1 flex-1 text-sm font-medium">
                            {item.name}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 ${
                              active
                                ? "text-primary"
                                : "text-foreground/50"
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
