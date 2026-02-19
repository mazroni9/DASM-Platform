"use client";

import { useState, useEffect } from "react";
import LoadingLink from "@/components/LoadingLink";
import { usePathname } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import Image from "next/image";
import { RefreshCw, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/types";
import NotificationMenu from "@/components/NotificationMenu";
import AdminNotificationsMenu from "@/components/admin/AdminNotificationsMenu";
import { ThemeToggle } from "../ThemeToggle";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useLoadingRouter();
  const { user, logout } = useAuth();
  const isAdmin =
    user?.type === UserRole.ADMIN || user?.type === UserRole.SUPER_ADMIN;

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

              <span className="font-bold text-lg tracking-tight text-foreground flex items-baseline gap-2">
                <span>المزادات الرقمية</span>

                <span
                  dir="ltr"
                  className="inline-flex items-baseline leading-none text-xl"
                >
                  {/* ✅ D / S / M: أبيض في الدارك */}
                  <span className="text-[#003b70] dark:text-white">D</span>
                  <span className="text-[#009345] dark:text-[#009345]">A</span>
                  <span className="text-[#003b70] dark:text-white">S</span>
                  <span className="text-[#003b70] dark:text-white">M</span>
                  <span className="text-[#009345] dark:text-[#009345]">e</span>
                </span>
              </span>
            </LoadingLink>
          </div>

          {/* ✅ Center Links (Desktop) */}
          <div className="hidden lg:flex items-center justify-center gap-2 flex-1 px-6">
            <LoadingLink
              href="/about"
              className="
                px-4 py-2 rounded-full
                text-sm font-bold
                text-foreground/80 hover:text-foreground
                hover:bg-border/60
                transition-colors
              "
            >
              لماذا داسم؟
            </LoadingLink>

            <LoadingLink
              href="/blog"
              className="
                px-4 py-2 rounded-full
                text-sm font-bold
                text-foreground/80 hover:text-foreground
                hover:bg-border/60
                transition-colors
              "
            >
              المدونة
            </LoadingLink>
          </div>

          {/* Desktop Auth & Actions */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
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
          <div className="space-y-2 pt-3 border-t border-border">
            {/* ✅ Links in mobile menu too */}
            <LoadingLink
              href="/about"
              className="flex items-center justify-between gap-3 w-full px-4 py-3 rounded-lg text-right hover:bg-border text-foreground transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-base font-semibold">لماذا داسم؟</span>
            </LoadingLink>

            <LoadingLink
              href="/blog"
              className="flex items-center justify-between gap-3 w-full px-4 py-3 rounded-lg text-right hover:bg-border text-foreground transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-base font-semibold">المدونة</span>
            </LoadingLink>

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


