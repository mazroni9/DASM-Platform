"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { RefreshCw, Store, Archive, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { restartServers } from "@/utils/serverUtils";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    const isAdmin = user?.role === "admin";

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const handleRestartServers = async () => {
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

    return (
        <nav className="bg-sky-100 text-sky-900 py-2 text-lg shadow-md">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-4">
                            <Image
                                src="/logo.jpg"
                                alt="منصة داسم DASM - Digital Auctions Sectors Market"
                                width={40}
                                height={40}
                                className="rounded-full"
                            />
                            <span className="font-bold text-base whitespace-nowrap">
                                سوق المزادات الرقمية{" "}
                                <span className="text-blue-700">DASM-e</span>
                            </span>
                        </Link>
                    </div>

                    {/* Main Navigation */}
                    <div
                        className="hidden md:flex items-center gap-6 flex-row-reverse"
                        dir="rtl"
                    >
                        <Link
                            href="/auctions"
                            className={`hover:text-sky-700 transition-colors flex items-center gap-2 ${
                                isActive("/auctions")
                                    ? "text-blue-700 font-bold"
                                    : ""
                            }`}
                        >
                            <Store size={18} />
                            قطاع الأسواق المتعددة
                        </Link>
                        <Link
                            href="/broadcasts"
                            className={`hover:text-sky-700 transition-colors flex items-center gap-2 ${
                                isActive("/broadcasts")
                                    ? "text-blue-700 font-bold"
                                    : ""
                            }`}
                        >
                            <Clock size={18} />
                            البث المباشر
                        </Link>
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center space-x-4 space-x-reverse">
                        {isAdmin && (
                            <Button
                                variant="outline"
                                size="icon"
                                className="mr-2 text-emerald-600 border-emerald-600 hover:bg-emerald-600 hover:text-white"
                                onClick={handleRestartServers}
                                disabled={isRestarting}
                                title="إعادة تشغيل الخوادم"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${
                                        isRestarting ? "animate-spin" : ""
                                    }`}
                                />
                            </Button>
                        )}

                        {user ? (
                            <>
                                <UserMenu />
                            </>
                        ) : (
                            <Link href="/auth/login">
                                <Button
                                    variant="outline"
                                    className="text-sky-800 border-sky-800 hover:bg-sky-800 hover:text-sky-100"
                                >
                                    تسجيل الدخول
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
