"use client";

import { useState, useEffect } from "react";
import LoadingLink from "@/components/LoadingLink";
import { usePathname } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import Image from "next/image";
import {
  RefreshCw,
  Store,
  Archive,
  LogOut,
  Menu,
  X,
  Book,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { restartServers } from "@/utils/serverUtils";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/types";
import NotificationMenu from "@/components/NotificationMenu";

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
  const isAdmin = user?.role === UserRole.ADMIN;

  const navigationItems: NavigationItem[] = [
    { href: "/auctions", label: "الأسواق", icon: Store },
    { href: "/auction-archive", label: "أرشيف المزادات", icon: Archive },
  ];

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

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
      if (mobileMenuOpen && !(e.target as Element).closest(".mobile-menu-container")) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // 🛠️ كلاس مساعد لفرض ألوان واضحة على كل العناصر داخل UserMenu/NotificationMenu
  const forceBright =
    "[&_*]:!text-white [&_svg]:!text-cyan-300 [&_sup]:!bg-cyan-500 [&_sup]:!text-slate-900";

  return (
    <nav
      className="bg-gradient-to-r from-slate-900 to-slate-800 text-slate-100 py-3 shadow-lg border-b border-slate-700/50 relative z-50"
      role="navigation"
      aria-label="التنقل الرئيسي"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between min-h-[64px]">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <LoadingLink href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-cyan-400/30">
                <Image
                  src="/logo.jpg"
                  alt="منصة DASM-e - المزادات الرقمية المتخصصة"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                المزادات الرقمية{" "}
                <span className="text-cyan-400">DASM-e</span>
              </span>
            </LoadingLink>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 font-medium" dir="rtl">
            <LoadingLink
              href="/auctions"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive("/auctions")
                  ? "bg-cyan-900/30 text-cyan-300"
                  : "hover:bg-slate-800 hover:text-cyan-300"
              }`}
            >
              <Store size={18} />
              <span>الأسواق</span>
            </LoadingLink>

            <LoadingLink
              target="_blank"
              href="https://blog.dasm.com.sa/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-cyan-300 transition-all duration-200"
            >
              <Book size={18} />
              <span>المدونة</span>
            </LoadingLink>

            <LoadingLink
              href="/auction-archive"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive("/auction-archive")
                  ? "bg-cyan-900/30 text-cyan-300"
                  : "hover:bg-slate-800 hover:text-cyan-300"
              }`}
            >
              <Archive size={18} />
              <span>الأرشيف</span>
            </LoadingLink>
          </div>

          {/* Desktop Auth & Actions */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-300 transition-all duration-200"
                onClick={handleRestartServers}
                disabled={isRestarting}
                title="إعادة تشغيل الخوادم"
                aria-label="إعادة تشغيل الخوادم"
              >
                <RefreshCw className={`h-4 w-4 ${isRestarting ? "animate-spin" : ""}`} />
              </Button>
            )}

            {user ? (
              <>
                {/* ✅ فرض ألوان واضحة على الرقم والآيكون داخل قائمة التنبيهات */}
                <div className={forceBright}>
                  <NotificationMenu />
                </div>

                {/* ✅ فرض ألوان واضحة على اسم المستخدم والآيكون داخل قائمة المستخدم */}
                <div className={forceBright}>
                  <UserMenu />
                </div>
              </>
            ) : (
              <LoadingLink href="/auth/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-slate-900 transition-all duration-200"
                >
                  تسجيل الدخول
                </Button>
              </LoadingLink>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:hidden mobile-menu-container">
            {/* ✅ نفس الإصلاح على الموبايل */}
            {user && (
              <div className={forceBright}>
                <UserMenu />
              </div>
            )}
            <button
              className="p-2 rounded-lg text-slate-200 hover:bg-slate-700 hover:text-cyan-300 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden mobile-menu-container overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? "max-h-96 opacity-100 mt-4 pb-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-2 pt-3 border-t border-slate-700">
            {navigationItems.map((item) => (
              <LoadingLink
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-cyan-900/40 text-cyan-200 font-semibold"
                    : "hover:bg-slate-800 hover:text-cyan-300"
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
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-right hover:bg-slate-800 hover:text-cyan-300 transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Book className="h-5 w-5" />
              <span className="text-base">المدونة</span>
            </LoadingLink>

            {isAdmin && (
              <button
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-right hover:bg-emerald-900/30 text-emerald-400 transition-all duration-200"
                onClick={() => {
                  handleRestartServers();
                  setMobileMenuOpen(false);
                }}
                disabled={isRestarting}
              >
                <RefreshCw className={`h-5 w-5 ${isRestarting ? "animate-spin" : ""}`} />
                <span className="text-base">إعادة تشغيل الخوادم</span>
              </button>
            )}

            {user ? (
              <button
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-right hover:bg-rose-900/30 text-rose-400 transition-all duration-200"
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
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-right hover:bg-cyan-900/30 text-cyan-300 transition-all duration-200"
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
