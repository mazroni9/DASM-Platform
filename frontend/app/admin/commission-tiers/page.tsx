"use client";
import { useEffect, useMemo, useState } from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { commissionTierService } from "@/services/commission-tier-service";
import { formatCurrency } from "@/utils/formatCurrency";
import { 
    Eye, 
    Pencil, 
    RefreshCw, 
    Search, 
    Trash2, 
    Filter,
    Plus,
    Download,
    TrendingUp,
    Percent,
    Layers,
    Shield,
    ChevronDown,
    MoreVertical,
    AlertTriangle,
    CheckCircle,
    XCircle
} from "lucide-react";
import { PriceWithIcon } from "@/components/ui/priceWithIcon";

export default function Page() {
  const r = useLoadingRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [progressiveFilter, setProgressiveFilter] = useState("all");
  const [confirm, setConfirm] = useState<any>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await commissionTierService.list();
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let x = [...rows];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      x = x.filter((t) => (t.name || "").toLowerCase().includes(s));
    }
    if (activeFilter !== "all") {
      const isActive = activeFilter === "active";
      x = x.filter((t) => !!t.isActive === isActive);
    }
    if (progressiveFilter !== "all") {
      const isProg = progressiveFilter === "yes";
      x = x.filter((t) => !!t.isProgressive === isProg);
    }
    return x;
  }, [rows, searchTerm, activeFilter, progressiveFilter]);

  const onDelete = (row: any) => setConfirm(row);

  const doDelete = async () => {
    if (!confirm) return;
    await commissionTierService.remove(confirm.id);
    setConfirm(null);
    load();
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter(t => t.isActive).length;
    const progressive = rows.filter(t => t.isProgressive).length;
    const averageCommission = rows.length > 0 
      ? rows.reduce((sum, t) => sum + (t.commissionAmount || 0), 0) / rows.length 
      : 0;

    return { total, active, progressive, averageCommission };
  }, [rows]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            إدارة فئات العمولة
          </h1>
          <p className="text-muted-foreground mt-2">
            إدارة وتنظيم فئات العمولة والرسوم في النظام
          </p>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <Button 
            onClick={load} 
            variant="outline" 
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => r.push("/admin/commission-tiers/create")}
            size="sm"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة فئة جديدة
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">إجمالي الفئات</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <Layers className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">الفئات النشطة</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.active}</p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">الفئات التدريجية</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.progressive}</p>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">متوسط العمولة</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(stats.averageCommission, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-purple-500/10 p-3 rounded-xl">
              <Percent className="w-6 h-6 text-purple-400" />
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
              placeholder="ابحث باسم الفئة..."
              className="pr-12 w-full bg-background border-border text-foreground placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="p-2 border border-border rounded-lg bg-background text-foreground text-sm"
            >
              <option value="all">كل الحالات</option>
              <option value="active">مفعلة</option>
              <option value="inactive">معطلة</option>
            </select>

            <select
              value={progressiveFilter}
              onChange={(e) => setProgressiveFilter(e.target.value)}
              className="p-2 border border-border rounded-lg bg-background text-foreground text-sm"
            >
              <option value="all">كل الأنواع</option>
              <option value="yes">تدريجية</option>
              <option value="no">غير تدريجية</option>
            </select>

            <Button 
              variant="outline" 
              size="sm"
            >
              <Filter className="w-4 h-4 ml-2" />
              المزيد من الفلاتر
              <ChevronDown className="w-4 h-4 mr-2" />
            </Button>

            <Button 
              variant="outline" 
              size="sm"
            >
              <Download className="w-4 h-4 ml-2" />
              تصدير التقرير
            </Button>
          </div>
        </div>
      </div>

      {/* Commission Tiers Table */}
      <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">
              قائمة فئات العمولة ({filtered.length})
            </h2>
            <div className="text-sm text-muted-foreground">
              إجمالي {rows.length} فئة
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">اسم الفئة</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">من سعر</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">إلى سعر</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">العمولة</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">النوع</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length > 0 ? (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-muted/50 transition-colors duration-200 group"
                  >
                    {/* Tier Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="bg-primary p-2 rounded-xl">
                          <Percent className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-foreground">
                            {t.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ID: {t.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Min Price */}
                    <td className="px-6 py-4 text-sm text-foreground">
                      <PriceWithIcon 
                        price={t.minPrice}
                      />
                    </td>

                    {/* Max Price */}
                    <td className="px-6 py-4 text-sm text-foreground">
                      <PriceWithIcon
                        price={t.maxPrice}
                      />
                    </td>

                    {/* Commission Amount */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-cyan-400">
                        <PriceWithIcon
                          price={t.commissionAmount}
                        />
                      </div>
                    </td>

                    {/* Progressive Type */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        t.isProgressive 
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {t.isProgressive ? (
                          <>
                            <TrendingUp className="w-3 h-3 ml-1" />
                            تدريجية
                          </>
                        ) : (
                          <>
                            <Layers className="w-3 h-3 ml-1" />
                            غير تدريجية
                          </>
                        )}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        t.isActive 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {t.isActive ? (
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
                          onClick={() => r.push(`/admin/commission-tiers/view/${t.id}`)}
                        >
                          <Eye size={16}/>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => r.push(`/admin/commission-tiers/edit/${t.id}`)}
                        >
                          <Pencil size={16}/>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onDelete(t)}
                        >
                          <Trash2 size={16}/>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                        >
                          <MoreVertical size={16}/>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Layers className="w-16 h-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-lg mb-2">
                        {searchTerm || activeFilter !== "all" || progressiveFilter !== "all"
                          ? "لا توجد نتائج مطابقة للبحث"
                          : "لا توجد فئات عمولة مسجلة"
                        }
                      </p>
                      <p className="text-muted-foreground text-sm mb-6">
                        {!searchTerm && activeFilter === "all" && progressiveFilter === "all" && 
                         "ابدأ بإضافة فئات عمولة جديدة إلى النظام"}
                      </p>
                      {!searchTerm && activeFilter === "all" && progressiveFilter === "all" && (
                        <Button 
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          onClick={() => r.push("/admin/commission-tiers/create")}
                        >
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة فئة جديدة
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                <h2 className="text-lg font-semibold text-foreground">تأكيد الحذف</h2>
                <p className="text-muted-foreground text-sm">هل أنت متأكد من حذف هذه الفئة؟</p>
              </div>
            </div>
            
            <div className="bg-muted rounded-xl p-4 mb-6">
              <div className="text-foreground font-medium">{confirm.name}</div>
              <div className="text-muted-foreground text-sm mt-1">
                العمولة: {formatCurrency(confirm.commissionAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="flex justify-end space-x-3 space-x-reverse">
              <Button 
                variant="outline" 
                onClick={() => setConfirm(null)}
              >
                إلغاء
              </Button>
              <Button 
                variant="destructive" 
                onClick={doDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف الفئة
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}