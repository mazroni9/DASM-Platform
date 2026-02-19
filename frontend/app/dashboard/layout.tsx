// app/dashboard/layout.tsx
"use client";

import { useEffect, useMemo } from "react";
import LoadingLink from "@/components/LoadingLink";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import {
  User,
  ShoppingCart,
  ShoppingBag,
  BarChart3,
  Eye,
  Car,
  Wallet,
  MessageCircle,
  Plus,
  SaudiRiyal,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/** Get minutes since midnight in Saudi Arabia (Asia/Riyadh) */
function getRiyadhMinutesNow(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Riyadh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hh * 60 + mm;
}

/** Decide which auction page based on KSA time */
function getAuctionHrefByKsaTime(): string {
  const m = getRiyadhMinutesNow();

  const LIVE_START = 16 * 60; // 16:00
  const LIVE_END = 19 * 60; // 19:00
  const INSTANT_END = 22 * 60; // 22:00

  if (m >= LIVE_START && m < LIVE_END) {
    return "/auctions/auctions-1main/live-market";
  }
  if (m >= LIVE_END && m < INSTANT_END) {
    return "/auctions/auctions-1main/instant";
  }
  return "/auctions/auctions-1main/silent";
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

  const tabs = useMemo(
    () => [
      {
        name: "ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…",
        href: "/dashboard",
        icon: BarChart3,
        description: "ظ†ط¸ط±ط© ط¹ط§ظ…ط© ط¹ظ„ظ‰ ط¥ط­طµط§ط¦ظٹط§طھظƒ",
      },
      {
        name: "ط³ظٹط§ط±طھظٹ",
        href: "/dashboard/mycars",
        icon: Car,
        description: "ط¥ط¯ط§ط±ط© ط³ظٹط§ط±ط§طھظƒ ط§ظ„ظ…ط¹ط±ظˆط¶ط©",
      },
      {
        name: "ط§ظ„ظ…ط²ط§ظٹط¯ط§طھ",
        href: "/dashboard/bids-history",
        icon: SaudiRiyal,
        description: "ط³ط¬ظ„ ط§ظ„ظ…ط²ط§ظٹط¯ط§طھ",
      },
      {
        name: "ظ…ط´طھط±ظٹط§طھظٹ",
        href: "/dashboard/my-purchases",
        icon: ShoppingCart,
        description: "طھطھط¨ط¹ ظ…ط´طھط±ظٹط§طھظƒ ط§ظ„ظ†ط´ط·ط©",
      },
            {
        name: "ظ…ط­ظپط¸طھظٹ",
        href: "/dashboard/my-wallet",
        icon: Wallet,
        description: "ط¥ط¯ط§ط±ط© ط±طµظٹط¯ظƒ ط§ظ„ظ…ط§ظ„ظٹ",
      },
      {
        name: "طھط­ظˆظٹظ„ط§طھظٹ",
        href: "/dashboard/my-transfers",
        icon: ArrowRight,
        description: "ط³ط¬ظ„ ط§ظ„طھط­ظˆظٹظ„ط§طھ ط§ظ„ظ…ط§ظ„ظٹط©",
      },

      // âœ… NEW TAB
      {
        name: "طھط­ظ„ظٹظ„ ط§ظ„ط£ط³ط¹ط§ط± ط§ظ„ظ…ط´ط§ط¨ظ‡ط©",
        href: "/similar-price-analysis",
        icon: TrendingUp,
        description: "طھط­ظ„ظٹظ„ ط§ظ„ط£ط³ط¹ط§ط± ط§ظ„ظ…ط´ط§ط¨ظ‡ط© ط§ظ„ظ…ط´ط§ط¨ظ‡ط©",
      },

      {
        name: "ط§ظ„ظ…ظ„ظپ ط§ظ„ط´ط®طµظٹ",
        href: "/dashboard/profile",
        icon: User,
        description: "طھط¹ط¯ظٹظ„ ط¨ظٹط§ظ†ط§طھظƒ ط§ظ„ط´ط®طµظٹط©",
      },
    ],
    []
  );

  const quickActions = useMemo(
    () => [
      {
        name: "ط¥ط¶ط§ظپط© ط³ظٹط§ط±ط©",
        icon: Plus,
        href: "/add/Car",
        color: "bg-secondary hover:bg-secondary/90 text-white",
      },
      {
        name: "ط¹ط±ط¶ ط§ظ„ظ…ط²ط§ط¯ط§طھ",
        icon: Eye,
        // âœ… no fixed href here â€” we route on click based on KSA time
        onClick: () => {
          const href = getAuctionHrefByKsaTime();
          router.push(href);
        },
        color: "bg-primary hover:bg-primary/90 text-primary-foreground",
      },
      {
        name: "ط§ظ„طھظ‚ط§ط±ظٹط±",
        icon: BarChart3,
        href: "/dashboard/reports",
        color: "bg-primary hover:bg-primary/90 text-primary-foreground",
      },
      {
        name: "ط§ظ„ط¯ط¹ظ…",
        icon: MessageCircle,
        href: "/support",
        color: "bg-primary hover:bg-primary/90 text-primary-foreground",
      },
    ],
    [router]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ظ„ط§ ظٹظˆط¬ط¯ ظ‡ظٹط¯ط± */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* ظ†ظ‚ظ„ظ†ط§ ط§ظ„ظ€padding ط§ظ„ط¹ظ„ظˆظٹ ظ‡ظ†ط§ ظ„ط¶ط¨ط· ظ…ط­ط§ط°ط§ط© ط§ظ„ط³ط§ظٹط¯ط¨ط§ط± ظ…ط¹ ط§ظ„ظ…ط­طھظˆظ‰ */}
        <div className="flex flex-col lg:flex-row gap-6 pt-4 lg:pt-6 items-start">
          {/* ط§ظ„ط´ط±ظٹط· ط§ظ„ط¬ط§ظ†ط¨ظٹ (ظٹط¸ظ‡ط± ط¹ظ„ظ‰ ط§ظ„ط´ط§ط´ط§طھ ط§ظ„ظƒط¨ظٹط±ط© ظپظ‚ط·) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              {/* ط¥ط¬ط±ط§ط،ط§طھ ط³ط±ظٹط¹ط© */}
              <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">
                  ط¥ط¬ط±ط§ط،ط§طھ ط³ط±ظٹط¹ط©
                </h3>

                <div className="space-y-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;

                    // âœ… Special case: auctions button uses onClick (dynamic route)
                    if ("onClick" in action && typeof action.onClick === "function") {
                      return (
                        <button
                          key={action.name}
                          type="button"
                          onClick={action.onClick}
                          className="w-full text-right group flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border hover:bg-border transition-all duration-300"
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                              action.color
                            )}
                          >
                            <Icon className="w-3 h-3" />
                          </div>
                          <span className="text-xs font-medium text-foreground group-hover:text-foreground/80 transition-colors duration-300">
                            {action.name}
                          </span>
                        </button>
                      );
                    }

                    // âœ… Normal links
                    return (
                      <LoadingLink
                        key={action.name}
                        href={action.href as string}
                        className="group flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border hover:bg-border transition-all duration-300"
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                            action.color
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

              {/* ط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ط±ط¦ظٹط³ظٹط© */}
              <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">
                  ط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ط±ط¦ظٹط³ظٹط©
                </h3>
                <div className="space-y-1">
                  {tabs.map((tab) => {
                    const isActive =
                      pathname === tab.href ||
                      (tab.href !== "/dashboard" &&
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
                            : "bg-background/30 border-border text-foreground/70 hover:bg-border hover:border-border hover:text-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "p-1.5 rounded-md transition-all duration-300",
                            isActive
                              ? "bg-white/10"
                              : "bg-border/30 group-hover:bg-background/10 group-hover:text-foreground"
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

          {/* ظ…ط³ط§ط­ط© ط§ظ„ظ…ط­طھظˆظ‰ */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

