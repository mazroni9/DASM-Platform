"use client";

import { useEffect, useState } from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useAuth } from "@/hooks/useAuth";
import UnifiedBroadcastManagement from "@/components/UnifiedBroadcastManagement";
import {
  Loader,
  Video,
  Radio,
  Users,
  Eye,
  Calendar,
  Settings,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Satellite,
  RefreshCw
} from "lucide-react";
import BroadcastForm from "@/components/BroadCastForm";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";

interface BroadcastStats {
  total: number;
  live: number;
  scheduled: number;
  completed: number;
  viewers: number;
}

type Broadcast = {
  id: number;
  title?: string;
  description?: string;
  is_live: boolean;
  scheduled_start_time?: string | null;
  actual_start_time?: string | null;
  end_time?: string | null;
  youtube_embed_url?: string | null;
  youtube_chat_embed_url?: string | null;
  viewers?: number; // اختياري: لو غير موجود في الموديل هنتعامل كأنه 0
};

export default function LiveStreamManagementPage() {
  const { isAdmin, isLoading, isLoggedIn } = useAuth();
  const router = useLoadingRouter();

  const [stats, setStats] = useState<BroadcastStats>({
    total: 0,
    live: 0,
    scheduled: 0,
    completed: 0,
    viewers: 0,
  });

  // حساب الإحصائيات على الفرونت من قائمة البثوث
  const calcStats = (rows: Broadcast[]): BroadcastStats => {
    const now = new Date();
    const total = rows.length;
    const live = rows.filter((b) => b.is_live).length;
    const completed = rows.filter((b) => !!b.end_time).length;
    const scheduled = rows.filter(
      (b) =>
        !b.is_live &&
        !b.end_time &&
        !!b.scheduled_start_time &&
        new Date(b.scheduled_start_time as string).getTime() > now.getTime()
    ).length;
    const viewers =
      rows.reduce((sum, b) => sum + (typeof b.viewers === "number" ? b.viewers : 0), 0) || 0;

    return { total, live, scheduled, completed, viewers };
    // ملاحظة: لو تعريف الـ "مجدول" عندك مختلف، بدّل شرط الحساب بالأعلى بسهولة.
  };

  // جلب الإحصائيات من الباك إند (عن طريق all-broadcasts)
  const fetchStats = async () => {
    try {
      const res = await api.get("/api/admin/all-broadcasts");
      const data = res.data?.data;
      const rows: Broadcast[] = data?.data || data || [];
      setStats(calcStats(rows));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "تعذر تحميل إحصائيات البث");
    }
  };

  // تحقق مبسّط: عند الجاهزية وجيب الإحصائيات
  useEffect(() => {
    if (isAdmin && !isLoading) {
      fetchStats();
    }
  }, [isAdmin, isLoading]);

  // شاشة التحميل/التحقق
  if (isLoading || !isLoggedIn || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">جاري التحقق من الصلاحيات...</p>
          <p className="text-gray-500 text-sm mt-2">إدارة البث المباشر</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-6 rtl">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            إدارة البث المباشر
          </h1>
          <p className="text-gray-400 mt-2">إدارة وتنظيم جلسات البث المباشر والمزادات الحية</p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <button
            onClick={fetchStats}
            className="bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300 px-4 py-2 rounded-xl flex items-center"
            title="تحديث الإحصائيات"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </button>
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-600/10 border border-purple-500/20 rounded-xl p-3">
            <Satellite className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">إجمالي البثوث</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-purple-500/10 p-3 rounded-xl">
              <Video className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">بثوث مباشرة الآن</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.live}</p>
            </div>
            <div className="bg-red-500/10 p-3 rounded-xl">
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">بثوث مجدولة</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.scheduled}</p>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">بثوث مكتملة</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.completed}</p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">مشاهدين نشطين</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.viewers}</p>
            </div>
            <div className="bg-cyan-500/10 p-3 rounded-xl">
              <Eye className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Broadcast Form Section */}
        <div className="xl:col-span-2">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
            {/* Form Header */}
            <div className="border-b border-gray-700/50 p-6 bg-gradient-to-r from-gray-800 to-gray-900">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">إنشاء بث جديد</h2>
                  <p className="text-gray-400 text-sm mt-1">إعداد بث مباشر جديد للمزادات أو العروض</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {/* ما لمسنا الـ component — هتديهولنا إنت */}
              <BroadcastForm />
            </div>
          </div>
        </div>

        {/* Quick Actions & Info Section */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
            <div className="flex items-center space-x-3 space-x-reverse mb-6">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">إجراءات سريعة</h3>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                className="w-full bg-gradient-to-r from-purple-500/10 to-pink-600/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 hover:text-white transition-all duration-300 py-3 px-4 rounded-xl text-right flex items-center justify-between"
              >
                <span>البثوث النشطة</span>
                <Radio className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="w-full bg-gradient-to-r from-amber-500/10 to-orange-600/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:text-white transition-all duration-300 py-3 px-4 rounded-xl text-right flex items-center justify-between"
              >
                <span>الجداول الزمنية</span>
                <Calendar className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="w-full bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 hover:text-white transition-all duration-300 py-3 px-4 rounded-xl text-right flex items-center justify-between"
              >
                <span>إحصائيات المشاهدين</span>
                <Users className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
            <div className="flex items-center space-x-3 space-x-reverse mb-6">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">حالة النظام</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">خوادم البث</span>
                <span className="text-green-400 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full ml-2"></div>
                  نشطة
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">جودة البث</span>
                <span className="text-green-400">ممتازة</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">الإتصال</span>
                <span className="text-green-400">مستقر</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">المهلة</span>
                <span className="text-amber-400">منخفضة</span>
              </div>
            </div>
          </div>

          {/* Tips & Guidelines */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
            <div className="flex items-center space-x-3 space-x-reverse mb-6">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-white">نصائح مهمة</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>تأكد من جودة الإنترنت قبل البدء بالبث</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>اختر وقتاً مناسباً لجمهورك المستهدف</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 ه-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>جهز محتوى البث مسبقاً لتجنب الأخطاء</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>اختبر البث قبل البدء بالبث المباشر</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Broadcast Management - Full Width */}
      <div className="mt-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="border-b border-gray-700/50 p-6 bg-gradient-to-r from-gray-800 to-gray-900">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">إدارة البثوث</h2>
                <p className="text-gray-400 text-sm mt-1">عرض وإدارة جميع البثوث المباشرة والمجدولة</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {/* هنسيب الـ component زي ما اديتهولي */}
            <UnifiedBroadcastManagement role="admin" />
          </div>
        </div>
      </div>
    </div>
  );
}
