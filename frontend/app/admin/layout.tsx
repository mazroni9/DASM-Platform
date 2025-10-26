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
    Loader,
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
    Moon,
    Sun,
    History,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const { user, isAdmin, logout } = useAuth();
    const router = useLoadingRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [scrolled, setScrolled] = useState(false);

    // Handle scroll effect for header
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push("/auth/login");
    };

    const navigation = [
        { 
            name: "الرئيسية", 
            href: "/", 
            icon: Home,
            badge: null
        },
        { 
            name: "لوحة القيادة", 
            href: "/admin", 
            icon: LayoutDashboard,
            badge: null
        },
        { 
            name: "إدارة المستخدمين", 
            href: "/admin/users", 
            icon: Users,
            badge: "12"
        },
        { 
            name: "إدارة المشرفين", 
            href: "/admin/moderators", 
            icon: Shield,
            badge: null
        },
        { 
            name: "إدارة العمولات", 
            href: "/admin/commission-tiers", 
            icon: HandCoins,
            badge: "3"
        },
        { 
            name: "خطط الاشتراك", 
            href: "/admin/subscription-plans", 
            icon: CreditCard,
            badge: null
        },
        { 
            name: "إدارة الجلسات", 
            href: "/admin/sessions", 
            icon: Calendar,
            badge: "5"
        },
        { 
            name: "إدارة البث", 
            href: "/admin/live-stream", 
            icon: Youtube,
            badge: "2"
        },
        { 
            name: "قنوات YouTube", 
            href: "/admin/youtube-channels", 
            icon: Radio,
            badge: null
        },
        { 
            name: "المزادات", 
            href: "/admin/auctions", 
            icon: Car,
            badge: "7"
        },
        { 
            name: "سجلات المزايدات", 
            href: "/admin/bids-logs", 
            icon: FileText,
            badge: null
        },
        { 
            name: "سجلات النشاط", 
            href: "/admin/activity-logs", 
            icon: History,
            badge: null
        },
        { 
            name: "السيارات", 
            href: "/admin/cars", 
            icon: Car,
            badge: "15"
        },
        { 
            name: "التقارير", 
            href: "/admin/reports", 
            icon: BarChart,
            badge: null
        },
        { 
            name: "الإعدادات", 
            href: "/admin/settings", 
            icon: Settings,
            badge: null
        },
    ];

    const isActive = (path: string) => {
        if (path === "/admin" && pathname === "/admin") return true;
        if (path !== "/admin" && pathname?.startsWith(`${path}/`)) return true;
        return pathname === path;
    };

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        // Here you can add logic to persist dark mode preference
    };

    return (
        <div className={`min-h-screen flex transition-colors duration-300 ${isDarkMode ? 'dark bg-gradient-to-br from-gray-900 to-gray-950' : 'bg-gray-50'}`} dir="rtl">
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
                    bg-gradient-to-b from-gray-800 to-gray-900
                    border-l border-gray-700/50
                    shadow-2xl transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'w-20' : 'w-80'}
                    ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                    flex flex-col
                `}
            >
                {/* Sidebar Header */}
                <div className="p-6 border-b border-gray-700/50">
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center space-x-3 space-x-reverse ${isCollapsed ? 'justify-center w-full' : ''}`}>
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl">
                                <Building className="w-6 h-6 text-white" />
                            </div>
                            {!isCollapsed && (
                                <div>
                                    <h2 className="font-bold text-xl text-white">لوحة الإدارة</h2>
                                    <p className="text-sm text-gray-400">نظام إدارة المزادات</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Close button for mobile */}
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700/50"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* User Profile Section */}
                {!isCollapsed && user && (
                    <div className="p-4 border-b border-gray-700/50">
                        <div className="flex items-center space-x-3 space-x-reverse p-3 bg-gray-700/30 rounded-xl">
                            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-full">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {user.first_name} {user.last_name}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
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
                                            ${active 
                                                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border-r-2 border-cyan-400 shadow-lg' 
                                                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                            }
                                            ${isCollapsed ? 'justify-center' : ''}
                                        `}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <div className="relative">
                                            <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'ml-3'} ${active ? 'text-cyan-400' : 'text-gray-400 group-hover:text-white'}`} />
                                            {item.badge && (
                                                <span className="absolute -top-2 -left-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {!isCollapsed && (
                                            <>
                                                <span className="flex-1 text-sm font-medium">{item.name}</span>
                                                <ChevronRight className={`w-4 h-4 transition-transform ${active ? 'text-cyan-400' : 'text-gray-500'}`} />
                                            </>
                                        )}
                                    </LoadingLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-gray-700/50 space-y-3">
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className={`
                            flex items-center p-3 rounded-xl transition-all duration-200 w-full
                            ${isCollapsed ? 'justify-center' : ''}
                            ${isDarkMode 
                                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                                : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                            }
                        `}
                    >
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        {!isCollapsed && (
                            <span className="flex-1 text-sm font-medium mr-3">
                                {isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
                            </span>
                        )}
                    </button>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className={`
                            flex items-center p-3 rounded-xl text-red-400 hover:bg-red-500/10 
                            hover:text-red-300 transition-all duration-200 w-full
                            ${isCollapsed ? 'justify-center' : ''}
                        `}
                    >
                        <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'ml-3'}`} />
                        {!isCollapsed && <span className="flex-1 text-sm font-medium">تسجيل الخروج</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className={`
                    sticky top-0 z-30 transition-all duration-300
                    ${scrolled 
                        ? 'bg-gray-800/80 backdrop-blur-lg border-b border-gray-700/50 shadow-xl' 
                        : 'bg-transparent'
                    }
                `}>
                    <div className="flex items-center justify-between p-4 lg:px-6">
                        {/* Left Section - Menu Toggle */}
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="lg:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/50"
                            >
                                <Menu size={24} />
                            </button>
                            
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="hidden lg:flex text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/50"
                            >
                                <Menu size={24} />
                            </button>

                            {/* Search Bar */}
                            <div className="relative hidden md:block">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="ابحث في لوحة التحكم..."
                                    className="w-80 bg-gray-700/50 border border-gray-600 rounded-xl py-2 pr-10 pl-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Right Section - Notifications & User */}
                        <div className="flex items-center space-x-4 space-x-reverse">
                            {/* Dark Mode Toggle - Mobile */}
                            <button
                                onClick={toggleDarkMode}
                                className="md:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/50"
                            >
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            {/* Notifications */}
                            <button className="relative text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/50 transition-colors">
                                <Bell size={20} />
                                <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                    3
                                </span>
                            </button>

                            {/* User Menu */}
                            <div className="flex items-center space-x-3 space-x-reverse">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-white">
                                        {user?.first_name} {user?.last_name}
                                    </p>
                                    <p className="text-xs text-gray-400">مدير النظام</p>
                                </div>
                                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-1 rounded-full">
                                    <div className="bg-gray-800 p-1 rounded-full">
                                        <User className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-4 lg:p-6 overflow-x-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}