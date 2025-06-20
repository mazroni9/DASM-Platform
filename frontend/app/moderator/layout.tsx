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

    // Moderator route protection
    useEffect(() => {
        if (!isLoading) {
            // If not logged in, redirect to login
            if (!isLoggedIn) {
                router.push(
                    `/auth/login?returnUrl=${encodeURIComponent(
                        pathname || "/moderator"
                    )}`
                );
                return;
            }

            // If logged in but not moderator, redirect to dashboard
            if (isLoggedIn && !isModerator) {
                router.push("/dashboard");
                return;
            }
        }
    }, [isLoading, isLoggedIn, isModerator, router, pathname]);

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
                        className="text-gray-500 hover:text-gray-700"
                    >
                        {isCollapsed ? "→" : "←"}
                    </button>
                </div>
                <nav className="mt-6 px-4">
                    <ul className="space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center p-3 rounded-lg transition-colors ${
                                            isActive(item.href)
                                                ? "bg-green-50 text-green-600"
                                                : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                    >
                                        <Icon
                                            className={`h-5 w-5 ${
                                                isCollapsed ? "mx-auto" : "ml-3"
                                            }`}
                                        />
                                        <span
                                            className={`${
                                                isCollapsed ? "hidden" : "block"
                                            }`}
                                        >
                                            {item.name}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="border-t my-6"></div>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center p-3 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors ${
                            isCollapsed ? "justify-center" : ""
                        }`}
                    >
                        <LogOut
                            className={`h-5 w-5 ${
                                isCollapsed ? "mx-auto" : "ml-3"
                            }`}
                        />
                        <span className={`${isCollapsed ? "hidden" : "block"}`}>
                            تسجيل الخروج
                        </span>
                    </button>
                </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-x-auto">
                <div className="container mx-auto py-6 px-4">{children}</div>
            </main>
        </div>
    );
}
