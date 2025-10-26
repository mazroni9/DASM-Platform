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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            إدارة فئات العمولة
          </h1>
          <p className="text-gray-400 mt-2">
            إدارة وتنظيم فئات العمولة والرسوم في النظام
          </p>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <Button 
            onClick={load} 
            variant="outline" 
            size="sm"
            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300"
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>
          <Button 
            variant="default" 
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
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
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">إجمالي الفئات</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <Layers className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">الفئات النشطة</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">الفئات التدريجية</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.progressive}</p>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">متوسط العمولة</p>
              <p className="text-2xl font-bold text-white mt-1">
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
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search Input */}
          <div className="relative flex-grow">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="ابحث باسم الفئة..."
              className="pr-12 w-full bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="p-2 border border-gray-600 rounded-lg bg-gray-700 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">كل الحالات</option>
              <option value="active">مفعلة</option>
              <option value="inactive">معطلة</option>
            </select>

            <select
              value={progressiveFilter}
              onChange={(e) => setProgressiveFilter(e.target.value)}
              className="p-2 border border-gray-600 rounded-lg bg-gray-700 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">كل الأنواع</option>
              <option value="yes">تدريجية</option>
              <option value="no">غير تدريجية</option>
            </select>

            <Button 
              variant="outline" 
              size="sm"
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              <Filter className="w-4 h-4 ml-2" />
              المزيد من الفلاتر
              <ChevronDown className="w-4 h-4 mr-2" />
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              <Download className="w-4 h-4 ml-2" />
              تصدير التقرير
            </Button>
          </div>
        </div>
      </div>

      {/* Commission Tiers Table */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">
              قائمة فئات العمولة ({filtered.length})
            </h2>
            <div className="text-sm text-gray-400">
              إجمالي {rows.length} فئة
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-750 border-b border-gray-700/50">
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">اسم الفئة</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">من سعر</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">إلى سعر</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">العمولة</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">النوع</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filtered.length > 0 ? (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-750/50 transition-colors duration-200 group"
                  >
                    {/* Tier Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl">
                          <Percent className="w-4 h-4 text-white" />
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-white">
                            {t.name}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            ID: {t.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Min Price */}
                    <td className="px-6 py-4 text-sm text-white">
                      <PriceWithIcon 
                        price={t.minPrice}
                      />
                    </td>

                    {/* Max Price */}
                    <td className="px-6 py-4 text-sm text-white">
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
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                          onClick={() => r.push(`/admin/commission-tiers/view/${t.id}`)}
                        >
                          <Eye size={16}/>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          onClick={() => r.push(`/admin/commission-tiers/edit/${t.id}`)}
                        >
                          <Pencil size={16}/>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => onDelete(t)}
                        >
                          <Trash2 size={16}/>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-gray-400 hover:text-white hover:bg-gray-700/50"
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
                      <Layers className="w-16 h-16 text-gray-600 mb-4" />
                      <p className="text-gray-400 text-lg mb-2">
                        {searchTerm || activeFilter !== "all" || progressiveFilter !== "all"
                          ? "لا توجد نتائج مطابقة للبحث"
                          : "لا توجد فئات عمولة مسجلة"
                        }
                      </p>
                      <p className="text-gray-500 text-sm mb-6">
                        {!searchTerm && activeFilter === "all" && progressiveFilter === "all" && 
                         "ابدأ بإضافة فئات عمولة جديدة إلى النظام"}
                      </p>
                      {!searchTerm && activeFilter === "all" && progressiveFilter === "all" && (
                        <Button 
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
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
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="bg-red-500/20 p-2 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">تأكيد الحذف</h2>
                <p className="text-gray-400 text-sm">هل أنت متأكد من حذف هذه الفئة؟</p>
              </div>
            </div>
            
            <div className="bg-gray-700/30 rounded-xl p-4 mb-6">
              <div className="text-white font-medium">{confirm.name}</div>
              <div className="text-gray-400 text-sm mt-1">
                العمولة: {formatCurrency(confirm.commissionAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="flex justify-end space-x-3 space-x-reverse">
              <Button 
                variant="outline" 
                onClick={() => setConfirm(null)}
                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
              >
                إلغاء
              </Button>
              <Button 
                variant="destructive" 
                onClick={doDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
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