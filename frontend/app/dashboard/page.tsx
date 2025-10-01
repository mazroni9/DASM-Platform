"use client";

import { useEffect, useState } from "react";
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

  // ألوان مخصصة لكل تبويب
  const tabColors = {
    "/dashboard/mycars": { bg: "from-purple-900/40 to-indigo-900/40", border: "border-purple-500/50", text: "text-purple-300", icon: "text-purple-400" },
    "/dashboard/my-purchases": { bg: "from-sky-900/40 to-cyan-900/40", border: "border-sky-500/50", text: "text-sky-300", icon: "text-sky-400" },
    "/dashboard/my-sales": { bg: "from-emerald-900/40 to-teal-900/40", border: "border-emerald-500/50", text: "text-emerald-300", icon: "text-emerald-400" },
    "/dashboard/my-wallet": { bg: "from-amber-900/40 to-yellow-900/40", border: "border-amber-500/50", text: "text-amber-300", icon: "text-amber-400" },
    "/dashboard/my-transfers": { bg: "from-rose-900/40 to-pink-900/40", border: "border-rose-500/50", text: "text-rose-300", icon: "text-rose-400" },
    "/dashboard/shipping": { bg: "from-violet-900/40 to-fuchsia-900/40", border: "border-violet-500/50", text: "text-violet-300", icon: "text-violet-400" },
    "/dashboard/profile": { bg: "from-gray-900/40 to-slate-900/40", border: "border-gray-500/50", text: "text-gray-300", icon: "text-gray-400" },
  };

  const tabs = [
    { name: "سيارتي", href: "/dashboard/mycars", icon: <User className="w-5 h-5" /> },
    { name: "مشترياتي", href: "/dashboard/my-purchases", icon: <ShoppingCart className="w-5 h-5" /> },
    { name: "مبيعاتي", href: "/dashboard/my-sales", icon: <ShoppingBag className="w-5 h-5" /> },
    { name: "محفظتي", href: "/dashboard/my-wallet", icon: <CreditCard className="w-5 h-5" /> },
    { name: "تحويلاتي", href: "/dashboard/my-transfers", icon: <ArrowRight className="w-5 h-5" /> },
    { name: "خدمات الشحن", href: "/dashboard/shipping", icon: <Truck className="w-5 h-5" /> },
    { name: "الملف الشخصي", href: "/dashboard/profile", icon: <User className="w-5 h-5" /> },
  ];

  const userName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
    : "مستخدم";

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dashboard");
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    async function fetchUserData() {
      if (!isLoggedIn || !user) return;
      setLoading(true);
      try {
        const profileResponse = await api.get("/api/user/profile");
        if (profileResponse.data?.status === "success") {
          const data = profileResponse.data.data;
          setStats({
            purchases: data.purchases_count || 0,
            sales: data.sales_count || 0,
            walletBalance: data.wallet_balance || 0,
            activeOrders: data.active_orders_count || 0,
          });
          setActivities(Array.isArray(data.activities) ? data.activities : []);
        }
      } catch (error) {
        console.error("Error fetching dashboard ", error);
        toast.error("تعذر تحميل بيانات لوحة التحكم. يرجى المحاولة لاحقًا.");
        setStats({ purchases: 0, sales: 0, walletBalance: 0, activeOrders: 0 });
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, [isLoggedIn, user]);

  const getActivityIcon = (type) => {
    switch (type) {
      case "purchase": return <ShoppingCart className="w-4 h-4 text-sky-400" />;
      case "sale": return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case "deposit":
      case "withdrawal": return <CreditCard className="w-4 h-4 text-amber-400" />;
      default: return <ArrowRight className="w-4 h-4 text-gray-400" />;
    }
  };

  const statItems = [
    { label: "المشتريات", value: stats.purchases, bg: "bg-sky-900/30", border: "border-sky-700", glow: "shadow-sky-500/20", text: "text-sky-300" },
    { label: "المبيعات", value: stats.sales, bg: "bg-emerald-900/30", border: "border-emerald-700", glow: "shadow-emerald-500/20", text: "text-emerald-300" },
    { label: "رصيد المحفظة", value: stats.walletBalance.toLocaleString(), bg: "bg-amber-900/30", border: "border-amber-700", glow: "shadow-amber-500/20", text: "text-amber-300" },
    { label: "الطلبات النشطة", value: stats.activeOrders, bg: "bg-violet-900/30", border: "border-violet-700", glow: "shadow-violet-500/20", text: "text-violet-300" },
  ];

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 relative overflow-hidden"
      dir="rtl"
    >
      {/* Subtle Animated Background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(56, 189, 248, 0.15) 0%, transparent 40%),
                            radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 40%)`,
        }}
      />

      {/* Header */}
      <header className="relative z-10 py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <LoadingLink
            href="/"
            className="group flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
          >
            <Home className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span>الرئيسية</span>
          </LoadingLink>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            لوحة التحكم
          </h1>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Welcome Card */}
        <div className="bg-gray-900/70 backdrop-blur-2xl border border-gray-800 rounded-2xl p-6 mb-10 shadow-2xl">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                مرحباً بك، <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">{userName}</span>
              </h2>
              <p className="text-emerald-400 font-semibold mt-1.5">
                {user?.role === "user" || user?.role === "dealer" ? "الاشتراك: مجاني" : ""}
              </p>
              <p className="text-gray-400 mt-2 max-w-2xl">
                أنت على بعد نقرة من إدارة حسابك، مشترياتك، مبيعاتك، ومحفظتك بكل سهولة وأمان.
              </p>
            </div>
            <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700">
              <Settings className="w-7 h-7 text-purple-400" />
            </div>
          </div>

          {/* Navigation Tabs - Fixed Hover */}
          <div className="mt-8 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 min-w-max">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                const colorConfig = tabColors[tab.href] || tabColors["/dashboard/profile"];
                return (
                  <LoadingLink
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "group flex flex-col items-center justify-center gap-2 min-w-[96px] px-4 py-4 rounded-xl transition-all duration-300 border backdrop-blur-sm relative",
                      isActive
                        ? `${colorConfig.bg} ${colorConfig.border} ${colorConfig.text} shadow-lg`
                        : "bg-gray-800/40 border-gray-700 text-gray-300 hover:bg-gray-800/60 hover:border-gray-600"
                    )}
                  >
                    {/* Icon Container */}
                    <div className={cn(
                      "p-2.5 rounded-xl transition-colors duration-300",
                      isActive 
                        ? `${colorConfig.icon} bg-white/10` 
                        : "text-gray-400 bg-gray-700/50 group-hover:bg-gray-600/50"
                    )}>
                      {tab.icon}
                    </div>
                    {/* Label */}
                    <span className="text-sm font-medium whitespace-nowrap mt-1 transition-colors duration-300">
                      {tab.name}
                    </span>
                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-current rounded-full"></div>
                    )}
                  </LoadingLink>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats & Activities */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-16 h-16">
              <Loader2 className="absolute inset-0 w-full h-full animate-spin text-purple-500" />
              <div className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-t-purple-500 animate-spin opacity-60"></div>
            </div>
            <p className="mt-6 text-xl text-gray-400 font-medium">جاري تحميل لوحة التحكم...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Stats Cards */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                إحصائيات سريعة
              </h3>
              <div className="grid grid-cols-2 gap-5">
                {statItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-5 rounded-xl border backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl",
                      item.bg,
                      item.border,
                      item.glow
                    )}
                  >
                    <p className="text-sm text-gray-300">{item.label}</p>
                    <p className={cn("text-2xl font-bold mt-2", item.text)}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                آخر النشاطات
              </h3>
              <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-xl p-5 h-full">
                {activities.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/40 hover:bg-gray-800/60 transition-all duration-300 border border-gray-700/50 hover:border-gray-600/70"
                      >
                        <div className={`p-2.5 ${getActivityBgColor(activity.type)} rounded-xl`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-100 truncate">{activity.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <div className="p-3 bg-gray-800/50 rounded-full mb-3">
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                    </div>
                    <p>لا توجد نشاطات حديثة</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const getActivityBgColor = (type) => {
  switch (type) {
    case "purchase": return "bg-sky-900/30";
    case "sale": return "bg-emerald-900/30";
    case "deposit":
    case "withdrawal": return "bg-amber-900/30";
    default: return "bg-gray-800/30";
  }
};