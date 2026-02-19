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
  RefreshCw,
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
  viewers?: number;
};

const cn = (...xs: Array<string | false | undefined | null>) =>
  xs.filter(Boolean).join(" ");

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
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/admin/all-broadcasts");
      if (!res?.data) throw new Error("No response data");

      const data = res.data?.data;
      const rows: Broadcast[] = data?.data || data || [];
      setStats(calcStats(rows));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "طھط¹ط°ط± طھط­ظ…ظٹظ„ ط¥ط­طµط§ط¦ظٹط§طھ ط§ظ„ط¨ط«");
    }
  };

  // Redirect ظ„ظˆ ظ…ط´ ط£ط¯ظ…ظ† ط¨ط¹ط¯ ط§ظ„طھط­ظ…ظٹظ„ (ظˆظƒظ…ط§ظ† ط¹ط´ط§ظ† router ظ…ط§ظٹط¨ظ‚ط§ط´ unused)
  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push("/"); // ط؛ظٹظ‘ط±ظ‡ط§ ظ„طµظپط­ط© طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ„ظˆ ط¹ظ†ط¯ظƒ
    }
  }, [isLoading, isLoggedIn, isAdmin, router]);

  useEffect(() => {
    if (isAdmin && !isLoading) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isLoading]);

  // Loading / checking screen (Light + Dark)
  if (isLoading || !isLoggedIn || !isAdmin) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center"
      >
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-cyan-500 dark:text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300">ط¬ط§ط±ظٹ ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„طµظ„ط§ط­ظٹط§طھ...</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">ط¥ط¯ط§ط±ط© ط§ظ„ط¨ط« ط§ظ„ظ…ط¨ط§ط´ط±</p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-white p-2"
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-500 bg-clip-text text-transparent">
            ط¥ط¯ط§ط±ط© ط§ظ„ط¨ط« ط§ظ„ظ…ط¨ط§ط´ط±
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            ط¥ط¯ط§ط±ط© ظˆطھظ†ط¸ظٹظ… ط¬ظ„ط³ط§طھ ط§ظ„ط¨ط« ط§ظ„ظ…ط¨ط§ط´ط± ظˆط§ظ„ظ…ط²ط§ط¯ط§طھ ط§ظ„ط­ظٹط©
          </p>
        </div>

        <div className="flex items-center gap-3 mt-2 lg:mt-0">
          <button
            onClick={fetchStats}
            className={cn(
              "border rounded-xl px-4 py-2 flex items-center transition-all duration-200",
              "bg-white/70 hover:bg-white text-gray-700 border-gray-200 shadow-sm",
              "dark:bg-gray-900/40 dark:hover:bg-white/5 dark:text-gray-200 dark:border-white/10"
            )}
            title="طھط­ط¯ظٹط« ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            طھط­ط¯ظٹط«
          </button>

          <div className="bg-gradient-to-r from-purple-500/10 to-pink-600/10 border border-purple-500/20 dark:border-purple-500/20 rounded-xl p-3">
            <Satellite className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Total */}
        <div className="rounded-xl p-6 border shadow-sm bg-white/70 border-gray-200 dark:bg-gray-900/40 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¨ط«ظˆط«</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="bg-purple-500/10 p-3 rounded-xl">
              <Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Live */}
        <div className="rounded-xl p-6 border shadow-sm bg-white/70 border-gray-200 dark:bg-gray-900/40 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">ط¨ط«ظˆط« ظ…ط¨ط§ط´ط±ط© ط§ظ„ط¢ظ†</p>
              <p className="text-2xl font-bold mt-1">{stats.live}</p>
            </div>
            <div className="bg-rose-500/10 p-3 rounded-xl">
              <div className="w-3 h-3 bg-rose-500 dark:bg-rose-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Scheduled */}
        <div className="rounded-xl p-6 border shadow-sm bg-white/70 border-gray-200 dark:bg-gray-900/40 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">ط¨ط«ظˆط« ظ…ط¬ط¯ظˆظ„ط©</p>
              <p className="text-2xl font-bold mt-1">{stats.scheduled}</p>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="rounded-xl p-6 border shadow-sm bg-white/70 border-gray-200 dark:bg-gray-900/40 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">ط¨ط«ظˆط« ظ…ظƒطھظ…ظ„ط©</p>
              <p className="text-2xl font-bold mt-1">{stats.completed}</p>
            </div>
            <div className="bg-emerald-500/10 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Viewers */}
        <div className="rounded-xl p-6 border shadow-sm bg-white/70 border-gray-200 dark:bg-gray-900/40 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">ظ…ط´ط§ظ‡ط¯ظٹظ† ظ†ط´ط·ظٹظ†</p>
              <p className="text-2xl font-bold mt-1">{stats.viewers}</p>
            </div>
            <div className="bg-cyan-500/10 p-3 rounded-xl">
              <Eye className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Broadcast Form Section */}
        <div className="xl:col-span-2">
          <div className="rounded-2xl border shadow-sm overflow-hidden bg-white/70 border-gray-200 dark:bg-gray-900/40 dark:border-white/10">
            {/* Form Header */}
            <div className="border-b p-6 bg-white/60 border-gray-200 dark:bg-gray-900/30 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-xl">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">ط¥ظ†ط´ط§ط، ط¨ط« ط¬ط¯ظٹط¯</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    ط¥ط¹ط¯ط§ط¯ ط¨ط« ظ…ط¨ط§ط´ط± ط¬ط¯ظٹط¯ ظ„ظ„ظ…ط²ط§ط¯ط§طھ ط£ظˆ ط§ظ„ط¹ط±ظˆط¶
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <BroadcastForm />
            </div>
          </div>
        </div>

        {/* Quick Actions & Info Section */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border p-6 shadow-sm bg-white/70 border-gray-200 dark:bg-gray-900/40 dark:border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold">ط¥ط¬ط±ط§ط،ط§طھ ط³ط±ظٹط¹ط©</h3>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                className={cn(
                  "w-full rounded-xl py-3 px-4 text-right flex items-center justify-between transition-all duration-200 border",
                  "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
                  "dark:bg-gradient-to-r dark:from-purple-500/10 dark:to-pink-600/10 dark:text-purple-300 dark:border-purple-500/20 dark:hover:bg-purple-500/20 dark:hover:text-white"
                )}
              >
                <span>ط§ظ„ط¨ط«ظˆط« ط§ظ„ظ†ط´ط·ط©</span>
                <Radio className="w-4 h-4" />
              </button>

              <button
                type="button"
                className={cn(
                  "w-full rounded-xl py-3 px-4 text-right flex items-center justify-between transition-all duration-200 border",
                  "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100",
                  "dark:bg-gradient-to-r dark:from-amber-500/10 dark:to-orange-600/10 dark:text-amber-300 dark:border-amber-500/20 dark:hover:bg-amber-500/20 dark:hover:text-white"
                )}
              >
                <span>ط§ظ„ط¬ط¯ط§ظˆظ„ ط§ظ„ط²ظ…ظ†ظٹط©</span>
                <Calendar className="w-4 h-4" />
              </button>

              <button
                type="button"
                className={cn(
                  "w-full rounded-xl py-3 px-4 text-right flex items-center justify-between transition-all duration-200 border",
                  "bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100",
                  "dark:bg-gradient-to-r dark:from-cyan-500/10 dark:to-blue-600/10 dark:text-cyan-300 dark:border-cyan-500/20 dark:hover:bg-cyan-500/20 dark:hover:text-white"
                )}
              >
                <span>ط¥ط­طµط§ط¦ظٹط§طھ ط§ظ„ظ…ط´ط§ظ‡ط¯ظٹظ†</span>
                <Users className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="rounded-2xl border p-6 shadow-sm bg-white/70 border-gray-200 dark:bg-gray-900/40 dark:border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold">ط­ط§ظ„ط© ط§ظ„ظ†ط¸ط§ظ…</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">ط®ظˆط§ط¯ظ… ط§ظ„ط¨ط«</span>
                <span className="text-emerald-700 dark:text-green-400 flex items-center">
                  <div className="w-2 h-2 bg-emerald-600 dark:bg-green-400 rounded-full ml-2"></div>
                  ظ†ط´ط·ط©
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">ط¬ظˆط¯ط© ط§ظ„ط¨ط«</span>
                <span className="text-emerald-700 dark:text-green-400">ظ…ظ…طھط§ط²ط©</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">ط§ظ„ط¥طھطµط§ظ„</span>
                <span className="text-emerald-700 dark:text-green-400">ظ…ط³طھظ‚ط±</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">ط§ظ„ظ…ظ‡ظ„ط©</span>
                <span className="text-amber-700 dark:text-amber-400">ظ…ظ†ط®ظپط¶ط©</span>
              </div>
            </div>
          </div>

          {/* Tips & Guidelines */}
          <div className="rounded-2xl border p-6 shadow-sm bg-white/70 border-gray-200 dark:bg-gray-900/40 dark:border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-lg font-semibold">ظ†طµط§ط¦ط­ ظ…ظ‡ظ…ط©</h3>
            </div>

            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>طھط£ظƒط¯ ظ…ظ† ط¬ظˆط¯ط© ط§ظ„ط¥ظ†طھط±ظ†طھ ظ‚ط¨ظ„ ط§ظ„ط¨ط¯ط، ط¨ط§ظ„ط¨ط«</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>ط§ط®طھط± ظˆظ‚طھط§ظ‹ ظ…ظ†ط§ط³ط¨ط§ظ‹ ظ„ط¬ظ…ظ‡ظˆط±ظƒ ط§ظ„ظ…ط³طھظ‡ط¯ظپ</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>ط¬ظ‡ط² ظ…ط­طھظˆظ‰ ط§ظ„ط¨ط« ظ…ط³ط¨ظ‚ط§ظ‹ ظ„طھط¬ظ†ط¨ ط§ظ„ط£ط®ط·ط§ط،</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>ط§ط®طھط¨ط± ط§ظ„ط¨ط« ظ‚ط¨ظ„ ط§ظ„ط¨ط¯ط، ط¨ط§ظ„ط¨ط« ط§ظ„ظ…ط¨ط§ط´ط±</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Broadcast Management - Full Width */}
      <div className="mt-8">
        <div className="rounded-2xl border shadow-sm overflow-hidden bg-white/70 border-gray-200 dark:bg-gray-900/40 dark:border-white/10">
          <div className="border-b p-6 bg-white/60 border-gray-200 dark:bg-gray-900/30 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-xl">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">ط¥ط¯ط§ط±ط© ط§ظ„ط¨ط«ظˆط«</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  ط¹ط±ط¶ ظˆط¥ط¯ط§ط±ط© ط¬ظ…ظٹط¹ ط§ظ„ط¨ط«ظˆط« ط§ظ„ظ…ط¨ط§ط´ط±ط© ظˆط§ظ„ظ…ط¬ط¯ظˆظ„ط©
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <UnifiedBroadcastManagement role="admin" />
          </div>
        </div>
      </div>
    </div>
  );
}
