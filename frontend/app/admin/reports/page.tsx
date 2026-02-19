"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Car,
  Download,
  FileText,
  Filter,
  Loader2,
  MoreVertical,
  Target,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";

/** =========================
 * Types (ط­ط³ط¨ ط§ظ„ظ€ response ط§ظ„ظ„ظٹ ط¨ط¹طھظ‡)
 * ========================= */
type AuctionStatus = "live" | "ended" | "pending" | string;

interface DashboardCar {
  id: number;
  make: string;
  model: string;
  year: number;
  auction_status: string;
}

interface RecentAuction {
  id: number;
  car_id: number;
  status: AuctionStatus;
  auction_type: string;
  created_at: string;
  time_remaining: number;
  status_label: string;
  current_price: number;
  starting_bid: number;
  car: DashboardCar;
}

interface RecentUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  type: "user" | "admin" | "venue_owner" | string;
  status: "active" | "pending" | string;
  is_active: boolean;
  created_at: string;
}

interface TodayStats {
  new_users_today: number;
  new_auctions_today: number;
  bids_today: number;
}

interface DashboardData {
  total_users: number;
  active_users: number;
  pending_users: number;

  dealers_count: number;
  regular_users_count: number;

  total_auctions: number;
  active_auctions: number;
  completed_auctions: number;
  ended_auctions: number;
  pending_auctions: number;
  failed_auctions: number;

  pending_verifications: number;

  total_blogs: number;
  published_blogs: number;
  draft_blogs: number;

  total_cars: number;
  cars_in_auction: number;
  sold_cars: number;

  cached_at: string;

  popular_blogs: any[];
  recent_auctions: RecentAuction[];
  recent_users: RecentUser[];

  today: TodayStats;
}

interface DashboardApiResponse {
  success: boolean;
  data: DashboardData;
}

type ActivityType = "auction" | "user" | "system";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  status: "success" | "warning" | "info" | "error";
}

const classNames = (...xs: Array<string | false | undefined | null>) =>
  xs.filter(Boolean).join(" ");

/** =========================
 * Helpers
 * ========================= */
function safeNumber(n: any, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function formatDateTimeAR(dateISO: string) {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return "â€”";
  return d.toLocaleString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeAR(dateISO: string) {
  const d = new Date(dateISO);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime(); // past => negative
  if (Number.isNaN(d.getTime())) return "â€”";

  const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
  const diffSec = Math.round(diffMs / 1000);

  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(Math.round(diffSec), "second");

  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");

  const diffHr = Math.round(diffSec / 3600);
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");

  const diffDay = Math.round(diffSec / 86400);
  return rtf.format(diffDay, "day");
}

function badgeByStatus(status: ActivityItem["status"]) {
  switch (status) {
    case "success":
      return "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/10";
    case "warning":
      return "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/10";
    case "error":
      return "text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-500/10";
    case "info":
    default:
      return "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-500/10";
  }
}

function iconByType(type: ActivityType) {
  switch (type) {
    case "auction":
      return Car;
    case "user":
      return Users;
    default:
      return Activity;
  }
}

function auctionActivityStatus(a: RecentAuction): ActivityItem["status"] {
  if (a.status === "live") return "success";
  if (a.status === "ended") return "warning";
  if (a.status === "pending") return "info";
  return "info";
}

function userActivityStatus(u: RecentUser): ActivityItem["status"] {
  if (u.status === "active") return "success";
  if (u.status === "pending") return "warning";
  return "info";
}

/** =========================
 * UI Components
 * ========================= */
function StatCard(props: {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon: React.ElementType;
  accent?: "blue" | "purple" | "green" | "amber" | "rose";
  menu?: boolean;
}) {
  const { title, value, subtitle, icon: Icon, accent = "blue", menu } = props;

  const accentMap = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-300",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
  } as const;

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-sm p-6 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-gray-900/40">
      <div className="mb-4 flex items-center justify-between">
        <div className={classNames("rounded-xl p-3", accentMap[accent])}>
          <Icon className="h-6 w-6" />
        </div>
        {menu ? (
          <button
            type="button"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200"
            aria-label="menu"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </div>
        {subtitle ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** =========================
 * Page
 * ========================= */
export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const successRate = useMemo(() => {
    if (!dashboard) return 0;
    const total = safeNumber(dashboard.total_auctions);
    const completed = safeNumber(dashboard.completed_auctions);
    if (!total) return 0;
    return Math.round((completed / total) * 1000) / 10; // 1 decimal
  }, [dashboard]);

  useEffect(() => {
    void fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  async function fetchDashboard() {
    try {
      setLoading(true);

      const res = await api.get<DashboardApiResponse>("/api/admin/dashboard", {
        params: { range: dateRange },
      });

      if (!res?.data) throw new Error("No response data");

      const payload = res.data as DashboardApiResponse;

      if (!payload.success || !payload.data) {
        throw new Error("Unexpected API shape");
      }

      setDashboard(payload.data);

      // Build activities ظ…ظ† recent_auctions ظˆ recent_users
      const acts: ActivityItem[] = [];

      for (const a of payload.data.recent_auctions?.slice(0, 8) ?? []) {
        acts.push({
          id: `auction-${a.id}`,
          type: "auction",
          title: `ظ…ط²ط§ط¯ #${a.id} (${a.status_label || a.status})`,
          description: `${a.car?.make ?? "â€”"} - ${a.car?.model ?? "â€”"} (${a.car?.year ?? "â€”"})`,
          timestamp: formatRelativeAR(a.created_at),
          status: auctionActivityStatus(a),
        });
      }

      for (const u of payload.data.recent_users?.slice(0, 8) ?? []) {
        acts.push({
          id: `user-${u.id}`,
          type: "user",
          title: `ظ…ط³طھط®ط¯ظ… ط¬ط¯ظٹط¯: ${u.first_name} ${u.last_name}`,
          description: `${u.email} â€¢ ${u.type} â€¢ ${u.status}`,
          timestamp: formatRelativeAR(u.created_at),
          status: userActivityStatus(u),
        });
      }

      // Sort: ط§ظ„ط£ط­ط¯ط« ط£ظˆظ„ط§ظ‹ (ط­ط³ط¨ ط§ظ„طھط§ط±ظٹط® ط§ظ„ط­ظ‚ظٹظ‚ظٹ ظ…ط´ ط§ظ„ظ€ timestamp ط§ظ„ظ†طµظٹ)
      acts.sort((x, y) => {
        const dx = x.id.startsWith("auction-")
          ? new Date(payload.data.recent_auctions.find(a => `auction-${a.id}` === x.id)?.created_at ?? 0).getTime()
          : new Date(payload.data.recent_users.find(u => `user-${u.id}` === x.id)?.created_at ?? 0).getTime();

        const dy = y.id.startsWith("auction-")
          ? new Date(payload.data.recent_auctions.find(a => `auction-${a.id}` === y.id)?.created_at ?? 0).getTime()
          : new Date(payload.data.recent_users.find(u => `user-${u.id}` === y.id)?.created_at ?? 0).getTime();

        return dy - dx;
      });

      setRecentActivities(acts.slice(0, 10));
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ظ„ظˆط­ط© ط§ظ„طھظ‚ط§ط±ظٹط±");
      setDashboard(null);
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  }

  function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportReport(format: "PDF" | "Excel" | "CSV" | "JSON") {
    try {
      setExportLoading(format);

      if (!dashboard) {
        toast.error("ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ„ظ„طھطµط¯ظٹط±");
        return;
      }

      if (format === "JSON") {
        downloadTextFile(
          `dashboard_${new Date().toISOString().slice(0, 10)}.json`,
          JSON.stringify(dashboard, null, 2),
          "application/json;charset=utf-8"
        );
        toast.success("طھظ… طھطµط¯ظٹط± JSON ط¨ظ†ط¬ط§ط­");
        return;
      }

      if (format === "CSV" || format === "Excel") {
        // CSV ط¨ط³ظٹط· (Excel ظٹظپطھط­ظ‡ ط¹ط§ط¯ظٹ)
        const rows: Array<[string, string | number]> = [
          ["total_users", dashboard.total_users],
          ["active_users", dashboard.active_users],
          ["pending_users", dashboard.pending_users],
          ["total_auctions", dashboard.total_auctions],
          ["active_auctions", dashboard.active_auctions],
          ["completed_auctions", dashboard.completed_auctions],
          ["failed_auctions", dashboard.failed_auctions],
          ["total_cars", dashboard.total_cars],
          ["cars_in_auction", dashboard.cars_in_auction],
          ["sold_cars", dashboard.sold_cars],
          ["new_users_today", dashboard.today?.new_users_today ?? 0],
          ["new_auctions_today", dashboard.today?.new_auctions_today ?? 0],
          ["bids_today", dashboard.today?.bids_today ?? 0],
          ["cached_at", dashboard.cached_at],
        ];

        const csv = [
          "key,value",
          ...rows.map(([k, v]) => `${k},${String(v).replaceAll(",", " ")}`),
          "",
          "recent_auctions",
          "auction_id,car_id,status,make,model,year,created_at",
          ...(dashboard.recent_auctions ?? []).map((a) =>
            [
              a.id,
              a.car_id,
              a.status,
              a.car?.make ?? "",
              a.car?.model ?? "",
              a.car?.year ?? "",
              a.created_at,
            ]
              .map((x) => `"${String(x).replaceAll('"', '""')}"`)
              .join(",")
          ),
          "",
          "recent_users",
          "user_id,first_name,last_name,email,type,status,created_at",
          ...(dashboard.recent_users ?? []).map((u) =>
            [
              u.id,
              u.first_name,
              u.last_name,
              u.email,
              u.type,
              u.status,
              u.created_at,
            ]
              .map((x) => `"${String(x).replaceAll('"', '""')}"`)
              .join(",")
          ),
        ].join("\n");

        const filename =
          format === "Excel"
            ? `dashboard_${new Date().toISOString().slice(0, 10)}.csv`
            : `dashboard_${new Date().toISOString().slice(0, 10)}.csv`;

        downloadTextFile(filename, csv, "text/csv;charset=utf-8");
        toast.success(`طھظ… طھطµط¯ظٹط± ${format} ط¨ظ†ط¬ط§ط­`);
        return;
      }

      // PDF placeholder (ط¨ط¯ظˆظ† ظ…ظƒطھط¨ط§طھ ط¥ط¶ط§ظپظٹط©)
      toast("طھطµط¯ظٹط± PDF ط؛ظٹط± ظ…طھط§ط­ ط­ط§ظ„ظٹط§ظ‹ ط¨ط¯ظˆظ† ط¥ط¹ط¯ط§ط¯ Backend ط£ظˆ ظ…ظƒطھط¨ط© طھظˆظ„ظٹط¯ PDF", {
        icon: "â„¹ï¸ڈ",
      });
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("ظپط´ظ„ ظپظٹ طھطµط¯ظٹط± ط§ظ„طھظ‚ط±ظٹط±");
    } finally {
      setExportLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-500" />
          <p className="text-lg text-gray-600 dark:text-gray-300">ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„طھظ‚ط§ط±ظٹط±...</p>
        </div>
      </div>
    );
  }

  const lastUpdated = dashboard?.cached_at ? formatDateTimeAR(dashboard.cached_at) : "â€”";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 dark:from-gray-950 dark:to-gray-900" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              ط§ظ„طھظ‚ط§ط±ظٹط± ظˆط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ
            </h1>
            <div className="flex flex-col gap-1 text-gray-500 dark:text-gray-400">
              <p>طھط­ظ„ظٹظ„ط§طھ ظˆط¥ط­طµط§ط¦ظٹط§طھ ظ…ط¨ط§ط´ط±ط© ظ…ظ† ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…</p>
              <p className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                ط¢ط®ط± طھط­ط¯ظٹط«: <span className="font-medium text-gray-700 dark:text-gray-300">{lastUpdated}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-gray-900/60 dark:text-white"
              >
                <option value="7">ط¢ط®ط± 7 ط£ظٹط§ظ…</option>
                <option value="30">ط¢ط®ط± 30 ظٹظˆظ…</option>
                <option value="90">ط¢ط®ط± 3 ط£ط´ظ‡ط±</option>
                <option value="365">ط¢ط®ط± ط³ظ†ط©</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => fetchDashboard()}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 dark:border-white/10 dark:bg-gray-900/60 dark:text-gray-100 dark:hover:bg-white/5"
            >
              طھط­ط¯ظٹط«
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†"
            value={dashboard?.total_users ?? 0}
            subtitle={
              <span className="inline-flex items-center gap-2">
                <span>ظ†ط´ط·: {dashboard?.active_users ?? 0}</span>
                <span className="text-gray-300 dark:text-gray-700">â€¢</span>
                <span>ظ…ط¹ظ„ظ‘ظ‚: {dashboard?.pending_users ?? 0}</span>
              </span>
            }
            icon={Users}
            accent="green"
            menu
          />

          <StatCard
            title="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط²ط§ط¯ط§طھ"
            value={dashboard?.total_auctions ?? 0}
            subtitle={
              <span className="inline-flex items-center gap-2">
                <span>ظ†ط´ط·: {dashboard?.active_auctions ?? 0}</span>
                <span className="text-gray-300 dark:text-gray-700">â€¢</span>
                <span>ظ…ظƒطھظ…ظ„: {dashboard?.completed_auctions ?? 0}</span>
              </span>
            }
            icon={Car}
            accent="purple"
            menu
          />

          <StatCard
            title="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط³ظٹط§ط±ط§طھ"
            value={dashboard?.total_cars ?? 0}
            subtitle={
              <span className="inline-flex items-center gap-2">
                <span>ط¯ط§ط®ظ„ ظ…ط²ط§ط¯: {dashboard?.cars_in_auction ?? 0}</span>
                <span className="text-gray-300 dark:text-gray-700">â€¢</span>
                <span>ظ…ط¨ط§ط¹ط©: {dashboard?.sold_cars ?? 0}</span>
              </span>
            }
            icon={Car}
            accent="blue"
            menu
          />

          <StatCard
            title="ظ…ط¹ط¯ظ„ ظ†ط¬ط§ط­ ط§ظ„ظ…ط²ط§ط¯ط§طھ"
            value={`${successRate}%`}
            subtitle={
              <span className="inline-flex items-center gap-2">
                {successRate >= 50 ? (
                  <>
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-300">
                      ط£ط¯ط§ط، ط¬ظٹط¯ ط¨ظ†ط§ط،ظ‹ ط¹ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ط§طھ ط§ظ„ظ…ظƒطھظ…ظ„ط©
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-700 dark:text-amber-300">
                      ظٹط­طھط§ط¬ طھط­ط³ظٹظ† (ط§ظ„ظ…ظƒطھظ…ظ„ ظ‚ظ„ظٹظ„)
                    </span>
                  </>
                )}
              </span>
            }
            icon={Target}
            accent="amber"
            menu
          />
        </div>

        {/* Today Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            title="ظ…ط³طھط®ط¯ظ…ظٹظ† ط¬ط¯ط¯ ط§ظ„ظٹظˆظ…"
            value={dashboard?.today?.new_users_today ?? 0}
            subtitle="ط­ط³ط¨ ط¥ط­طµط§ط¦ظٹط§طھ ط§ظ„ظٹظˆظ…"
            icon={Users}
            accent="green"
          />
          <StatCard
            title="ظ…ط²ط§ط¯ط§طھ ط¬ط¯ظٹط¯ط© ط§ظ„ظٹظˆظ…"
            value={dashboard?.today?.new_auctions_today ?? 0}
            subtitle="ط­ط³ط¨ ط¥ط­طµط§ط¦ظٹط§طھ ط§ظ„ظٹظˆظ…"
            icon={Car}
            accent="purple"
          />
          <StatCard
            title="ظ…ط²ط§ظٹط¯ط§طھ ط§ظ„ظٹظˆظ…"
            value={dashboard?.today?.bids_today ?? 0}
            subtitle="ط­ط³ط¨ ط¥ط­طµط§ط¦ظٹط§طھ ط§ظ„ظٹظˆظ…"
            icon={Activity}
            accent="blue"
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-sm shadow-sm dark:border-white/10 dark:bg-gray-900/40">
          <div className="border-b border-gray-200/70 p-6 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                  ط§ظ„ظ†ط´ط§ط· ط§ظ„ط£ط®ظٹط±
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ط¢ط®ط± ط§ظ„ط£ط­ط¯ط§ط« ظ…ظ† (ط§ظ„ظ…ط²ط§ط¯ط§طھ + ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†)
                </p>
              </div>
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
          </div>

          <div className="p-6">
            {recentActivities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-gray-500 dark:border-white/10 dark:text-gray-400">
                ظ„ط§ ظٹظˆط¬ط¯ ظ†ط´ط§ط·ط§طھ ط­ط¯ظٹط«ط© ظ„ط¹ط±ط¶ظ‡ط§
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = iconByType(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 rounded-xl border border-gray-200/60 bg-white p-4 transition hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950/20 dark:hover:bg-white/5"
                    >
                      <div className={classNames("rounded-lg p-2", badgeByStatus(activity.status))}>
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="mb-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </h4>
                        <p className="mb-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                          {activity.description}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {activity.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Export Options */}
        <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-sm p-6 shadow-sm dark:border-white/10 dark:bg-gray-900/40">
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            طھطµط¯ظٹط± ط§ظ„طھظ‚ط§ط±ظٹط±
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            طھطµط¯ظٹط± ط³ط±ظٹط¹ ظ…ظ† ط¬ظ‡ط© ط§ظ„ط¹ظ…ظٹظ„ (CSV/JSON). PDF ظٹط­طھط§ط¬ ط¥ط¹ط¯ط§ط¯ ط¥ط¶ط§ظپظٹ.
          </p>

          <div className="space-y-3">
            {[
              { format: "CSV" as const, label: "طھطµط¯ظٹط± CSV", icon: FileText, tone: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300" },
              { format: "Excel" as const, label: "طھطµط¯ظٹط± Excel (CSV)", icon: FileText, tone: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300" },
              { format: "JSON" as const, label: "طھطµط¯ظٹط± JSON", icon: FileText, tone: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300" },
              { format: "PDF" as const, label: "طھطµط¯ظٹط± PDF (ظ‚ط±ظٹط¨ط§ظ‹)", icon: FileText, tone: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300" },
            ].map((item) => {
              const Icon = item.icon;
              const isBusy = exportLoading === item.format;
              return (
                <button
                  key={item.format}
                  type="button"
                  onClick={() => exportReport(item.format)}
                  disabled={isBusy}
                  className={classNames(
                    "w-full rounded-xl border p-4 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
                    item.tone
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {isBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
