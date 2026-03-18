"use client";
import { useEffect, useMemo, useState } from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscriptionPlanService } from "@/services/subscription-plan-service";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  Eye,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Plus,
  Filter,
  Download,
  Crown,
  Users,
  Calendar,
  DollarSign,
  Zap,
  ChevronDown,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";

export default function Page() {
  const r = useLoadingRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [confirm, setConfirm] = useState<any>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  const userTypes = {
    bidder: "مزايد",
    dealer: "تاجر",
    auctioneer: "مزاد",
    moderator: "منسق",
    admin: "مدير",
  };

  const load = async () => {
    try {
      setLoading(true);
      const params: { userType?: string; isActive?: string } = {};
      if (userTypeFilter !== "all") params.userType = userTypeFilter;
      if (activeFilter !== "all") params.isActive = activeFilter;

      const data = await subscriptionPlanService.list(params);
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userTypeFilter, activeFilter]);

  const filtered = useMemo(() => {
    let x = [...rows];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      x = x.filter((t) => (t.name || "").toLowerCase().includes(s));
    }
    return x;
  }, [rows, searchTerm]);

  const onDelete = (row: any) => setConfirm(row);

  const doDelete = async () => {
    if (!confirm) return;
    await subscriptionPlanService.remove(confirm.id);
    setConfirm(null);
    load();
  };

  const onToggleStatus = async (plan: any) => {
    setToggleLoading(plan.id);
    try {
      await subscriptionPlanService.toggleStatus(plan.id);
      load();
    } finally {
      setToggleLoading(null);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((t) => t.isActive).length;
    const totalRevenue = rows.reduce((sum, t) => sum + (t.price || 0), 0);
    const averagePrice = total > 0 ? totalRevenue / total : 0;

    return { total, active, totalRevenue, averagePrice };
  }, [rows]);

  return (
    <div className="min-h-screen bg-background text-foreground p-2">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            إدارة خطط الاشتراك
          </h1>
          <p className="text-muted-foreground mt-2">
            إدارة وتنظيم خطط الاشتراك والعضويات في النظام
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <Button onClick={load} variant="outline" size="sm">
            <RefreshCw
              className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`}
            />
            تحديث البيانات
          </Button>
          <Button
            variant="default"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => r.push("/admin/subscription-plans/create")}
            size="sm"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة خطة جديدة
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">إجمالي الخطط</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.total}
              </p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <Crown className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">الخطط النشطة</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.active}
              </p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-xl">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(stats.totalRevenue, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">متوسط السعر</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(stats.averagePrice, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="bg-purple-500/10 p-3 rounded-xl">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search Section */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-lg mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search Input */}
          <div className="relative flex-grow">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="ابحث باسم الخطة..."
              className="pr-12 w-full bg-background border-border text-foreground placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="p-2 border border-border rounded-lg bg-background text-foreground text-sm"
            >
              <option value="all">كل أنواع المستخدمين</option>
              {Object.entries(userTypes).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="p-2 border border-border rounded-lg bg-background text-foreground text-sm"
            >
              <option value="all">كل الحالات</option>
              <option value="active">مفعلة</option>
              <option value="inactive">معطلة</option>
            </select>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 ml-2" />
              المزيد من الفلاتر
              <ChevronDown className="w-4 h-4 mr-2" />
            </Button>

            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 ml-2" />
              تصدير التقرير
            </Button>
          </div>
        </div>
      </div>

      {/* Subscription Plans Table */}
      <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">
              قائمة خطط الاشتراك ({filtered.length})
            </h2>
            <div className="text-sm text-muted-foreground">
              إجمالي {rows.length} خطة
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">
                جاري تحميل خطط الاشتراك...
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                    الخطة
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                    نوع المستخدم
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                    السعر
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                    المدة
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                    السعر الشهري
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                    الحالة
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length > 0 ? (
                  filtered.map((plan) => (
                    <tr
                      key={plan.id}
                      className="hover:bg-muted/50 transition-colors duration-200 group"
                    >
                      {/* Plan Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="bg-primary text-primary-foreground p-2 rounded-xl">
                            <Crown className="w-4 h-4" />
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-foreground">
                              {plan.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              ID: {plan.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* User Type */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          <Users className="w-3 h-3 ml-1" />
                          {plan.userTypeText}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 text-sm font-semibold text-cyan-400">
                        {formatCurrency(plan.price, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* Duration */}
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-foreground">
                          <Calendar className="w-3 h-3 ml-1 text-muted-foreground" />
                          {plan.durationText}
                        </div>
                      </td>

                      {/* Monthly Price */}
                      <td className="px-6 py-4 text-sm font-semibold text-green-400">
                        {formatCurrency(plan.monthlyPrice, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            plan.isActive
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}
                        >
                          {plan.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 ml-1" />
                              مفعلة
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 ml-1" />
                              معطلة
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              r.push(
                                `/admin/subscription-plans/view/${plan.id}`,
                              )
                            }
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              r.push(
                                `/admin/subscription-plans/edit/${plan.id}`,
                              )
                            }
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={
                              plan.isActive
                                ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                : "text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            }
                            onClick={() => onToggleStatus(plan)}
                            disabled={toggleLoading === plan.id}
                          >
                            {toggleLoading === plan.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : plan.isActive ? (
                              <ToggleLeft size={16} />
                            ) : (
                              <ToggleRight size={16} />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => onDelete(plan)}
                          >
                            <Trash2 size={16} />
                          </Button>
                          <Button size="icon" variant="ghost">
                            <MoreVertical size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Crown className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-lg mb-2">
                          {searchTerm ||
                          userTypeFilter !== "all" ||
                          activeFilter !== "all"
                            ? "لا توجد نتائج مطابقة للبحث"
                            : "لا توجد خطط اشتراك مسجلة"}
                        </p>
                        <p className="text-muted-foreground text-sm mb-6">
                          {!searchTerm &&
                            userTypeFilter === "all" &&
                            activeFilter === "all" &&
                            "ابدأ بإضافة خطط اشتراك جديدة إلى النظام"}
                        </p>
                        {!searchTerm &&
                          userTypeFilter === "all" &&
                          activeFilter === "all" && (
                            <Button
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                              onClick={() =>
                                r.push("/admin/subscription-plans/create")
                              }
                            >
                              <Plus className="w-4 h-4 ml-2" />
                              إضافة خطة جديدة
                            </Button>
                          )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="bg-red-500/20 p-2 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  تأكيد الحذف
                </h2>
                <p className="text-muted-foreground text-sm">
                  هل أنت متأكد من حذف خطة الاشتراك هذه؟
                </p>
              </div>
            </div>

            <div className="bg-muted rounded-xl p-4 mb-6">
              <div className="text-foreground font-medium">{confirm.name}</div>
              <div className="text-muted-foreground text-sm mt-1">
                السعر:{" "}
                {formatCurrency(confirm.price, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-muted-foreground text-sm">
                النوع: {confirm.userTypeText}
              </div>
            </div>

            <div className="flex justify-end space-x-3 space-x-reverse">
              <Button variant="outline" onClick={() => setConfirm(null)}>
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={doDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف الخطة
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
