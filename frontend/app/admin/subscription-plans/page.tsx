"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscriptionPlanService } from "@/services/subscription-plan-service";
import { formatCurrency } from "@/utils/formatCurrency";
import { Eye, Loader2, Pencil, RefreshCw, Search, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

export default function Page() {
  const r = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [confirm, setConfirm] = useState<any>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  const userTypes = {
    bidder: 'مزايد',
    dealer: 'تاجر',
    auctioneer: 'مزاد',
    moderator: 'منسق',
    admin: 'مدير',
  };

  const load = async () => {
    try {
      setLoading(true);
      const params = {};
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">إدارة خطط الاشتراك</h1>
        <div className="flex items-center gap-2">
          <Button onClick={load} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 ml-2" /> تحديث
          </Button>
          <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => r.push("/admin/subscription-plans/create")} size="sm">
            إضافة خطة
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="بحث باسم الخطة"
            className="pr-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            <option value="all">كل أنواع المستخدمين</option>
            {Object.entries(userTypes).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            <option value="all">كل الحالات</option>
            <option value="active">مفعلة</option>
            <option value="inactive">معطلة</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="mr-2">جاري تحميل الخطط...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم الخطة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع المستخدم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المدة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر الشهري</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مفعلة؟</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.length > 0 ? (
                  filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.userTypeText}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(t.price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.durationText}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(t.monthlyPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {t.isActive ? "مفعلة" : "معطلة"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                        <Button size="icon" variant="ghost" onClick={() => r.push(`/admin/subscription-plans/view/${t.id}`)}><Eye size={16}/></Button>
                        <Button size="icon" variant="ghost" className="text-blue-600 hover:text-blue-900" onClick={() => r.push(`/admin/subscription-plans/edit/${t.id}`)}><Pencil size={16}/></Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className={t.isActive ? "text-orange-600 hover:text-orange-900" : "text-green-600 hover:text-green-900"} 
                          onClick={() => onToggleStatus(t)}
                          disabled={toggleLoading === t.id}
                        >
                          {toggleLoading === t.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : t.isActive ? (
                            <ToggleLeft size={16} />
                          ) : (
                            <ToggleRight size={16} />
                          )}
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-900" onClick={() => onDelete(t)}><Trash2 size={16}/></Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">لا توجد نتائج</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-900 rounded-md p-4 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">تأكيد الحذف</h2>
            <p className="mb-4">هل أنت متأكد من حذف خطة الاشتراك "{confirm.name}"؟</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirm(null)}>إلغاء</Button>
              <Button variant="destructive" onClick={doDelete}>حذف</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
