"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User, Settings } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

export default function UserMenu() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push("/auth/login");
    };

    const navigateTo = (path: string) => {
        router.push(path);
        setIsOpen(false);
    };

    if (!user) return null;

    // Get user initials safely
    const getUserInitials = () => {
        if (user.first_name) {
            return user.first_name[0].toUpperCase();
        }
        if (user.email) {
            return user.email[0].toUpperCase();
        }
        return "م"; // Default Arabic character
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex flex-row-reverse items-center gap-2 text-sky-900 hover:text-sky-700 transition-colors"
            >
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-sky-200">
                    {user.avatar ? (
                        <Image
                            src={user.avatar}
                            alt={user.first_name || "User"}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-sky-600 text-white text-sm">
                            {getUserInitials()}
                        </div>
                    )}
                </div>
                <span className="hidden md:inline-block">
                    {user.first_name || user.email || "مستخدم"}
                </span>
                <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-sky-200 z-50">
                    <div
                        className="py-1"
                        role="menu"
                        aria-orientation="vertical"
                    >
                        <button
                            onClick={() => navigateTo("/dashboard")}
                            className="flex items-center w-full px-4 py-2 text-sm text-sky-900 hover:bg-sky-50"
                            role="menuitem"
                        >
                            <User className="w-4 h-4 mr-2" />
                            لوحة التحكم
                        </button>

                        {user.role === "admin" && (
                            <button
                                onClick={() => navigateTo("/admin")}
                                className="flex items-center w-full px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
                                role="menuitem"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-4 h-4 mr-2"
                                >
                                    <path d="M12 2v4M19 5l-3 3M22 12h-4M19 19l-3-3M12 22v-4M5 19l3-3M2 12h4M5 5l3 3"></path>
                                </svg>
                                لوحة المسؤول
                            </button>
                        )}

                        {user.role === "moderator" && (
                            <button
                                onClick={() => navigateTo("/moderator/dashboard")}
                                className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                role="menuitem"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-4 h-4 mr-2"
                                >
                                    <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"></path>
                                    <path d="M12 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"></path>
                                    <path d="M20 17.58A10 10 0 0 0 12 2v0a10 10 0 0 0-8 15.58"></path>
                                </svg>
                                لوحة المشرف
                            </button>
                        )}

                        <button
                            onClick={() => navigateTo("/dashboard/profile")}
                            className="flex items-center w-full px-4 py-2 text-sm text-sky-900 hover:bg-sky-50"
                            role="menuitem"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            إعدادات الحساب
                        </button>

                        <div className="border-t border-sky-100"></div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            role="menuitem"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            تسجيل الخروج
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
