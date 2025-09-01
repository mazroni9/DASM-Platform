"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { RefreshCw, Store, Archive, Clock, LogOut, Menu, X,Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { restartServers } from "@/utils/serverUtils";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";
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
    const router = useRouter();
    const { user, logout } = useAuth();

    const isAdmin = user?.role === "admin";
/*
    const navigationItems: NavigationItem[] = [
        { href: "/auctions", label: "المزادات", icon: Store },
        { href: "/archive", label: "الأرشيف", icon: Archive },
        { href: "/history", label: "التاريخ", icon: Clock },
    ];
*/

    const navigationItems: NavigationItem[] = [
        { href: "/auctions", label: "الأسواق", icon: Store },
    ];
    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const handleRestartServers = async () => {
        if (!confirm("هل أنت متأكد من إعادة تشغيل الخوادم؟")) {
            return;
        }
        
        try {
            setIsRestarting(true);
            const result = await restartServers();
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
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

    const isActive = (path: string) => {
        return pathname === path || pathname?.startsWith(path + "/");
    };

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileMenuOpen && !(event.target as Element).closest('.mobile-menu-container')) {
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [mobileMenuOpen]);

    return (
        <nav 
            className="bg-sky-100 text-sky-900 py-2 shadow-md relative z-50"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="container mx-auto px-2 sm:px-4">
                <div className="flex items-center justify-between min-h-[60px]">
                    {/* Logo */}
                    <div className="flex items-center flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2 sm:gap-4">
                            <Image
                                src="/logo.jpg"
                                alt="منصة DASM-e - Digital Auctions Specialists Markets"
                                width={40}
                                height={40}
                                className="rounded-full"
                            />
                            <span className="font-bold text-base whitespace-nowrap">
                                المزادات الرقمية <span className="text-blue-700">DASM-e</span>
                            </span>
                        </Link>
                    </div>

                    {/* Main Navigation */}
                    <div className="hidden md:flex items-center gap-6 flex-row-reverse" dir="rtl">
                        <Link
                            href="/auctions"
                            className={`hover:text-sky-700 transition-colors flex items-center gap-2 ${isActive("/auctions") ? "text-blue-700 font-bold" : ""}`}
                        >
                            <Store size={18} />
                            الأسواق المتخصصة
                        </Link>
                        <Link
                            href="/broadcasts"
                            className={`hover:text-sky-700 transition-colors flex items-center gap-2 ${isActive("/broadcasts") ? "text-blue-700 font-bold" : ""}`}
                        >
                            <Clock size={18} />
                            البث المباشر
                        </Link>
                        <Link
                            href="/auction-archive"
                            className={`hover:text-sky-700 transition-colors flex items-center gap-2 ${isActive("/auction-archive") ? "text-blue-700 font-bold" : ""}`}
                        >
                            <Archive size={18} />
                            أرشيف المزادات
                        </Link>
                    </div>

                    {/* Desktop Auth Buttons */}
                    <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                        
                        {isAdmin && (
                            <Button
                                variant="outline"
                                size="icon"
                                className="text-emerald-600 border-emerald-600 hover:bg-emerald-600 hover:text-white transition-all duration-200"
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
                            <NotificationMenu />
                                <UserMenu />
     
                            </>
                        ) : (
                            <Link href="/auth/login">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-sky-800 border-sky-800 hover:bg-sky-800 hover:text-sky-100 transition-all duration-200"
                                >
                                    <span className="text-xs sm:text-sm">تسجيل الدخول</span>
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-2 sm:hidden mobile-menu-container">
                        {user && <UserMenu />}
                        <button
                            className="p-2 rounded-md hover:bg-sky-200 transition-colors duration-200"
                            onClick={toggleMobileMenu}
                            aria-label="Toggle mobile menu"
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`lg:hidden mobile-menu-container transition-all duration-300 ease-in-out ${
                    mobileMenuOpen 
                        ? "max-h-96 opacity-100" 
                        : "max-h-0 opacity-0 overflow-hidden"
                }`}>
                    <div className="py-4 space-y-2 border-t border-sky-200 mt-2">
                        {/* Mobile Navigation Links */}
                        {navigationItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${
                                    isActive(item.href)
                                        ? "bg-sky-200 text-sky-900 font-semibold"
                                        : "hover:bg-sky-50"
                                }`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="text-base">{item.label}</span>
                            </Link>
                        ))}

                        {/* Mobile Admin Controls */}
                        {isAdmin && (
                            <button
                                className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-emerald-50 text-emerald-600 transition-all duration-200 w-full text-right"
                                onClick={() => {
                                    handleRestartServers();
                                    setMobileMenuOpen(false);
                                }}
                                disabled={isRestarting}
                            >
                                <RefreshCw
                                    className={`h-5 w-5 ${
                                        isRestarting ? "animate-spin" : ""
                                    }`}
                                />
                                <span className="text-base">إعادة تشغيل الخوادم</span>
                            </button>
                        )}

                        {/* Mobile Auth */}
                        {user ? (
                            <button
                                className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-red-50 text-red-600 transition-all duration-200 w-full text-right"
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
                            <Link
                                href="/auth/login"
                                className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-sky-50 text-sky-800 transition-all duration-200"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span className="text-base">تسجيل الدخول</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-25 lg:hidden z-40"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}
        </nav>
    );
};

export default Navbar;
