"use client";

import AuctionDropdown from "@/components/shared/AuctionDropdown";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
    Menu,
    X,
    Heart,
    Tag,
    Award,
    Settings,
    LogOut,
    User,
    Car,
    Home,
    DollarSign,
    BookOpen,
    RefreshCw,
    Star,
    Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { restartServers } from "@/utils/serverUtils";

const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);
    const pathname = usePathname();

    const { isLoggedIn, user, logout } = useAuthStore();

    const getUserInitials = () => {
        if (!user) return "م";

        if (user.name) {
            return user.name.charAt(0).toUpperCase();
        }

        if (user.email) {
            return user.email.charAt(0).toUpperCase();
        }

        return "م";
    };

    const isAdmin = user?.isAdmin === true;

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const toggleUserMenu = () => {
        setUserMenuOpen(!userMenuOpen);
    };

    const handleLogout = async () => {
        setUserMenuOpen(false);
        try {
            await logout();
            // Toast is already shown in the authStore, so removing it from here
        } catch (error) {
            console.error("Error logging out:", error);
            toast.error("حدث خطأ أثناء تسجيل الخروج");
        }
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
            console.error('Error restarting servers:', error);
            toast.error('حدث خطأ أثناء إعادة تشغيل الخوادم');
        } finally {
            setIsRestarting(false);
        }
    };

    const isActive = (path: string) => {
        return pathname === path || pathname?.startsWith(path + "/");
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuOpen) {
                const userMenu = document.getElementById("user-menu-dropdown");
                const userMenuButton =
                    document.getElementById("user-menu-button");

                if (
                    userMenu &&
                    userMenuButton &&
                    !userMenu.contains(event.target as Node) &&
                    !userMenuButton.contains(event.target as Node)
                ) {
                    setUserMenuOpen(false);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [userMenuOpen]);

    useEffect(() => {
        setUserMenuOpen(false);
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
                            <span className="font-bold text-base whitespace-nowrap">سوق المزادات الرقمية <span className="text-blue-700">DASM</span></span>
                        </Link>
                        
                        {/* تم حذف زر المزادات المميزة من هنا */}
                    </div>

                    {/* Main Navigation */}
                  
  <div className="hidden md:flex items-center gap-6 flex-row-reverse" dir="rtl">
  {/* <Link href="/contact" className="hover:text-sky-700 transition-colors">
    اتصل بنا
  </Link> */}
  {/* <Link href="/how-it-works" className="hover:text-sky-700 transition-colors">
    كيف نعمل
  </Link> */}
  <Link href="/auctions" className={`hover:text-sky-700 transition-colors flex items-center gap-2 ${isActive('/auctions') ? 'text-blue-700 font-bold' : ''}`}>
     <Store size={18} />
     قطاع الأسواق المتنوعة
   </Link>
</div>


                    {/* Auth Buttons */}
                    <div className="flex items-center space-x-4 space-x-reverse">
                        {isLoggedIn && user?.isAdmin && (
                            <Button 
                                variant="outline" 
                                size="icon"
                                className="mr-2 text-emerald-600 border-emerald-600 hover:bg-emerald-600 hover:text-white"
                                onClick={handleRestartServers}
                                disabled={isRestarting}
                                title="إعادة تشغيل الخوادم"
                            >
                                <RefreshCw className={`h-4 w-4 ${isRestarting ? 'animate-spin' : ''}`} />
                            </Button>
                        )}
                        
                        <Link href="dashboard/" className="ml-2 hover:text-sky-700 transition-colors">
                            <Button variant="ghost" className="text-sky-800 hover:bg-sky-100">
                                لوحة التحكم
                            </Button>
                        </Link>
                        
                        {!isLoggedIn ? (
                            <Link href="/auth/login">
                                <Button variant="outline" className="text-sky-800 border-sky-800 hover:bg-sky-800 hover:text-sky-100">
                                    تسجيل الدخول
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white" onClick={handleLogout}>
                                تسجيل الخروج
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
