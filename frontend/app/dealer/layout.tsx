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
      name: "ظ„ظˆط­ط© ط§ظ„طھط§ط¬ط±",
      href: "/dealer/dashboard",
      icon: Crown,
      description: "ظ„ظˆط­ط© ط§ظ„طھط§ط¬ط± ط§ظ„ظ…ط­طھط±ظپ",
    },
    {
      name: "ط³ظٹط§ط±ط§طھظٹ",
      href: "/dealer/mycars",
      icon: Car,
      description: "ط¥ط¯ط§ط±ط© ط³ظٹط§ط±ط§طھظƒ ط§ظ„ظ…ط¹ط±ظˆط¶ط©",
    },
    {
      name: "ط§ظ„ظ…ط²ط§ظٹط¯ط§طھ",
      href: "/dealer/bids-history",
      icon: SaudiRiyal,
      description: "ط³ط¬ظ„ ط§ظ„ظ…ط²ط§ظٹط¯ط§طھ",
    },
    {
      name: "ظ…ط´طھط±ظٹط§طھظٹ",
      href: "/dealer/my-purchases",
      icon: ShoppingCart,
      description: "طھطھط¨ط¹ ظ…ط´طھط±ظٹط§طھظƒ ط§ظ„ظ†ط´ط·ط©",
    },
        {
      name: "ظ…ط­ظپط¸طھظٹ",
      href: "/dealer/my-wallet",
      icon: Wallet,
      description: "ط¥ط¯ط§ط±ط© ط±طµظٹط¯ظƒ ط§ظ„ظ…ط§ظ„ظٹ",
    },
    {
      name: "طھط­ظˆظٹظ„ط§طھظٹ",
      href: "/dealer/my-transfers",
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
      href: "/dealer/profile",
      icon: User,
      description: "طھط¹ط¯ظٹظ„ ط¨ظٹط§ظ†ط§طھظƒ ط§ظ„ط´ط®طµظٹط©",
    },
  ];

  const quickActions = [
    {
      name: "ط¥ط¶ط§ظپط© ط³ظٹط§ط±ط©",
      icon: Plus,
      href: "/add/Car",
      color: "bg-secondary hover:bg-secondary/90 text-white",
    },
    {
      name: "ط¹ط±ط¶ ط§ظ„ظ…ط²ط§ط¯ط§طھ",
      icon: Eye,
      href: "/auctions",
      color: "bg-primary hover:bg-primary/90 text-primary-foreground",
    },
    {
      name: "ظ†ط´ط§ط· ط§ظ„طھط§ط¬ط±",
      icon: Activity,
      href: "/dealer/dashboard",
      color: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    {
      name: "ط§ظ„ط¯ط¹ظ…",
      icon: MessageCircle,
      href: "/support",
      color: "bg-primary hover:bg-primary/90 text-primary-foreground",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto px-3 sm:px-6  pb-8">
        <div className="flex flex-col lg:flex-row gap-6 pt-4 lg:pt-6 items-start">
          {/* ط§ظ„ط´ط±ظٹط· ط§ظ„ط¬ط§ظ†ط¨ظٹ */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              {/* Dealer Badge */}
              <div className="bg-gradient-to-l from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-foreground">
                    ط§ظ„طھط§ط¬ط± ط§ظ„ظ…ط­طھط±ظپ
                  </span>
                </div>
                <p className="text-xs text-foreground/50 mt-1">
                  ط­ط³ط§ط¨ طھط§ط¬ط± ظ…ط¹طھظ…ط¯
                </p>
              </div>

              {/* ط¥ط¬ط±ط§ط،ط§طھ ط³ط±ظٹط¹ط© */}
              <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">
                  ط¥ط¬ط±ط§ط،ط§طھ ط³ط±ظٹط¹ط©
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

              {/* ط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ط±ط¦ظٹط³ظٹط© */}
              <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">
                  ط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ط±ط¦ظٹط³ظٹط©
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

          {/* ظ…ط³ط§ط­ط© ط§ظ„ظ…ط­طھظˆظ‰ */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

