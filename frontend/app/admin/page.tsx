"use client";

import { useState, useEffect, Suspense } from "react";
import {
    Users,
    Car,
    Calendar,
    Clock,
    DollarSign,
    FileText,
    AlertTriangle,
    CheckCircle,
    Settings,
    Play,
    TrendingUp,
    UserCheck,
    Zap,
    BarChart3,
    Eye,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    Download,
    RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from 'next/dynamic';
import GlobalLoader from '@/components/GlobalLoader';

// Dynamic imports for heavy admin components
const AdminAuctionApproval = dynamic(() => import("@/components/admin/AuctionApproval"), {
  loading: () => <GlobalLoader />,
  ssr: false
});
const AdminBroadcastManagement = dynamic(() => import("@/components/admin/AdminBroadcastManagement"), {
  loading: () => <GlobalLoader />,
  ssr: false
});
const AdminCarsPage = dynamic(() => import("./cars/page"), {
  loading: () => <GlobalLoader />,
  ssr: false
});

// Types for dashboard statistics
interface DashboardStats {
    totalUsers: number;
    pendingUsers: number;
    totalAuctions: number;
    activeAuctions: number;
    completedAuctions: number;
    pendingVerifications: number;
    pendingAuctionApprovals: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        pendingUsers: 0,
        totalAuctions: 0,
        activeAuctions: 0,
        completedAuctions: 0,
        pendingVerifications: 0,
        pendingAuctionApprovals: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentUsersNotActivated, setNotActiviatedUsers] = useState([]);
    const [activeTab, setActiveTab] = useState("dashboard");

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                // Fetch dashboard stats from backend
                const response = await api.get("/api/admin/dashboard");
                if (response.data && response.data.status === "success") {
                    const data = response.data.data;

                    setStats({
                        totalUsers: data.total_users || 0,
                        pendingUsers: data.pending_users || 0,
                        totalAuctions: data.total_auctions || 0,
                        activeAuctions: data.active_auctions || 0,
                        completedAuctions: data.completed_auctions || 0,
                        pendingVerifications: data.pending_verifications || 0,
                        pendingAuctionApprovals:
                            data.pending_auction_approvals || 0,
                    });

                    if (data.recent_users) {
                        let notActiviated = data.recent_users.filter((elm) => {
                            if (elm.status === "pending") {
                                return elm;
                            }
                        });

                        setRecentUsers(data.recent_users);
                        setNotActiviatedUsers(notActiviated);
                    } else {
                        setRecentUsers([]);
                        setNotActiviatedUsers([]);
                    }
                }
            } catch (error) {
                console.error("❌ Dashboard API error:", error);

                toast.error("فشل في تحميل بيانات لوحة المعلومات");

                // Initialize with zeros
                setStats({
                    totalUsers: 0,
                    pendingUsers: 0,
                    totalAuctions: 0,
                    activeAuctions: 0,
                    completedAuctions: 0,
                    pendingVerifications: 0,
                    pendingAuctionApprovals: 0,
                });

                setRecentUsers([]);
                setNotActiviatedUsers([]);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    // Handle user activation
    const handleUserActivation = async (userId: number) => {
        try {
            const response = await api.post(
                `/api/admin/users/${userId}/activate`
            );
            if (response.data.status === "success") {
                toast.success("تم تفعيل المستخدم بنجاح");
                setRecentUsers((prevUsers) =>
                    prevUsers.map((user) =>
                        user.id === userId
                            ? { ...user, is_active: true, status: "active" }
                            : user
                    )
                );
            } else {
                toast.error("فشل في تفعيل المستخدم");
            }
        } catch (error) {
            console.error("Error activating user:", error);
            toast.error("فشل في تفعيل المستخدم");
        }
    };

    // Format date to a readable string
    const formatDate = (dateString) => {
        if (!dateString) return "غير متوفر";
        const date = new Date(dateString);
        return date.toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Refresh dashboard data
    const refreshData = () => {
        setLoading(true);
        // Re-fetch data logic here
        setTimeout(() => setLoading(false), 1000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        لوحة التحكم الإدارية
                    </h1>
                    <div className="flex items-center mt-2 text-gray-400">
                        <Clock className="ml-1" size={16} />
                        <span className="text-sm">
                            {new Date().toLocaleDateString("ar-SA", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center space-x-3 space-x-reverse mt-4 md:mt-0">
                    <button 
                        onClick={refreshData}
                        className="flex items-center bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-300 px-4 py-2 rounded-lg"
                    >
                        <RefreshCw size={18} className={`ml-2 ${loading ? 'animate-spin' : ''}`} />
                        تحديث البيانات
                    </button>
                    <button className="flex items-center bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 px-4 py-2 rounded-lg">
                        <Download size={18} className="ml-2" />
                        تصدير تقرير
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
                <Tabs defaultValue="dashboard" className="w-full">
                    <div className="border-b border-gray-700/50 px-6">
                        <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 h-14">
                            <TabsTrigger 
                                value="dashboard" 
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-600/20 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 rounded-none h-full flex flex-col justify-center transition-all duration-300"
                            >
                                <div className="flex items-center justify-center">
                                    <BarChart3 size={18} className="ml-2" />
                                    <span>الإحصائيات</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="cars" 
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-600/20 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 rounded-none h-full flex flex-col justify-center transition-all duration-300"
                            >
                                <div className="flex items-center justify-center">
                                    <Car size={18} className="ml-2" />
                                    <span>إدارة السيارات</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="broadcast" 
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-600/20 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 rounded-none h-full flex flex-col justify-center transition-all duration-300"
                            >
                                <div className="flex items-center justify-center">
                                    <Play size={18} className="ml-2" />
                                    <span>إدارة البث</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="auctions" 
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-600/20 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 rounded-none h-full flex flex-col justify-center transition-all duration-300"
                            >
                                <div className="flex items-center justify-center">
                                    <DollarSign size={18} className="ml-2" />
                                    <span>موافقة المزادات</span>
                                </div>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="dashboard" className="m-0 p-6 space-y-8">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Total Users Card */}
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-cyan-500/30 group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">إجمالي المستخدمين</p>
                                        <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                                        <div className="flex items-center mt-2">
                                            <TrendingUp size={14} className="text-green-400 ml-1" />
                                            <span className="text-xs text-green-400">+12% عن الشهر الماضي</span>
                                        </div>
                                    </div>
                                    <div className="bg-cyan-500/10 p-3 rounded-xl group-hover:bg-cyan-500/20 transition-all duration-300">
                                        <Users className="w-6 h-6 text-cyan-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Active Auctions Card */}
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-500/30 group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">المزادات النشطة</p>
                                        <p className="text-2xl font-bold text-white">{stats.activeAuctions}</p>
                                        <div className="flex items-center mt-2">
                                            <Zap size={14} className="text-blue-400 ml-1" />
                                            <span className="text-xs text-blue-400">من أصل {stats.totalAuctions} مزاد</span>
                                        </div>
                                    </div>
                                    <div className="bg-blue-500/10 p-3 rounded-xl group-hover:bg-blue-500/20 transition-all duration-300">
                                        <Car className="w-6 h-6 text-blue-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Pending Verifications Card */}
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-amber-500/30 group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">طلبات التحقق</p>
                                        <p className="text-2xl font-bold text-white">{stats.pendingVerifications}</p>
                                        <div className="flex items-center mt-2">
                                            <AlertTriangle size={14} className="text-amber-400 ml-1" />
                                            <span className="text-xs text-amber-400">بانتظار المراجعة</span>
                                        </div>
                                    </div>
                                    <div className="bg-amber-500/10 p-3 rounded-xl group-hover:bg-amber-500/20 transition-all duration-300">
                                        <AlertTriangle className="w-6 h-6 text-amber-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Pending Users Card */}
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-500/30 group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">المستخدمين المعلقين</p>
                                        <p className="text-2xl font-bold text-white">{stats.pendingUsers}</p>
                                        <div className="flex items-center mt-2">
                                            <UserCheck size={14} className="text-purple-400 ml-1" />
                                            <span className="text-xs text-purple-400">بحاجة للتفعيل</span>
                                        </div>
                                    </div>
                                    <div className="bg-purple-500/10 p-3 rounded-xl group-hover:bg-purple-500/20 transition-all duration-300">
                                        <UserCheck className="w-6 h-6 text-purple-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Users Table */}
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
                                <div className="p-5 border-b border-gray-700/50">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-lg font-semibold text-white">أحدث المستخدمين المسجلين</h2>
                                        <a
                                            href="/admin/users"
                                            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center transition-colors duration-300"
                                        >
                                            عرض الكل
                                            <ChevronLeft size={16} className="mr-1" />
                                        </a>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-750 border-b border-gray-700/50">
                                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-400">الاسم</th>
                                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-400">البريد الإلكتروني</th>
                                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-400">الحالة</th>
                                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-400">الإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/50">
                                            {recentUsers.slice(0, 5).map((user) => (
                                                <tr
                                                    key={user.id}
                                                    className="hover:bg-gray-750/50 transition-colors duration-200"
                                                >
                                                    <td className="py-3 px-4 text-sm text-white">{`${user.first_name} ${user.last_name}`}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-300">{user.email}</td>
                                                    <td className="py-3 px-4 text-sm">
                                                        {user.status === "active" ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                                                <CheckCircle className="w-3 h-3 mr-1" /> مفعل
                                                            </span>
                                                        ) : user.status === "rejected" ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                                                                <AlertTriangle className="w-3 h-3 mr-1" /> مرفوض
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                                <Clock className="w-3 h-3 mr-1" /> في الانتظار
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm">
                                                        <div className="flex items-center space-x-2 space-x-reverse">
                                                            <button className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 p-1 rounded">
                                                                <Eye size={16} />
                                                            </button>
                                                            {(user.status === "pending" || user.status === "rejected") && (
                                                                <button 
                                                                    onClick={() => handleUserActivation(user.id)}
                                                                    className="text-green-400 hover:text-green-300 transition-colors duration-200 p-1 rounded"
                                                                >
                                                                    <UserCheck size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pending Activation Users Table */}
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
                                <div className="p-5 border-b border-gray-700/50">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-lg font-semibold text-white">مستخدمين بإنتظار التفعيل</h2>
                                        <a
                                            href="/admin/users"
                                            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center transition-colors duration-300"
                                        >
                                            عرض الكل
                                            <ChevronLeft size={16} className="mr-1" />
                                        </a>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-750 border-b border-gray-700/50">
                                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-400">الاسم</th>
                                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-400">البريد الإلكتروني</th>
                                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-400">الحالة</th>
                                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-400">الإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/50">
                                            {recentUsersNotActivated.slice(0, 5).map((user) => (
                                                <tr
                                                    key={user.id}
                                                    className="hover:bg-gray-750/50 transition-colors duration-200"
                                                >
                                                    <td className="py-3 px-4 text-sm text-white">{user.first_name} {user.last_name}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-300">{user.email}</td>
                                                    <td className="py-3 px-4 text-sm">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                            <Clock className="w-3 h-3 mr-1" /> في الانتظار
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm">
                                                        <div className="flex items-center space-x-2 space-x-reverse">
                                                            <button className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 p-1 rounded">
                                                                <Eye size={16} />
                                                            </button>
                                                            <button
                                                                className="text-green-400 hover:text-green-300 transition-colors duration-200 p-1 rounded"
                                                                onClick={() => handleUserActivation(user.id)}
                                                            >
                                                                <UserCheck size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="cars">
                        <Suspense fallback={<GlobalLoader />}>
                            <AdminCarsPage />
                        </Suspense>
                    </TabsContent>

                    <TabsContent value="broadcast">
                        <Suspense fallback={<GlobalLoader />}>
                            <AdminBroadcastManagement />
                        </Suspense>
                    </TabsContent>

                    <TabsContent value="auctions">
                        <Suspense fallback={<GlobalLoader />}>
                            <AdminAuctionApproval />
                        </Suspense>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}