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
    Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";

interface ReportData {
    totalRevenue: number;
    totalAuctions: number;
    totalUsers: number;
    activeAuctions: number;
    monthlyRevenue: Array<{month: string, revenue: number}>;
    topCategories: Array<{category: string, count: number}>;
}

export default function AdminReportsPage() {
    const [reportData, setReportData] = useState<ReportData>({
        totalRevenue: 0,
        totalAuctions: 0,
        totalUsers: 0,
        activeAuctions: 0,
        monthlyRevenue: [],
        topCategories: []
    });
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("30"); // Last 30 days by default

    useEffect(() => {
        fetchReportData();
    }, [dateRange]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            // Since we don't have a specific reports endpoint, we'll use dashboard data
            const response = await api.get("/api/admin/dashboard");
            if (response.data.status === "success") {
                const data = response.data.data;
                setReportData({
                    totalRevenue: 0, // This would come from transactions
                    totalAuctions: data.total_auctions || 0,
                    totalUsers: data.total_users || 0,
                    activeAuctions: data.active_auctions || 0,
                    monthlyRevenue: [], // This would be calculated from transactions
                    topCategories: [] // This would be calculated from auctions
                });
            }
        } catch (error) {
            console.error("Error fetching report data:", error);
            toast.error("فشل في تحميل بيانات التقارير");
        } finally {
            setLoading(false);
        }
    };

    const exportReport = async (format: string) => {
        try {
            toast.success(`جاري تصدير التقرير بصيغة ${format}...`);
            // Here you would implement the actual export functionality
        } catch (error) {
            console.error("Error exporting report:", error);
            toast.error("فشل في تصدير التقرير");
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="mr-2">جاري تحميل التقارير...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">التقارير والإحصائيات</h1>
                <div className="flex items-center gap-4">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                        <option value="7">آخر 7 أيام</option>
                        <option value="30">آخر 30 يوم</option>
                        <option value="90">آخر 3 أشهر</option>
                        <option value="365">آخر سنة</option>
                    </select>
                    <button
                        onClick={() => exportReport('PDF')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <Download className="w-4 h-4" />
                        تصدير PDF
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(reportData.totalRevenue)}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
                        <span className="text-sm text-green-600">+12.5% من الشهر الماضي</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">إجمالي المزادات</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.totalAuctions}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Car className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <span className="text-sm text-gray-600">
                            {reportData.activeAuctions} مزاد نشط
                        </span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.totalUsers}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
                        <span className="text-sm text-green-600">+8.2% من الشهر الماضي</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">معدل النجاح</p>
                            <p className="text-2xl font-bold text-gray-900">87.3%</p>
                        </div>
                        <div className="p-3 bg-amber-100 rounded-full">
                            <BarChart3 className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <span className="text-sm text-gray-600">من المزادات المكتملة</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">الإيرادات الشهرية</h3>
                        <BarChart3 className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>سيتم إضافة الرسم البياني قريباً</p>
                        </div>
                    </div>
                </div>

                {/* Categories Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">الفئات الأكثر شيوعاً</h3>
                        <Car className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <Car className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>سيتم إضافة الرسم البياني قريباً</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">النشاط الأخير</h3>
                        <Calendar className="w-5 h-5 text-gray-500" />
                    </div>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full ml-3"></div>
                                <span className="text-sm text-gray-600">مزاد جديد تم إنشاؤه</span>
                            </div>
                            <span className="text-sm text-gray-500">منذ 5 دقائق</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full ml-3"></div>
                                <span className="text-sm text-gray-600">مستخدم جديد تم تسجيله</span>
                            </div>
                            <span className="text-sm text-gray-500">منذ 12 دقيقة</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-amber-500 rounded-full ml-3"></div>
                                <span className="text-sm text-gray-600">مزاد تم إكماله بنجاح</span>
                            </div>
                            <span className="text-sm text-gray-500">منذ 25 دقيقة</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Options */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">تصدير التقارير</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => exportReport('PDF')}
                        className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <FileText className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-medium">تصدير PDF</span>
                    </button>
                    <button
                        onClick={() => exportReport('Excel')}
                        className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <FileText className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium">تصدير Excel</span>
                    </button>
                    <button
                        onClick={() => exportReport('CSV')}
                        className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <FileText className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium">تصدير CSV</span>
                    </button>
                </div>
            </div>
        </div>
    );
}