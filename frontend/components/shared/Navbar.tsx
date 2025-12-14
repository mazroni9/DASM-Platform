"use client";

import { useState, useEffect } from "react";
import LoadingLink from "@/components/LoadingLink";
import { usePathname } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import Image from "next/image";
import {
  RefreshCw,
  Store,
  LogOut,
  Menu,
  X,
  Book,
  TvMinimalPlay,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { restartServers } from "@/utils/serverUtils";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/types";
import NotificationMenu from "@/components/NotificationMenu";
import { ThemeToggle } from "../ThemeToggle";

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useLoadingRouter();
  const { user, logout } = useAuth();
  const isAdmin =
    user?.type === UserRole.ADMIN || user?.type === UserRole.SUPER_ADMIN;

  const navigationItems: NavigationItem[] = [
    { href: "/auctions", label: "الأسواق الرقمية", icon: Store },
  ];

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/");

  const handleRestartServers = async () => {
    if (!confirm("هل أنت متأكد من إعادة تشغيل الخوادم؟")) return;
    try {
      setIsRestarting(true);
      const result = await restartServers();
      toast[result.success ? "success" : "error"](result.message);
    } catch (error) {
      console.error("Error restarting servers:", error);
      toast.error("حدث خطأ أثناء إعادة تشغيل الخوادم");
    } finally {
      setIsRestarting(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast.success("تم تسجيل الخروج بنجاح");
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("حدث خطأ أثناء تسجيل الخروج");
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileMenuOpen &&
        !(e.target as Element).closest(".mobile-menu-container")
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // كلاس يساعد نخلي الألوان واضحة داخل UserMenu/NotificationMenu
  const forceBright =
    "[&_*]:!text-foreground [&_svg]:!text-primary [&_sup]:!bg-primary [&_sup]:!text-white";

  return (
    <nav
      className="bg-background text-foreground py-3 shadow-lg border-b border-border relative z-50"
      role="navigation"
      aria-label="التنقل الرئيسي"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between min-h-[64px]">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <LoadingLink href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-primary/30">
                <Image
                  src="/logo.jpg"
                  alt="منصة DASMe - المزادات الرقمية المتخصصة"
                  fill
                  className="object-cover"
                />
              </div>
              {/* عنوان الموقع + كلمة DASMe بألوان الشعار واتجاه LTR */}
              <span className="font-bold text-lg tracking-tight text-foreground flex items-baseline gap-2">
                <span>المزادات الرقمية</span>
                <span
                  dir="ltr"
                  className="inline-flex items-baseline leading-none text-xl"
                >
                  <span style={{ color: "#003b70" }}>D</span>
                  <span style={{ color: "#009345" }}>A</span>
                  <span style={{ color: "#003b70" }}>S</span>
                  <span style={{ color: "#003b70" }}>M</span>
                  <span style={{ color: "#009345" }}>e</span>
                </span>
              </span>
            </LoadingLink>
          </div>

          {/* Desktop Navigation */}
          <div
            className="hidden md:flex items-center gap-6 font-medium"
            dir="rtl"
          >
            <LoadingLink
              href="/auctions"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive("/auctions")
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-border hover:text-primary"
              }`}
            >
              <TvMinimalPlay size={18} />
              <span>الأسواق الرقمية</span>
            </LoadingLink>

            <LoadingLink
              target="_blank"
              href="https://blog.dasm.com.sa/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-border hover:text-primary transition-all duration-200"
            >
              <Book size={18} />
              <span>المدونة</span>
            </LoadingLink>
          </div>

          {/* Desktop Auth & Actions */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="text-secondary hover:bg-secondary/10 hover:text-secondary transition-all duration-200"
                onClick={handleRestartServers}
                disabled={isRestarting}
                title="إعادة تشغيل الخوادم"
                aria-label="إعادة تشغيل الخوادم"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRestarting ? "animate-spin" : ""}`}
                />
              </Button>
            )}
            <ThemeToggle />
            {user ? (
              <>
                <div className={forceBright}>
                  <NotificationMenu />
                </div>
                <div className={forceBright}>
                  <UserMenu />
                </div>
              </>
            ) : (
              <LoadingLink href="/auth/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-primary text-primary hover:bg-primary/10 hover:text-primary transition-all duration-200"
                >
                  تسجيل الدخول
                </Button>
              </LoadingLink>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:hidden mobile-menu-container">
            {user && (
              <div className={forceBright}>
                <UserMenu />
              </div>
            )}
            <ThemeToggle />
            <button
              className="p-2 rounded-lg text-foreground hover:bg-border hover:text-primary transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <Menu className="h-5 w-5 rotate-90" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden mobile-menu-container overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen
              ? "max-h-96 opacity-100 mt-4 pb-4"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-2 pt-3 border-t border-border">
            {navigationItems.map((item) => (
              <LoadingLink
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-border hover:text-primary"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-base">{item.label}</span>
              </LoadingLink>
            ))}

            <LoadingLink
              target="_blank"
              href="https://blog.dasm.com.sa/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-right hover:bg-border hover:text-primary transition-all	duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Book className="h-5 w-5" />
              <span className="text-base">المدونة</span>
            </LoadingLink>

            {isAdmin && (
              <button
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-right hover:bg-secondary/10 text-secondary transition-all duration-200"
                onClick={() => {
                  handleRestartServers();
                  setMobileMenuOpen(false);
                }}
                disabled={isRestarting}
              >
                <RefreshCw
                  className={`h-5 w-5 ${isRestarting ? "animate-spin" : ""}`}
                />
                <span className="text-base">إعادة تشغيل الخوادم</span>
              </button>
            )}

            {user ? (
              <button
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-right hover:bg-border text-foreground transition-all duration-200"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
                <span className="text-base">تسجيل الخروج</span>
              </button>
            ) : (
              <LoadingLink
                href="/auth/login"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-right hover:bg-primary/10 text-primary transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-base">تسجيل الدخول</span>
              </LoadingLink>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 lg:hidden z-40"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

export default Navbar;
