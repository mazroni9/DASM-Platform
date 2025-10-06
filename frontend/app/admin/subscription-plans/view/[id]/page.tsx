"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { subscriptionPlanService } from "@/services/subscription-plan-service";
import { formatCurrency } from "@/utils/formatCurrency";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    Edit, 
    RefreshCw, 
    Loader2,
    Crown,
    Users,
    Calendar,
    DollarSign,
    CheckCircle,
    XCircle,
    BarChart3,
    Target,
    Sparkles,
    Shield,
    Download,
    Share,
    Zap,
    TrendingUp,
    Clock,
    Hash
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
        const x = await subscriptionPlanService.get(id);
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
      const x = await subscriptionPlanService.get(id);
      setData(x);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">جاري تحميل بيانات الخطة...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col items-center justify-center p-6">
        <Crown className="w-20 h-20 text-amber-500 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-4 text-center">
          لم يتم العثور على الخطة
        </h1>
        <p className="text-gray-400 mb-8 text-center">
          الخطة المطلوبة غير موجودة أو تم حذفها
        </p>
        <Button
          onClick={() => r.push("/admin/subscription-plans")}
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
            onClick={() => r.push("/admin/subscription-plans")}
            variant="ghost"
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 mb-4"
          >
            <ArrowLeft className="w-5 h-5 ml-2" />
            العودة إلى قائمة الخطط
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            تفاصيل خطة الاشتراك
          </h1>
          <p className="text-gray-400 mt-2">
            عرض المعلومات الكاملة لخطة الاشتراك والميزات
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
            onClick={() => r.push(`/admin/subscription-plans/edit/${id}`)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
          >
            <Edit className="w-4 h-4 ml-2" />
            تعديل الخطة
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plan Header Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
            <div className="flex items-center space-x-4 space-x-reverse mb-6">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-3 rounded-xl">
                <Crown className="w-6 h-6 text-white" />
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
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Users className="w-3 h-3 ml-1" />
                    {data.userTypeText}
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
                <div className="text-gray-400 text-sm">السعر الكلي</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1">
                  {formatCurrency(data.price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-xl">
                <div className="text-gray-400 text-sm">السعر الشهري</div>
                <div className="text-2xl font-bold text-green-400 mt-1">
                  {formatCurrency(data.monthlyPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-xl">
                <div className="text-gray-400 text-sm">المدة</div>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  {data.durationText}
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
                  <div className="text-sm font-medium text-gray-400 mb-2">اسم الخطة</div>
                  <div className="text-white font-semibold">{data.name}</div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-400 mb-2">الوصف</div>
                  <div className="text-white">
                    {data.description || (
                      <span className="text-gray-400">غير محدد</span>
                    )}
                  </div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-400 mb-2">نوع المستخدم</div>
                  <div className="flex items-center text-white">
                    <Users className="w-4 h-4 ml-1 text-purple-400" />
                    {data.userTypeText}
                  </div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-400 mb-2">المدة</div>
                  <div className="flex items-center text-white">
                    <Calendar className="w-4 h-4 ml-1 text-amber-400" />
                    {data.durationText}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-700/30 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-400 mb-2">السعر الكلي</div>
                  <div className="text-cyan-400 font-bold text-lg flex items-center">
                    <DollarSign className="w-4 h-4 ml-1" />
                    {formatCurrency(data.price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-400 mb-2">السعر الشهري</div>
                  <div className="text-green-400 font-bold text-lg flex items-center">
                    <TrendingUp className="w-4 h-4 ml-1" />
                    {formatCurrency(data.monthlyPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-400 mb-2">ترتيب العرض</div>
                  <div className="flex items-center text-white">
                    <Hash className="w-4 h-4 ml-1 text-blue-400" />
                    {data.orderIndex}
                  </div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-400 mb-2">حالة الخطة</div>
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
          {/* Additional Information */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Sparkles className="w-5 h-5 ml-2 text-amber-400" />
              معلومات إضافية
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-700/30 p-3 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">الرابط المخصص</div>
                <div className="text-white font-mono text-sm bg-gray-600/50 px-2 py-1 rounded">
                  {data.slug}
                </div>
              </div>

              <div className="bg-gray-700/30 p-3 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">تاريخ الإنشاء</div>
                <div className="text-white flex items-center">
                  <Clock className="w-3 h-3 ml-1 text-gray-400" />
                  {data.createdAt ? new Date(data.createdAt).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : "غير متاح"}
                </div>
              </div>

              <div className="bg-gray-700/30 p-3 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">آخر تحديث</div>
                <div className="text-white flex items-center">
                  <Zap className="w-3 h-3 ml-1 text-gray-400" />
                  {data.updatedAt ? new Date(data.updatedAt).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : "غير متاح"}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">إجراءات سريعة</h3>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
                onClick={() => r.push(`/admin/subscription-plans/edit/${id}`)}
              >
                <Edit className="w-4 h-4 ml-2" />
                تعديل الخطة
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

          {/* Plan Features */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4">مميزات الخطة</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-green-300">وصول كامل للميزات</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-green-300">دعم فني متميز</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-green-300">تجديد تلقائي</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-green-300">إشعارات وتحديثات</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="mt-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Target className="w-5 h-5 ml-2 text-green-400" />
          إحصائيات الاستخدام
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-700/30 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-cyan-400">0</div>
            <div className="text-gray-400 text-sm">المشتركين</div>
          </div>
          <div className="bg-gray-700/30 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-gray-400 text-sm">إجمالي الإيرادات</div>
          </div>
          <div className="bg-gray-700/30 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-amber-400">0%</div>
            <div className="text-gray-400 text-sm">نسبة الاشتراك</div>
          </div>
          <div className="bg-gray-700/30 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-400">0</div>
            <div className="text-gray-400 text-sm">التقييمات</div>
          </div>
        </div>
      </div>
    </div>
  );
}