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
  BarChart3,
  ScrollText,
  Mail, // âœ… NEW
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
    { name: "ط§ظ„ط±ط¦ظٹط³ظٹط©", href: "/", icon: Home },
    { name: "ظ„ظˆط­ط© ط§ظ„ظ‚ظٹط§ط¯ط©", href: "/admin", icon: LayoutDashboard },

    {
      name: "ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ",
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
      name: "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†",
      href: "/admin/users",
      icon: Users,
      permission: "users.view",
    },
    {
      name: "ظ…ظ„ط§ظƒ ط§ظ„ظ…ط¹ط§ط±ط¶",
      href: "/admin/venue-owners",
      icon: Building,
      permission: "exhibitors.view",
    },
    {
      name: "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظˆط¸ظپظٹظ†",
      href: "/admin/staff",
      icon: Shield,
      permission: "staff.view",
    },
    {
      name: "ط¥ط¯ط§ط±ط© ط§ظ„ط£ط¯ظˆط§ط±",
      href: "/admin/roles",
      icon: UserCog,
      permission: "roles.view",
    },
    {
      name: "ط´ط¬ط±ط© ط§ظ„طµظ„ط§ط­ظٹط§طھ",
      href: "/admin/permissions",
      icon: Shield,
      permission: "permissions.view",
    },
    {
      name: "ط¥ط¯ط§ط±ط© ط§ظ„ظ‚ط±ظˆط¨ط§طھ",
      href: "/admin/groups",
      icon: Users,
      permission: "groups.view",
    },
    {
      name: "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ†ط¸ظ…ط§طھ",
      href: "/admin/organizations",
      icon: Building,
      permission: "organizations.view",
    },

    {
      name: "ط§ظ„ط¹ظ…ظˆظ„ط§طھ ظˆط§ظ„ط®ط·ط·",
      href: "#",
      type: "header",
      icon: HandCoins,
      permissions: ["commissions.view", "subscription_plans.view"],
    },
    {
      name: "ط¥ط¯ط§ط±ط© ط§ظ„ط¹ظ…ظˆظ„ط§طھ",
      href: "/admin/commission-tiers",
      icon: HandCoins,
      permission: "commissions.view",
    },
    {
      name: "ط®ط·ط· ط§ظ„ط§ط´طھط±ط§ظƒ",
      href: "/admin/subscription-plans",
      icon: CreditCard,
      permission: "subscription_plans.view",
    },
    {
      name: "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط¨ظٹط¹ط§طھ",
      href: "/admin/sales",
      icon: DollarSign,
      permission: "commissions.view",
    },

    {
      name: "ط§ظ„ط³ظٹط§ط±ط§طھ ظˆط§ظ„ظ…ط²ط§ط¯ط§طھ",
      href: "#",
      type: "header",
      icon: Car,
      permissions: ["cars.view", "auctions.view"],
    },
    {
      name: "ط§ظ„ط³ظٹط§ط±ط§طھ",
      href: "/admin/cars",
      icon: Car,
      permission: "cars.view",
    },
    {
      name: "ط§ظ„ظ…ط²ط§ط¯ط§طھ",
      href: "/admin/auctions",
      icon: Car,
      permission: "auctions.view",
    },

    {
      name: "ط§ظ„ط¬ظ„ط³ط§طھ ظˆط§ظ„ط¨ط«",
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
      name: "ط¥ط¯ط§ط±ط© ط§ظ„ط¬ظ„ط³ط§طھ",
      href: "/admin/sessions",
      icon: Calendar,
      permission: "sessions.view",
    },
    {
      name: "ط¥ط¯ط§ط±ط© ط§ظ„ط¨ط«",
      href: "/admin/live-stream",
      icon: Youtube,
      permission: "live_streams.view",
    },
    {
      name: "ظ‚ظ†ظˆط§طھ YouTube",
      href: "/admin/youtube-channels",
      icon: Radio,
      permission: "youtube_channels.view",
    },

    // âœ… Blog Section
    {
      name: "ط§ظ„ظ…ط¯ظˆظ†ط©",
      href: "#",
      type: "header",
      icon: FileText,
      // permissions: ["blog_posts.view", "blog_categories.view"],
    },
    {
      name: "ط§ظ„ظ…ظ‚ط§ظ„ط§طھ",
      href: "/admin/blog/posts",
      icon: FileText,
      // permission: "blog_posts.view",
    },
    {
      name: "ط§ظ„طھطµظ†ظٹظپط§طھ",
      href: "/admin/blog/categories",
      icon: Tags,
      // permission: "blog_categories.view",
    },

    // âœ… NEW: Newsletter Section
    {
      name: "ط§ظ„ظ†ط´ط±ط© ط§ظ„ط¨ط±ظٹط¯ظٹط©",
      href: "#",
      type: "header",
      icon: Mail,
      // permissions: ["newsletter_subscribers.view"],
    },
    {
      name: "ط¥ط¯ط§ط±ط© ط§ظ„ط¥ظٹظ…ظٹظ„ط§طھ",
      href: "/admin/newsletter-subscribers",
      icon: Mail,
      // permission: "newsletter_subscribers.view",
    },

    {
      name: "ط§ظ„ط³ط¬ظ„ط§طھ",
      href: "#",
      type: "header",
      icon: FileText,
      permissions: ["auction_logs.view", "activity_logs.view"],
    },
    {
      name: "ط³ط¬ظ„ط§طھ ط§ظ„ظ…ط²ط§ظٹط¯ط§طھ",
      href: "/admin/bids-logs",
      icon: FileText,
      permission: "auction_logs.view",
    },
    {
      name: "ط³ط¬ظ„ط§طھ ط§ظ„ظ†ط´ط§ط·",
      href: "/admin/activity-logs",
      icon: FileText,
      permission: "activity_logs.view",
    },
        {
      name: "ط³ط¬ظ„ ط§ظ„ظ…ط²ط§ط¯ط§طھ ط§ظ„ظپظˆط±ظٹ",
      href: "/admin/auction-activity-log",
      icon: ScrollText,
      permission: "auctions.view",
    },

    {
      name: "ط§ظ„طھظ‚ط§ط±ظٹط± ظˆط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ",
      href: "#",
      type: "header",
      icon: BarChart,
      permissions: ["activity_logs.view", "users.view"],
    },

    // âœ… Similar Price Analysis
    {
      name: "طھط­ظ„ظٹظ„ ط§ظ„ط£ط³ط¹ط§ط± ط§ظ„ظ…ط´ط§ط¨ظ‡ط©",
      href: "/similar-price-analysis",
      icon: BarChart3,
    },

    {
      name: "ط§ظ„طھظ‚ط§ط±ظٹط±",
      href: "/admin/reports",
      icon: BarChart,
      permission: "activity_logs.view",
    },
    {
      name: "ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ",
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
      {/* ط­ط§ظˆظٹط© ظˆط§ط³ط¹ط© ظˆظ…ط±ظٹط­ط©: ظ„ط§ طھط¶ط؛ط· ط§ظ„ظ…ط­طھظˆظ‰ ط£ظپظ‚ظٹظ‹ط§ */}
      <div className="w-full max-w-screen-2xl mx-auto px-1 pb-8">
        {/* Grid: ط³ط§ظٹط¯ط¨ط§ط± ط«ط§ط¨طھ 20rem + ظ…ط­طھظˆظ‰ ظ…ط±ظ† */}
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
                    <h2 className="font-bold text-lg">ظ„ظˆط­ط© ط§ظ„ط¥ط¯ط§ط±ط©</h2>
                    <p className="text-xs text-foreground/70">
                      ظ†ط¸ط§ظ… ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط²ط§ط¯ط§طھ
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="bg-card border border-border rounded-2xl p-4">
                <h3 className="text-sm font-bold mb-3">ط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ط±ط¦ظٹط³ظٹط©</h3>
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
                  <span className="text-sm font-medium">طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬</span>
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

