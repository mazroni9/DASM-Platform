// Admin layout provides a consistent structure for all admin pages
// including navigation to various admin functions

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const { user, isAdmin, logout } = useAuth();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.push("/auth/login");
    };

    const navigation = [
        { name: "الرئيسية", href: "/", icon: Home },
        { name: "لوحة القيادة", href: "/admin", icon: LayoutDashboard },
        { name: "إدارة المستخدمين", href: "/admin/users", icon: Users },
        { name: "إدارة البث", href: "/admin/live-stream", icon: Youtube },
        { name: "قنوات YouTube", href: "/admin/youtube-channels", icon: Radio },
        { name: "المزادات", href: "/admin/auctions", icon: Car },
        { name: "السيارات", href: "/admin/cars", icon: Car },
        { name: "التقارير", href: "/admin/reports", icon: BarChart },
        { name: "الإعدادات", href: "/admin/settings", icon: Settings },
    ];

    const isActive = (path: string) => {
        // For exact matches like the dashboard
        if (path === "/admin" && pathname === "/admin") return true;

        // For sub-routes, make sure we're not matching partial paths
        if (path !== "/admin" && pathname?.startsWith(`${path}/`)) return true;

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
                        لوحة الإدارة
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
                                                ? "bg-blue-50 text-blue-600"
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
