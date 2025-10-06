"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { commissionTierService } from "@/services/commission-tier-service";
import { formatCurrency } from "@/utils/formatCurrency";
import CommissionCalculator from "@/components/admin/CommissionCalculator";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    Edit, 
    RefreshCw, 
    Percent, 
    TrendingUp, 
    Layers, 
    CheckCircle, 
    XCircle,
    Calendar,
    DollarSign,
    BarChart3,
    Calculator,
    Shield,
    Download,
    Share
} from "lucide-react";

export default function Page() {
  const p = useParams();
  const r = useLoadingRouter();
  const id = p?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const x = await commissionTierService.get(id);
        setData(x);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const x = await commissionTierService.get(id);
      setData(x);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">جاري تحميل بيانات الفئة...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col items-center justify-center p-6">
        <Shield className="w-20 h-20 text-amber-500 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-4 text-center">
          لم يتم العثور على الفئة
        </h1>
        <p className="text-gray-400 mb-8 text-center">
          الفئة المطلوبة غير موجودة أو تم حذفها
        </p>
        <Button
          onClick={() => r.push("/admin/commission-tiers")}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
        >
          <ArrowLeft className="w-5 h-5 ml-2" />
          العودة إلى القائمة
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <Button
            onClick={() => r.push("/admin/commission-tiers")}
            variant="ghost"
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 mb-4"
          >
            <ArrowLeft className="w-5 h-5 ml-2" />
            العودة إلى قائمة الفئات
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            تفاصيل فئة العمولة
          </h1>
          <p className="text-gray-400 mt-2">
            عرض المعلومات الكاملة لفئة العمولة وحساب الرسوم
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <Button
            onClick={loadData}
            variant="outline"
            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
          <Button
            onClick={() => r.push(`/admin/commission-tiers/edit/${id}`)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
          >
            <Edit className="w-4 h-4 ml-2" />
            تعديل الفئة
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tier Header Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
            <div className="flex items-center space-x-4 space-x-reverse mb-6">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-3 rounded-xl">
                <Percent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{data.name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                    data.isActive 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}>
                    {data.isActive ? (
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
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                    data.isProgressive 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}>
                    {data.isProgressive ? (
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
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                    <Shield className="w-3 h-3 ml-1" />
                    ID: {data.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700/30 p-4 rounded-xl">
                <div className="text-gray-400 text-sm">العمولة الأساسية</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1">
                  {formatCurrency(data.commissionAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-xl">
                <div className="text-gray-400 text-sm">نطاق الأسعار</div>
                <div className="text-lg font-semibold text-white mt-1">
                  {formatCurrency(data.minPrice, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} - {' '}
                  {data.maxPrice === null ? '∞' : formatCurrency(data.maxPrice, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-xl">
                <div className="text-gray-400 text-sm">نوع الحساب</div>
                <div className="text-lg font-semibold text-white mt-1">
                  {data.isProgressive ? 'تدريجي' : 'ثابت'}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              <BarChart3 className="w-5 h-5 ml-2 text-cyan-400" />
              المعلومات التفصيلية
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-700/30 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-400 mb-2">اسم الفئة</div>
                  <div className="text-white font-semibold">{data.name}</div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-400 mb-2">أقل سعر</div>
                  <div className="text-white font-semibold flex items-center">
                    <DollarSign className="w-4 h-4 ml-1 text-green-400" />
                    {formatCurrency(data.minPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-400 mb-2">نوع العمولة</div>
                  <div className="flex items-center">
                    {data.isProgressive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                        <TrendingUp className="w-3 h-3 ml-1" />
                        تدريجية
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                        <Layers className="w-3 h-3 ml-1" />
                        ثابتة
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-700/30 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-400 mb-2">أعلى سعر</div>
                  <div className="text-white font-semibold flex items-center">
                    <DollarSign className="w-4 h-4 ml-1 text-green-400" />
                    {data.maxPrice === null ? (
                      <span className="text-gray-400">غير محدد</span>
                    ) : (
                      formatCurrency(data.maxPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    )}
                  </div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-400 mb-2">مبلغ العمولة</div>
                  <div className="text-cyan-400 font-bold text-lg flex items-center">
                    <Percent className="w-4 h-4 ml-1" />
                    {formatCurrency(data.commissionAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-400 mb-2">حالة الفئة</div>
                  <div className="flex items-center">
                    {data.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        <CheckCircle className="w-3 h-3 ml-1" />
                        مفعلة
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                        <XCircle className="w-3 h-3 ml-1" />
                        معطلة
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Commission Calculator */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calculator className="w-5 h-5 ml-2 text-amber-400" />
              حاسبة العمولة
            </h3>
            <CommissionCalculator />
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">إجراءات سريعة</h3>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
                onClick={() => r.push(`/admin/commission-tiers/edit/${id}`)}
              >
                <Edit className="w-4 h-4 ml-2" />
                تعديل الفئة
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير التقرير
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
              >
                <Share className="w-4 h-4 ml-2" />
                مشاركة المعلومات
              </Button>
            </div>
          </div>

          {/* Tier Information */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">معلومات الفئة</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-cyan-300">معرف الفئة</span>
                <span className="text-white">{data.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-300">النوع</span>
                <span className="text-white">{data.isProgressive ? 'تدريجية' : 'ثابتة'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-300">الحالة</span>
                <span className={`${data.isActive ? 'text-green-400' : 'text-red-400'}`}>
                  {data.isActive ? 'مفعلة' : 'معطلة'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-300">تاريخ الإنشاء</span>
                <span className="text-white">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="mt-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 ml-2 text-green-400" />
          إحصائيات الاستخدام
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-700/30 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-cyan-400">0</div>
            <div className="text-gray-400 text-sm">المعاملات</div>
          </div>
          <div className="bg-gray-700/30 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-400">0</div>
            <div className="text-gray-400 text-sm">إجمالي العمولة</div>
          </div>
          <div className="bg-gray-700/30 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-amber-400">0%</div>
            <div className="text-gray-400 text-sm">نسبة الاستخدام</div>
          </div>
          <div className="bg-gray-700/30 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-400">0</div>
            <div className="text-gray-400 text-sm">المستخدمين النشطين</div>
          </div>
        </div>
      </div>
    </div>
  );
}