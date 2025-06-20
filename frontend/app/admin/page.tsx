"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Car,
    Calendar,
    Clock,
    DollarSign,
    FileText,
    AlertTriangle,
    CheckCircle,
    Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";

// Types for dashboard statistics
interface DashboardStats {
    totalUsers: number;
    pendingUsers: number;
    totalAuctions: number;
    activeAuctions: number;
    completedAuctions: number;
    pendingVerifications: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        pendingUsers: 0,
        totalAuctions: 0,
        activeAuctions: 0,
        completedAuctions: 0,
        pendingVerifications: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentUsersNotActivated, setNotActiviatedUsers] = useState([]);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <span className="mr-2 text-xl">جاري تحميل البيانات...</span>
            </div>
        );
    }

    console.log("recentUsers", recentUsers);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">
                    لوحة القيادة
                </h1>
                <div className="text-sm text-gray-500">
                    <Clock className="inline-block ml-1" size={16} />
                    {new Date().toLocaleDateString("ar-SA", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </div>
            </div>

            {/* الإحصائيات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm">
                                إجمالي المستخدمين
                            </p>
                            <p className="text-3xl font-bold text-gray-800">
                                {stats.totalUsers}
                            </p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-4 text-sm">
                        <span className="text-amber-600 font-medium">
                            {stats.pendingUsers} مستخدم
                        </span>{" "}
                        بانتظار التفعيل
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm">
                                المزادات النشطة
                            </p>
                            <p className="text-3xl font-bold text-gray-800">
                                {stats.activeAuctions}
                            </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <Car className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-4 text-sm">
                        من أصل{" "}
                        <span className="text-gray-700 font-medium">
                            {stats.totalAuctions} مزاد
                        </span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm">
                                طلبات التحقق
                            </p>
                            <p className="text-3xl font-bold text-gray-800">
                                {stats.pendingVerifications}
                            </p>
                        </div>
                        <div className="bg-amber-100 p-3 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>
                    <div className="mt-4 text-sm">
                        <span className="text-amber-600 font-medium">
                            {stats.pendingVerifications} طلب
                        </span>{" "}
                        ينتظر الموافقة
                    </div>
                </div>
            </div>

            {/* أحدث المستخدمين */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">
                        أحدث المستخدمين المسجلين
                    </h2>
                    <a
                        href="/admin/users"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        عرض الكل
                    </a>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                                    الاسم
                                </th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                                    البريد الإلكتروني
                                </th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                                    تاريخ التسجيل
                                </th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                                    الحالة
                                </th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                                    الإجراءات
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recentUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm">{`${user.first_name} ${user.last_name}`}</td>
                                    <td className="py-3 px-4 text-sm">
                                        {user.email}
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        {user.status === "active" ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle className="w-3 h-3 mr-1" />{" "}
                                                مفعل
                                            </span>
                                        ) : user.status === "rejected" ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <AlertTriangle className="w-3 h-3 mr-1" />{" "}
                                                مرفوض
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                <Clock className="w-3 h-3 mr-1" />{" "}
                                                في الانتظار
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        <a
                                            href={`/admin/users/${user.id}`}
                                            className="text-blue-600 hover:text-blue-800 mx-1"
                                        >
                                            عرض
                                        </a>
                                        {(user.status === "pending" ||
                                            user.status === "rejected") && (
                                            <button
                                                onClick={() =>
                                                    handleUserActivation(
                                                        user.id
                                                    )
                                                }
                                            >
                                                تفعيل
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/*  مستخدمين بحاجة للتفعيل*/}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">
                        مستخدمين بإنتظار التفعيل
                    </h2>
                    <a
                        href="/admin/users"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        عرض الكل
                    </a>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                                    الاسم
                                </th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                                    البريد الإلكتروني
                                </th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                                    تاريخ التسجيل
                                </th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                                    الحالة
                                </th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                                    الإجراءات
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recentUsersNotActivated.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm">
                                        {user.first_name} {user.last_name}
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        {user.email}
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                            <Clock className="w-3 h-3 mr-1" />{" "}
                                            في الانتظار
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        <a
                                            href={`/admin/users/${user.id}`}
                                            className="text-blue-600 hover:text-blue-800 mx-1"
                                        >
                                            عرض
                                        </a>
                                        <button
                                            className="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 rounded-md px-3 bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() =>
                                                handleUserActivation(user.id)
                                            }
                                        >
                                            تفعيل
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
