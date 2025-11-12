// Admin layout provides a consistent structure for all admin pages
// including navigation to various admin functions

"use client";

import { useState, useEffect } from "react";
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
  Menu,
  X,
  ChevronRight,
  User,
  Building,
  Bell,
  Search,
  History,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const router = useLoadingRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const navigation = [
    { name: "الرئيسية", href: "/", icon: Home },
    { name: "لوحة القيادة", href: "/admin", icon: LayoutDashboard },
    { name: "إدارة المستخدمين", href: "/admin/users", icon: Users },
    // ✅ الجديد هنا: صفحة مُلّاك المعارض
    { name: "ملاك المعارض", href: "/admin/venue-owners", icon: Building },
    { name: "إدارة المشرفين", href: "/admin/moderators", icon: Shield },
    { name: "إدارة العمولات", href: "/admin/commission-tiers", icon: HandCoins },
    { name: "خطط الاشتراك", href: "/admin/subscription-plans", icon: CreditCard },
    { name: "إدارة الجلسات", href: "/admin/sessions", icon: Calendar },
    { name: "إدارة البث", href: "/admin/live-stream", icon: Youtube },
    { name: "قنوات YouTube", href: "/admin/youtube-channels", icon: Radio },
    { name: "المزادات", href: "/admin/auctions", icon: Car },
    { name: "سجلات المزايدات", href: "/admin/bids-logs", icon: FileText },
    { name: "سجلات النشاط", href: "/admin/activity-logs", icon: History },
    { name: "السيارات", href: "/admin/cars", icon: Car },
    { name: "التقارير", href: "/admin/reports", icon: BarChart },
    { name: "الإعدادات", href: "/admin/settings", icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === "/admin" && pathname === "/admin") return true;
    if (path !== "/admin" && pathname?.startsWith(`${path}/`)) return true;
    return pathname === path;
  };

  return (
    <div className="min-h-screen flex transition-colors duration-300 bg-background" dir="rtl">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 right-0 z-50
          bg-card
          border-l border-border
          shadow-2xl transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-20" : "w-80"}
          ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center space-x-3 space-x-reverse ${
                isCollapsed ? "justify-center w-full" : ""
              }`}
            >
              <div className="bg-primary p-2 rounded-xl">
                <Building className="w-6 h-6 text-white" />
              </div>
              {!isCollapsed && (
                <div>
                  <h2 className="font-bold text-xl text-foreground">لوحة الإدارة</h2>
                  <p className="text-sm text-foreground/70">نظام إدارة المزادات</p>
                </div>
              )}
            </div>

            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-foreground/70 hover:text-foreground p-1 rounded-lg hover:bg-border"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* User Profile Section */}
        {!isCollapsed && user && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3 space-x-reverse p-3 bg-background rounded-xl">
              <div className="bg-primary p-2 rounded-full">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-foreground/70 truncate">{user.email}</p>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.name}>
                  <LoadingLink
                    href={item.href}
                    className={`
                      group flex items-center p-3 rounded-xl transition-all duration-200
                      ${
                        active
                          ? "bg-primary/10 text-primary border-r-2 border-primary shadow-lg"
                          : "text-foreground/70 hover:text-foreground hover:bg-border"
                      }
                      ${isCollapsed ? "justify-center" : ""}
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="relative">
                      <Icon
                        className={`w-5 h-5 ${isCollapsed ? "" : "ml-3"} ${
                          active ? "text-primary" : "text-foreground/70 group-hover:text-foreground"
                        }`}
                      />
                    </div>

                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-sm font-medium">{item.name}</span>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            active ? "text-primary" : "text-foreground/50"
                          }`}
                        />
                      </>
                    )}
                  </LoadingLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Dark Mode Toggle */}
          {!isCollapsed && <ThemeToggle />}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`
              flex items-center p-3 rounded-xl text-red-500 hover:bg-red-500/10 
              hover:text-red-500/80 transition-all duration-200 w-full
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <LogOut className={`w-5 h-5 ${isCollapsed ? "" : "ml-3"}`} />
            {!isCollapsed && <span className="flex-1 text-sm font-medium">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header
          className={`
            sticky top-0 z-30 transition-all duration-300
            ${scrolled ? "bg-card/80 backdrop-blur-lg border-b border-border shadow-xl" : "bg-transparent"}
          `}
        >
          <div className="flex items-center justify-between p-4 lg:px-6">
            {/* Left Section - Menu Toggle */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-foreground/70 hover:text-foreground p-2 rounded-lg hover:bg-border"
              >
                <Menu size={24} />
              </button>

              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex text-foreground/70 hover:text-foreground p-2 rounded-lg hover:bg-border"
              >
                <Menu size={24} />
              </button>

              {/* Search Bar */}
              <div className="relative hidden md:block">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/70 w-4 h-4" />
                <input
                  type="text"
                  placeholder="ابحث في لوحة التحكم..."
                  className="w-80 bg-background border border-border rounded-xl py-2 pr-10 pl-4 text-sm text-foreground placeholder-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Section - Notifications & User */}
            <div className="flex items-center space-x-4 space-x-reverse">
              {/* Dark Mode Toggle - Mobile */}
              <div className="md:hidden">
                <ThemeToggle />
              </div>

              {/* Notifications */}
              <button className="relative text-foreground/70 hover:text-foreground p-2 rounded-lg hover:bg-border transition-colors">
                <Bell size={20} />
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-foreground/70">مدير النظام</p>
                </div>
                <div className="bg-primary p-1 rounded-full">
                  <div className="bg-card p-1 rounded-full">
                    <User className="w-6 h-6 text-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-x-auto">{children}</div>
      </main>
    </div>
  );
}
