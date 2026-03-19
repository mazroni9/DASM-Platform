"use client";

import { useState, useEffect } from "react";
import LoadingLink from "@/components/LoadingLink";
import { usePathname } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import Image from "next/image";
import { RefreshCw, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { restartServers } from "@/utils/serverUtils";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/types";
import NotificationMenu from "@/components/NotificationMenu";
import AdminNotificationsMenu from "@/components/admin/AdminNotificationsMenu";
import { ThemeToggle } from "../ThemeToggle";
import ConnectionQualityIndicator from "../ConnectionQualityIndicator";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useLoadingRouter();
  const { user, logout } = useAuth();
  const isAdmin =
    user?.type === UserRole.ADMIN || user?.type === UserRole.SUPER_ADMIN;

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

  const forceBright =
    "[&_*]:!text-foreground [&_svg]:!text-primary [&_sup]:!bg-primary [&_sup]:!text-white";

  return (
    <nav
      className="py-3 shadow-lg border-b border-white/10 dark:border-border relative z-50 bg-[var(--navbar-bg)] dark:bg-background"
      role="navigation"
      aria-label="التنقل الرئيسي"
    >
      <div className={`container mx-auto px-4 ${mobileMenuOpen ? "relative z-50" : ""}`}>
        <div className="flex items-center justify-between min-h-[64px]">
          {/* العلامة التجارية — Light: نص يندمج مع الخلفية، الشعار أقصى اليمين */}
          <div className="flex items-center flex-shrink-0 gap-3">
            <LoadingLink href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-white/30 dark:border-primary/30 flex-shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="منصة DASMe - الأسواق الرقمية المتخصصة"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col items-center text-center">
                <span
                  dir="ltr"
                  className="font-bold text-lg leading-tight flex items-baseline justify-center gap-0.5 text-white dark:text-foreground"
                >
                  <span>DASM</span>
                  <span className="text-[#009345] dark:text-[#009345]">e</span>
                </span>
                <span className="text-sm text-white/80 dark:text-foreground/80">
                  الأسواق الرقمية المتخصصة والتجارة الإلكترونية
                </span>
              </div>
            </LoadingLink>
          </div>

          {/* ✅ Center Links (Desktop) */}
          <div className="hidden lg:flex items-center justify-center gap-2 flex-1 px-6">
            <LoadingLink
              href="/market-council"
              className="
                px-4 py-2 rounded-full
                text-sm font-bold
                text-white/90 dark:text-foreground/80 hover:text-[#009345] dark:hover:text-foreground
                hover:bg-white/10 dark:hover:bg-border/60
                transition-colors
              "
            >
              مجلس السوق
            </LoadingLink>
            <LoadingLink
              href="/why-dasm"
              className="
                px-4 py-2 rounded-full
                text-sm font-bold
                text-white/90 dark:text-foreground/80 hover:text-[#009345] dark:hover:text-foreground
                hover:bg-white/10 dark:hover:bg-border/60
                transition-colors
              "
            >
              لماذا داسم؟
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

            <ConnectionQualityIndicator />
            <ThemeToggle />

            {user ? (
              <>
                <div className={forceBright}>
                  {isAdmin ? <AdminNotificationsMenu /> : <NotificationMenu />}
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
                  className="!bg-transparent border-white text-white hover:!bg-white/10 hover:text-white dark:!bg-transparent dark:border-primary dark:text-primary dark:hover:!bg-primary/10 dark:hover:text-primary transition-all duration-200"
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

            <ConnectionQualityIndicator />
            <ThemeToggle />

            <button
              className="p-2 rounded-lg text-white dark:text-foreground hover:bg-white/10 dark:hover:bg-border hover:text-primary transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              {...(mobileMenuOpen ? { "aria-expanded": "true" as const } : { "aria-expanded": "false" as const })}
            >
              <Menu
                className={`h-5 w-5 transition-transform ${
                  mobileMenuOpen ? "rotate-90" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden mobile-menu-container overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen
              ? "max-h-[560px] opacity-100 mt-4 pb-4"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-2 pt-3 border-t border-white/10 dark:border-border">
            {/* ✅ Links in mobile menu too */}
            <LoadingLink
              href="/market-council"
              className="flex items-center justify-between gap-3 w-full px-4 py-3 rounded-lg text-right hover:bg-white/10 dark:hover:bg-border text-white dark:text-foreground transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-base font-semibold">مجلس السوق</span>
            </LoadingLink>
            <LoadingLink
              href="/why-dasm"
              className="flex items-center justify-between gap-3 w-full px-4 py-3 rounded-lg text-right hover:bg-white/10 dark:hover:bg-border text-white dark:text-foreground transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-base font-semibold">لماذا داسم؟</span>
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
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-right hover:bg-white/10 dark:hover:bg-border text-white dark:text-foreground transition-all duration-200"
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
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-right hover:bg-white/10 dark:hover:bg-primary/10 text-white dark:text-primary transition-all duration-200"
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

