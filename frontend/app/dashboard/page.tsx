"use client";

import { useEffect, useState, Suspense } from "react";
import LoadingLink from "@/components/LoadingLink";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import {
    Home,
    ArrowRight,
    User,
    ShoppingCart,
    CreditCard,
    ShoppingBag,
    Truck,
    Settings,
    Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import GlobalLoader from "@/components/GlobalLoader";


export default function DashboardTabs() {
    const pathname = usePathname();
    const router = useLoadingRouter();
    
    const { user, isLoggedIn } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        purchases: 0,
        sales: 0,
        walletBalance: 0,
        activeOrders: 0,
    });
    const [activities, setActivities] = useState([]);

    // Tabs configuration
    const tabs = [
        
        {
            name: "سيارتي",
            href: "/dashboard/mycars",
            icon: <User className="w-4 h-4 ml-1.5" />,
        },
        {
            name: "مشترياتي",
            href: "/dashboard/my-purchases",
            icon: <ShoppingCart className="w-4 h-4 ml-1.5" />,
        },
        {
            name: "مبيعاتي",
            href: "/dashboard/my-sales",
            icon: <ShoppingBag className="w-4 h-4 ml-1.5" />,
        },
        {
            name: "محفظتي",
            href: "/dashboard/my-wallet",
            icon: <CreditCard className="w-4 h-4 ml-1.5" />,
        },
        {
            name: "تحويلاتي",
            href: "/dashboard/my-transfers",
            icon: <ArrowRight className="w-4 h-4 ml-1.5" />,
        },
        {
            name: "خدمات الشحن",
            href: "/dashboard/shipping",
            icon: <Truck className="w-4 h-4 ml-1.5" />,
        },
        {
            name: "الملف الشخصي",
            href: "/dashboard/profile",
            icon: <User className="w-4 h-4 ml-1.5" />,
        },
    ];

    // Get user display name
    const userName = user
        ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
        : "مستخدم";

    // Verify user is authenticated
    useEffect(() => {
        if (!isLoggedIn) {
            router.push("/auth/login?returnUrl=/dashboard");
        }
    }, [isLoggedIn, router]);

    // Fetch wallet balance and user stats
    useEffect(() => {
        async function fetchUserData() {
            if (!isLoggedIn || !user) return;

            setLoading(true);
            try {
                // Get user profile data - using correct API path with /api prefix
                const profileResponse = await api.get("/api/user/profile");
                if (
                    profileResponse.data &&
                    profileResponse.data.status === "success"
                ) {
                    const profileData = profileResponse.data.data;

                    // Set stats based on profile data (adjust if your backend structure is different)
                    setStats({
                        purchases: profileData.purchases_count || 0,
                        sales: profileData.sales_count || 0,
                        walletBalance: profileData.wallet_balance || 0,
                        activeOrders: profileData.active_orders_count || 0,
                    });

                    // If activities exist in the profile data
                    if (
                        profileData.activities &&
                        Array.isArray(profileData.activities)
                    ) {
                        setActivities(profileData.activities);
                    } else {
                        // Use empty activities array
                        setActivities([]);
                    }
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                toast.error(
                    "تعذر تحميل بيانات لوحة التحكم. يرجى المحاولة لاحقًا."
                );

                // Initialize with empty data
                setStats({
                    purchases: 0,
                    sales: 0,
                    walletBalance: 0,
                    activeOrders: 0,
                });
                setActivities([]);
            } finally {
                setLoading(false);
            }
        }

        fetchUserData();
    }, [isLoggedIn, user]);

    // Activity type to icon mapping
    const getActivityIcon = (type) => {
        switch (type) {
            case "purchase":
                return <ShoppingCart className="w-4 h-4 text-blue-600" />;
            case "sale":
                return <ShoppingBag className="w-4 h-4 text-green-600" />;
            case "deposit":
            case "withdrawal":
                return <CreditCard className="w-4 h-4 text-amber-600" />;
            default:
                return <ArrowRight className="w-4 h-4 text-gray-600" />;
        }
    };

    // Activity type to background color mapping
    const getActivityBgColor = (type) => {
        switch (type) {
            case "purchase":
                return "bg-blue-100";
            case "sale":
                return "bg-green-100";
            case "deposit":
            case "withdrawal":
                return "bg-amber-100";
            default:
                return "bg-gray-100";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            {/* زر العودة للصفحة الرئيسية + عنوان الصفحة */}
            <div className="bg-white border-b shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <LoadingLink
                            href="/"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            <Home className="w-5 h-5" />
                            <span>الرئيسية</span>
                        </LoadingLink>
                        <h1 className="text-2xl font-bold text-gray-800">
                            لوحة التحكم
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* البطاقة الرئيسية */}
                <div className="bg-white rounded-lg shadow-md border p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                مرحباً بك {userName} في DASM-e
                            </h2>
                            <p className="text-green-500 font-bold mt-1">
                                {user?.role == "user" || user?.role == "dealer"  ? "الاشتراك : مجاني" : ""}
                            </p>
                            <p className="text-gray-500 mt-1">
                                يمكنك إدارة حسابك ومشترياتك ومبيعاتك من هنا
                            </p>
                        </div>
                        <div className="hidden sm:block">
                            <Settings className="w-8 h-8 text-gray-400" />
                        </div>
                    </div>

                    {/* شريط التنقل بين الأقسام */}
                    <div className="flex overflow-x-auto pb-2 scrollbar-hide">
                        <div className="flex gap-3 mx-auto">
                            {tabs.map((tab) => (
                                <LoadingLink
                                    key={tab.href}
                                    href={tab.href}
                                    className={cn(
                                        "min-w-[110px] flex flex-col items-center gap-2 px-4 py-3 rounded-lg transition-all border",
                                        pathname === tab.href
                                            ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                                            : "text-gray-600 hover:bg-gray-50 border-gray-100 hover:border-gray-200"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "p-2 rounded-full",
                                            pathname === tab.href
                                                ? "bg-blue-100"
                                                : "bg-gray-100"
                                        )}
                                    >
                                        {tab.icon}
                                    </div>
                                    <span className="text-sm font-medium whitespace-nowrap">
                                        {tab.name}
                                    </span>
                                </LoadingLink>
                            ))}
                        </div>
                    </div>
                </div>

                {/* المحتوى الإضافي */}
                {loading ? (
                    <div className="flex items-center justify-center p-10">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="mr-2 text-gray-600">
                            جاري تحميل البيانات...
                        </span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* إحصائيات سريعة */}
                        <div className="bg-white rounded-lg shadow-md border p-6">
                            <h3 className="text-lg font-medium mb-4 text-gray-800">
                                إحصائيات سريعة
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <p className="text-sm text-gray-500">
                                        المشتريات
                                    </p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {stats.purchases}
                                    </p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <p className="text-sm text-gray-500">
                                        المبيعات
                                    </p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {stats.sales}
                                    </p>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                    <p className="text-sm text-gray-500">
                                        رصيد المحفظة
                                    </p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {stats.walletBalance.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                    <p className="text-sm text-gray-500">
                                        الطلبات النشطة
                                    </p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {stats.activeOrders}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* آخر النشاطات */}
                        <div className="bg-white rounded-lg shadow-md border p-6">
                            <h3 className="text-lg font-medium mb-4 text-gray-800">
                                آخر النشاطات
                            </h3>
                            <div className="space-y-3">
                                {activities.length > 0 ? (
                                    activities.map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50"
                                        >
                                            <div
                                                className={`p-2 ${getActivityBgColor(
                                                    activity.type
                                                )} rounded-full`}
                                            >
                                                {getActivityIcon(activity.type)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {activity.title}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {activity.date}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        لا توجد نشاطات حديثة
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
