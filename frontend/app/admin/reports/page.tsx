"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Users,
    Car,
    Calendar,
    FileText,
    Download,
    Loader2,
    PieChart,
    Activity,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    MoreVertical,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";

interface ReportData {
    totalRevenue: number;
    totalAuctions: number;
    totalUsers: number;
    activeAuctions: number;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    topCategories: Array<{ category: string; count: number }>;
    successRate: number;
    growthRate: number;
}

interface ActivityItem {
    id: number;
    type: "auction" | "user" | "payment" | "system";
    title: string;
    description: string;
    timestamp: string;
    status: "success" | "warning" | "info" | "error";
}

export default function AdminReportsPage() {
    const [reportData, setReportData] = useState<ReportData>({
        totalRevenue: 0,
        totalAuctions: 0,
        totalUsers: 0,
        activeAuctions: 0,
        monthlyRevenue: [],
        topCategories: [],
        successRate: 87.3,
        growthRate: 12.5,
    });
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("30");
    const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
    const [exportLoading, setExportLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchReportData();
        generateMockActivities();
    }, [dateRange]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/admin/dashboard");
            if (response.data.status === "success") {
                const data = response.data.data;
                setReportData({
                    totalRevenue: 1250000, // Mock data for demonstration
                    totalAuctions: data.total_auctions || 0,
                    totalUsers: data.total_users || 0,
                    activeAuctions: data.active_auctions || 0,
                    monthlyRevenue: generateMonthlyRevenue(),
                    topCategories: generateTopCategories(),
                    successRate: 87.3,
                    growthRate: 12.5,
                });
            }
        } catch (error) {
            console.error("Error fetching report data:", error);
            toast.error("فشل في تحميل بيانات التقارير");
        } finally {
            setLoading(false);
        }
    };

    const generateMonthlyRevenue = () => {
        return [
            { month: "يناير", revenue: 980000 },
            { month: "فبراير", revenue: 1120000 },
            { month: "مارس", revenue: 1250000 },
            { month: "أبريل", revenue: 1180000 },
            { month: "مايو", revenue: 1320000 },
            { month: "يونيو", revenue: 1450000 },
        ];
    };

    const generateTopCategories = () => {
        return [
            { category: "سيارات سيدان", count: 245 },
            { category: "سيارات دفع رباعي", count: 189 },
            { category: "سيارات رياضية", count: 134 },
            { category: "سيارات كلاسيكية", count: 98 },
            { category: "سيارات فاخرة", count: 76 },
        ];
    };

    const generateMockActivities = () => {
        const activities: ActivityItem[] = [
            {
                id: 1,
                type: "auction",
                title: "مزاد جديد تم إنشاؤه",
                description: "سيارة مرسيدس 2023 - المزاد رقم #AUC-2345",
                timestamp: "منذ 5 دقائق",
                status: "success"
            },
            {
                id: 2,
                type: "user",
                title: "مستخدم جديد تم تسجيله",
                description: "أحمد محمد - عضو جديد في المنصة",
                timestamp: "منذ 12 دقيقة",
                status: "info"
            },
            {
                id: 3,
                type: "payment",
                title: "مزاد تم إكماله بنجاح",
                description: "تم دفع مبلغ 85,000 ريال - عملية ناجحة",
                timestamp: "منذ 25 دقيقة",
                status: "success"
            },
            {
                id: 4,
                type: "system",
                title: "تحديث النظام",
                description: "تم تحديث لوحة التحكم بنجاح",
                timestamp: "منذ ساعة",
                status: "info"
            },
            {
                id: 5,
                type: "auction",
                title: "مزاد منتهي",
                description: "مزاد BMW X6 - انتهى بدون مزايدة",
                timestamp: "منذ ساعتين",
                status: "warning"
            }
        ];
        setRecentActivities(activities);
    };

    const exportReport = async (format: string) => {
        try {
            setExportLoading(format);
            toast.success(`جاري تصدير التقرير بصيغة ${format}...`);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.success(`تم تصدير التقرير بنجاح بصيغة ${format}`);
        } catch (error) {
            console.error("Error exporting report:", error);
            toast.error("فشل في تصدير التقرير");
        } finally {
            setExportLoading(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("ar-SA", {
            style: "currency",
            currency: "SAR",
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        const colors = {
            success: "text-emerald-400 bg-emerald-400/10",
            warning: "text-amber-400 bg-amber-400/10",
            info: "text-blue-400 bg-blue-400/10",
            error: "text-rose-400 bg-rose-400/10"
        };
        return colors[status as keyof typeof colors] || colors.info;
    };

    const getStatusIcon = (type: string) => {
        const icons = {
            auction: Car,
            user: Users,
            payment: DollarSign,
            system: Activity
        };
        return icons[type as keyof typeof icons] || Activity;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-300 text-lg">جاري تحميل التقارير...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            التقارير والإحصائيات
                        </h1>
                        <p className="text-gray-400">
                            تحليلات شاملة لأداء المنصة وإحصائيات المزادات
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                            >
                                <option value="7">آخر 7 أيام</option>
                                <option value="30">آخر 30 يوم</option>
                                <option value="90">آخر 3 أشهر</option>
                                <option value="365">آخر سنة</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Revenue Card */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <DollarSign className="w-6 h-6 text-blue-400" />
                            </div>
                            <MoreVertical className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-gray-400 text-sm">إجمالي الإيرادات</p>
                            <p className="text-2xl font-bold text-white">
                                {formatCurrency(reportData.totalRevenue)}
                            </p>
                            <div className="flex items-center">
                                <ArrowUpRight className="w-4 h-4 text-emerald-400 ml-1" />
                                <span className="text-emerald-400 text-sm font-medium">
                                    +{reportData.growthRate}% من الشهر الماضي
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Auctions Card */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-500/10 rounded-xl">
                                <Car className="w-6 h-6 text-purple-400" />
                            </div>
                            <MoreVertical className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-gray-400 text-sm">إجمالي المزادات</p>
                            <p className="text-2xl font-bold text-white">
                                {reportData.totalAuctions}
                            </p>
                            <div className="flex items-center">
                                <span className="text-gray-400 text-sm">
                                    {reportData.activeAuctions} مزاد نشط
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Users Card */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-green-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-500/10 rounded-xl">
                                <Users className="w-6 h-6 text-green-400" />
                            </div>
                            <MoreVertical className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-gray-400 text-sm">إجمالي المستخدمين</p>
                            <p className="text-2xl font-bold text-white">
                                {reportData.totalUsers}
                            </p>
                            <div className="flex items-center">
                                <ArrowUpRight className="w-4 h-4 text-emerald-400 ml-1" />
                                <span className="text-emerald-400 text-sm font-medium">
                                    +8.2% من الشهر الماضي
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Success Rate Card */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-amber-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-500/10 rounded-xl">
                                <Target className="w-6 h-6 text-amber-400" />
                            </div>
                            <MoreVertical className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-gray-400 text-sm">معدل النجاح</p>
                            <p className="text-2xl font-bold text-white">
                                {reportData.successRate}%
                            </p>
                            <div className="flex items-center">
                                <span className="text-gray-400 text-sm">
                                    من المزادات المكتملة
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">
                                الإيرادات الشهرية
                            </h3>
                            <p className="text-gray-400 text-sm">تطور الإيرادات خلال الأشهر الماضية</p>
                        </div>
                        <BarChart3 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="h-64 relative">
                        {/* Mock Chart */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                                <p className="text-gray-500">سيتم إضافة الرسم البياني التفاعلي قريباً</p>
                            </div>
                        </div>
                        {/* Chart Bars (Mock) */}
                        <div className="absolute bottom-0 left-0 right-0 h-48 flex items-end justify-between px-4">
                            {reportData.monthlyRevenue.map((item, index) => (
                                <div key={index} className="flex flex-col items-center">
                                    <div 
                                        className="w-8 bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg transition-all duration-300 hover:from-blue-400 hover:to-blue-500"
                                        style={{ height: `${(item.revenue / 1500000) * 100}%` }}
                                    ></div>
                                    <span className="text-xs text-gray-400 mt-2">{item.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Categories Chart */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">
                                الفئات الأكثر شيوعاً
                            </h3>
                            <p className="text-gray-400 text-sm">توزيع المزادات حسب الفئات</p>
                        </div>
                        <PieChart className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="h-64 relative">
                        {/* Mock Pie Chart */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                                <p className="text-gray-500">سيتم إضافة الرسم البياني الدائري قريباً</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3 mt-4">
                        {reportData.topCategories.slice(0, 4).map((category, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div 
                                        className="w-3 h-3 rounded-full ml-3"
                                        style={{
                                            backgroundColor: [
                                                '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'
                                            ][index]
                                        }}
                                    ></div>
                                    <span className="text-sm text-gray-300">{category.category}</span>
                                </div>
                                <span className="text-sm text-white font-medium">{category.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl">
                    <div className="p-6 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">
                                    النشاط الأخير
                                </h3>
                                <p className="text-gray-400 text-sm">أحدث الأحداث والأنشطة على المنصة</p>
                            </div>
                            <Activity className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {recentActivities.map((activity) => {
                                const IconComponent = getStatusIcon(activity.type);
                                return (
                                    <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200">
                                        <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                                            <IconComponent className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white font-medium text-sm mb-1">
                                                {activity.title}
                                            </h4>
                                            <p className="text-gray-400 text-sm mb-2">
                                                {activity.description}
                                            </p>
                                            <span className="text-gray-500 text-xs">
                                                {activity.timestamp}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Export Options */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        تصدير التقارير
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">
                        قم بتحميل التقارير بصيغ مختلفة للتحليل والاحتفاظ بالسجلات
                    </p>
                    <div className="space-y-3">
                        {[
                            { format: "PDF", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: FileText },
                            { format: "Excel", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: FileText },
                            { format: "CSV", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: FileText }
                        ].map((item, index) => {
                            const IconComponent = item.icon;
                            return (
                                <button
                                    key={index}
                                    onClick={() => exportReport(item.format)}
                                    disabled={exportLoading === item.format}
                                    className={`w-full flex items-center justify-between p-4 border rounded-xl hover:scale-105 transition-all duration-200 ${item.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <div className="flex items-center gap-3">
                                        <IconComponent className="w-5 h-5" />
                                        <span className="font-medium">تصدير {item.format}</span>
                                    </div>
                                    {exportLoading === item.format ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}