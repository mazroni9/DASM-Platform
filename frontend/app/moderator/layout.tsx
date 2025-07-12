"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Video,
    Radio,
    Car,
    Users,
    LogOut,
    Loader,
    Home,
    DollarSign,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ModeratorLayoutProps {
    children: React.ReactNode;
}

export default function ModeratorLayout({ children }: ModeratorLayoutProps) {
    const pathname = usePathname();
    const { user, isModerator, logout, isLoading, isLoggedIn } = useAuth();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Simplified auth check - let ProtectedRoute handle the main logic
    useEffect(() => {
        if (!isLoading && (!isLoggedIn || !isModerator)) {
            // This will be handled by ProtectedRoute
            return;
        }
    }, [isLoading, isLoggedIn, isModerator]);

    // Show loading state while checking authentication
    if (isLoading || !isLoggedIn || !isModerator) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <Loader className="h-10 w-10 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
                </div>
            </div>
        );
    }

    const handleLogout = async () => {
        await logout();
        router.push("/auth/login");
    };

    const navigation = [
        { name: "الرئيسية", href: "/", icon: Home },
        {
            name: "لوحة المشرف",
            href: "/moderator/dashboard",
            icon: LayoutDashboard,
        },
        { name: "المزادات", href: "/moderator/auctions", icon: Car },
        { name: "السيارات", href: "/moderator/cars", icon: Car },
        { name: "المزايدات", href: "/moderator/bids", icon: DollarSign },
    ];

    const isActive = (path: string) => {
        // For exact matches like the dashboard
        if (
            path === "/moderator/dashboard" &&
            pathname === "/moderator/dashboard"
        )
            return true;

        // For sub-routes, make sure we're not matching partial paths
        if (path !== "/moderator/dashboard" && pathname?.startsWith(`${path}/`))
            return true;

        // For exact sub-route matches
        return pathname === path;
    };

    return (
        <div className="min-h-screen flex bg-gray-100" dir="rtl">
            {/* Sidebar */}
            <aside
                className={`bg-white shadow-md transition-all ${
                    isCollapsed ? "w-20" : "w-64"
                }`}
            >
                <div className="p-6 flex justify-between items-center border-b">
                    <h2
                        className={`font-bold text-xl text-gray-800 ${
                            isCollapsed ? "hidden" : "block"
                        }`}
                    >
                        لوحة المشرف
                    </h2>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-lg hover:bg-gray-100"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>
                </div>

                <nav className="mt-6 px-6">
                    <ul className="space-y-2">
                        {navigation.map((item) => (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors ${
                                        isActive(item.href)
                                            ? "bg-green-100 text-green-700 border-l-4 border-green-500"
                                            : ""
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {!isCollapsed && (
                                        <span className="mr-3">
                                            {item.name}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="absolute bottom-6 left-6 right-6">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        {!isCollapsed && (
                            <span className="mr-3">تسجيل الخروج</span>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold text-gray-800">
                            {navigation.find((item) => isActive(item.href))
                                ?.name || "لوحة المشرف"}
                        </h1>
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <span className="text-sm text-gray-600">
                                مرحباً، {user?.first_name || "المشرف"}
                            </span>
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-semibold text-sm">
                                    {user?.first_name?.charAt(0) || "م"}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}
