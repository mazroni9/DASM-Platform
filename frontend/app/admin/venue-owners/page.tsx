"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Building,
  Calendar,
  Mail,
  Hash,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  Download,
  Loader2,
  ArrowUpDown,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Switch from "@mui/material/Switch";
import Pagination from "@components/Pagination";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import { toast } from "react-hot-toast";

/** Types coming from backend */
type VenueStatus = "pending" | "active" | "rejected" | string;

interface VenueUser {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  is_active?: boolean;
  status?: string;
  created_at?: string | null;
}

interface VenueOwner {
  id: number;
  user_id: number | null;
  venue_name?: string | null;
  commercial_registry?: string | null;
  status?: VenueStatus;
  is_active?: boolean;
  rating?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
  address?: string | null;
  commission_value?: string | number | null;
  commission_currency?: string | null;

  // موجود في response: user object
  user?: VenueUser | null;

  // قد يكون غير موجود في بعض الـ endpoints
  venue_cars_count?: number;
}

/** ✅ Pagination payload زي اللي في الـ response */
interface PaginationPayload<T> {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
  last_page: number;

  // optional fields (مش محتاجينها بس موجودة)
  from?: number | null;
  to?: number | null;
  path?: string;
  first_page_url?: string;
  last_page_url?: string;
}

interface BackendResponse<T> {
  status: "success" | "error";
  data: PaginationPayload<T>;
  message?: string;
}

const ToggleSwitch = ({
  checked,
  disabled = true, // للعرض فقط حالياً
}: {
  checked: boolean;
  disabled?: boolean;
}) => (
  <Switch
    checked={!!checked}
    onChange={() => {}}
    disabled={disabled}
    color="primary"
    size="small"
    sx={{
      "& .MuiSwitch-switchBase.Mui-checked": { color: "#22d3ee" },
      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
        backgroundColor: "#22d3ee",
      },
    }}
  />
);

function formatDateAr(dateString?: string | null) {
  if (!dateString) return "غير متوفر";
  const d = new Date(dateString.replace(" ", "T"));
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * نفس منطق صفحة التفاصيل:
 * - is_active = true  → مفعل (أخضر)
 * - is_active = false + status = rejected → مرفوض (أحمر)
 * - غير ذلك → في الانتظار (برتقالي)
 */
function getStatusMeta(status?: VenueStatus, isActive?: boolean) {
  if (isActive) {
    return {
      label: "مفعل",
      classes: "bg-green-500/20 text-green-400 border-green-500/30",
      Icon: CheckCircle,
    };
  }

  if (status === "rejected") {
    return {
      label: "مرفوض",
      classes: "bg-red-500/20 text-red-400 border-red-500/30",
      Icon: XCircle,
    };
  }

  return {
    label: "في الانتظار",
    classes: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Icon: Clock,
  };
}

export default function VenueOwnersAdminPage() {
  // Server-side data
  const [owners, setOwners] = useState<VenueOwner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Query params
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all|pending|active|rejected
  const [activeFilter, setActiveFilter] = useState<string>("all"); // all|1|0
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(15);
  const [lastPage, setLastPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const canSort = useMemo(
    () => [
      { key: "id", label: "المعرف" },
      { key: "venue_name", label: "اسم المعرض" },
      { key: "status", label: "الحالة" },
      { key: "is_active", label: "التفعيل" },
      { key: "created_at", label: "تاريخ الإنشاء" },
      { key: "updated_at", label: "آخر تحديث" },
    ],
    []
  );

  /** ✅ normalize: يدعم الشكل اللي بعته */
  const normalizeOwnersResponse = (raw: any): PaginationPayload<VenueOwner> | null => {
    // الشكل الأساسي
    if (raw?.status === "success" && raw?.data && Array.isArray(raw.data.data)) {
      return raw.data as PaginationPayload<VenueOwner>;
    }

    // أحياناً axios بيرجع raw.data = {status,data...}
    if (raw?.data?.status === "success" && raw?.data?.data && Array.isArray(raw.data.data.data)) {
      return raw.data.data as PaginationPayload<VenueOwner>;
    }

    return null;
  };

  async function fetchOwners(options?: { silent?: boolean; page?: number }) {
    const targetPage = options?.page ?? page;

    try {
      if (!options?.silent) setLoading(true);
      else setRefreshing(true);

      const params: Record<string, any> = {
        page: targetPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_dir: sortDir,
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      if (activeFilter !== "all") params.is_active = activeFilter;

      const res = await api.get<BackendResponse<VenueOwner>>("/api/admin/venue-owners", { params });

      const payload = normalizeOwnersResponse(res.data);

      if (!payload) {
        console.error("❌ Unexpected response shape:", res.data);
        toast.error("صيغة بيانات غير متوقعة من السيرفر");
        setOwners([]);
        setLastPage(1);
        setTotalCount(0);
        return;
      }

      const rows = Array.isArray(payload.data) ? payload.data : [];
      setOwners(rows);
      setLastPage(payload.last_page ?? 1);
      setTotalCount(payload.total ?? rows.length);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "فشل في تحميل بيانات ملاك المعارض");
      setOwners([]);
      setLastPage(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOwners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, sortBy, sortDir, statusFilter, activeFilter]);

  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setPage(1);
      fetchOwners({ page: 1 });
    }
  };

  const handleClearSearch = () => {
    setSearch("");
    setPage(1);
    fetchOwners({ silent: true, page: 1 });
  };

  const toggleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const exportCsv = () => {
    try {
      const rows = owners;
      if (!rows || rows.length === 0) {
        toast("لا توجد بيانات للتصدير");
        return;
      }

      const headers = [
        "ID",
        "اسم المعرض",
        "السجل التجاري",
        "العنوان",
        "البريد الإلكتروني",
        "اسم المستخدم",
        "الحالة (مفعل/مرفوض/انتظار)",
        "مفعّل",
        "تاريخ الإنشاء",
      ];

      const csvLines = [
        headers.join(","),
        ...rows.map((r) => {
          const userNameRaw = r.user ? `${r.user.first_name} ${r.user.last_name}` : "";
          const userEmailRaw = r.user?.email ?? "";
          const statusMeta = getStatusMeta(r.status, r.is_active);

          return [
            r.id ?? "",
            (r.venue_name ?? "").toString().replace(/,/g, "،"),
            (r.commercial_registry ?? "").toString(),
            (r.address ?? "").toString().replace(/,/g, "،"),
            userEmailRaw.toString(),
            userNameRaw.toString().replace(/,/g, "،"),
            statusMeta.label,
            r.is_active ? "نعم" : "لا",
            r.created_at ?? "",
          ].join(",");
        }),
      ];

      const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      link.download = `venue-owners-${ts}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("تعذر تصدير CSV");
    }
  };

  const activeCount = useMemo(() => owners.filter((o) => o.is_active).length, [owners]);

  const pendingCount = useMemo(
    () => owners.filter((o) => !o.is_active && o.status !== "rejected").length,
    [owners]
  );

  const rejectedCount = useMemo(() => owners.filter((o) => o.status === "rejected").length, [owners]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">مُلّاك المعارض</h1>
          <p className="text-muted-foreground mt-2">إدارة وعرض قائمة أصحاب/مُلّاك المعارض</p>
        </div>

        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button onClick={() => fetchOwners({ silent: true })} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 ml-2 ${refreshing ? "animate-spin" : ""}`} />
            تحديث البيانات
          </Button>
          <Button onClick={exportCsv} variant="outline" size="sm">
            <Download className="w-4 h-4 ml-2" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">إجمالي المُلّاك</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalCount}</p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">الحالة: مفعّل</p>
              <p className="text-2xl font-bold text-foreground mt-1">{activeCount}</p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">في الانتظار</p>
              <p className="text-2xl font-bold text-foreground mt-1">{pendingCount}</p>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">المرفوضين</p>
              <p className="text-2xl font-bold text-foreground mt-1">{rejectedCount}</p>
            </div>
            <div className="bg-red-500/10 p-3 rounded-xl">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-lg mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="relative flex-grow">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="ابحث بالاسم، السجل التجاري، البريد الإلكتروني..."
              className="pr-12 w-full bg-background border-border text-foreground placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchEnter}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="p-2 border border-border rounded-lg bg-background text-foreground text-sm"
            >
              <option value="all">كل الحالات</option>
              <option value="pending">في الانتظار</option>
              <option value="active">Active (حسب status)</option>
              <option value="rejected">مرفوض</option>
            </select>

            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
              className="p-2 border border-border rounded-lg bg-background text-foreground text-sm"
            >
              <option value="all">التفعيل (الكل)</option>
              <option value="1">مفعّل</option>
              <option value="0">غير مفعّل</option>
            </select>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toggleSort(sortBy)} title="تبديل ترتيب الحقل الحالي">
                <ArrowUpDown className="w-4 h-4 ml-2" />
                ترتيب: {canSort.find((s) => s.key === sortBy)?.label ?? "المعرف"} ({sortDir})
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setActiveFilter("all");
                  setSortBy("id");
                  setSortDir("desc");
                  setPage(1);
                  fetchOwners({ silent: true, page: 1 });
                }}
              >
                <Filter className="w-4 h-4 ml-2" />
                تصفية سريعة
                <ChevronDown className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">قائمة مُلّاك المعارض</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!search) return;
                  setPage(1);
                  fetchOwners({ page: 1 });
                }}
              >
                <Search className="w-4 h-4 ml-2" />
                بحث
              </Button>
              {search && (
                <Button variant="ghost" size="sm" onClick={handleClearSearch}>
                  مسح البحث
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">المعرض</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">السجل التجاري</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">المستخدم</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">السيارات</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">التفعيل</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">تاريخ الإنشاء</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">إجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 inline-block animate-spin mr-2" />
                    جاري التحميل...
                  </td>
                </tr>
              ) : owners.length > 0 ? (
                owners.map((v) => {
                  const { label, classes, Icon } = getStatusMeta(v.status, v.is_active);

                  const userName = v.user ? `${v.user.first_name} ${v.user.last_name}` : "—";
                  const userEmail = v.user?.email ?? "—";
                  const carsCount = typeof v.venue_cars_count === "number" ? v.venue_cars_count : 0;

                  return (
                    <tr key={v.id} className="hover:bg-muted/50 transition-colors duration-200 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="bg-primary p-2 rounded-xl">
                            <Building className="w-4 h-4 text-primary-foreground" />
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-foreground">{v.venue_name || "—"}</div>
                            {v.address && (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{v.address}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground flex items-center">
                          <Hash className="w-3 h-3 ml-1 text-muted-foreground" />
                          {v.commercial_registry || "—"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>{userName}</div>
                        <div className="text-sm text-foreground/70 flex items-center">
                          <Mail className="w-3 h-3 ml-1 text-muted-foreground" />
                          {userEmail}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground flex items-center">
                          <Car className="w-3 h-3 ml-1 text-muted-foreground" />
                          {carsCount}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
                          <Icon className="w-3 h-3 ml-1" />
                          {label}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <ToggleSwitch checked={!!v.is_active} />
                      </td>

                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 ml-1" />
                          {formatDateAr(v.created_at)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Button asChild variant="ghost" size="sm" className="px-3">
                            <LoadingLink href={`/admin/venue-owners/${v.id}`}>
                              <Eye className="w-4 h-4" />
                            </LoadingLink>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p>لا توجد نتائج مطابقة</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-border">
          <Pagination totalPages={lastPage} page={page} onPageChange={(_, p) => setPage(p)} />
        </div>
      </div>
    </div>
  );
}
