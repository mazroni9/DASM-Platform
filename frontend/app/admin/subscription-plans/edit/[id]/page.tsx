"use client";
import { useParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import SubscriptionPlanForm from "@/components/admin/SubscriptionPlanForm";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    Settings, 
    RefreshCw,
    Crown,
    Sparkles,
    BarChart3,
    Target,
    Shield,
    Zap,
    Users,
    DollarSign,
    Calendar
} from "lucide-react";

export default function Page() {
  const p = useParams();
  const r = useLoadingRouter();
  const id = p?.id as string;

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
            تعديل خطة الاشتراك
          </h1>
          <p className="text-gray-400 mt-2">
            تحديث إعدادات خطة الاشتراك ومعلوماتها الأساسية
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-3 rounded-xl">
            <Settings className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Form Content */}
        <div className="lg:col-span-3">
          {/* Progress Indicator */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Sparkles className="w-5 h-5 ml-2 text-amber-400" />
                تحديث خطة الاشتراك
              </h3>
              <div className="text-sm text-cyan-400">الخطوة 1 من 1</div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full w-full"></div>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
            <SubscriptionPlanForm 
              id={id} 
              onSuccess={() => r.push("/admin/subscription-plans")} 
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center">
              <Target className="w-5 h-5 ml-2" />
              نصائح سريعة
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-cyan-300">اختر اسمًا جذابًا يعكس قيمة الخطة</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-cyan-300">اضبط الأسعار بما يتناسب مع القيمة المقدمة</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-cyan-300">استخدم أوصافًا واضحة للمستخدمين</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-cyan-300">سيتم تطبيق التغييرات فور الحفظ</span>
              </div>
            </div>
          </div>

          {/* Pricing Guidelines */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 ml-2" />
              إرشادات التسعير
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-amber-300">السعر الشهري يحسب تلقائيًا</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-amber-300">اختبر الأسعار الجديدة قبل التطبيق</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-amber-300">التغييرات تؤثر على المشتركين الجدد فقط</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-amber-300">احتفظ بنسخة من الإعدادات السابقة</span>
              </div>
            </div>
          </div>

          {/* User Types Info */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center">
              <Users className="w-5 h-5 ml-2" />
              أنواع المستخدمين
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-purple-300">مزايد</span>
                <span className="text-white text-xs">المستخدم العادي</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-300">تاجر</span>
                <span className="text-white text-xs">بائع ومشتري</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-300">مزاد</span>
                <span className="text-white text-xs">منظم المزادات</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-300">منسق</span>
                <span className="text-white text-xs">إداري ومشرف</span>
              </div>
            </div>
          </div>

          {/* Support Info */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
              <Shield className="w-5 h-5 ml-2" />
              معلومات الدعم
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="text-green-300">
                <div className="font-medium">معرف الخطة:</div>
                <div className="text-white font-mono">{id}</div>
              </div>
              <div className="text-green-300">
                <div className="font-medium">حالة التعديل:</div>
                <div className="text-white">نشط</div>
              </div>
              <div className="text-green-300">
                <div className="font-medium">آخر تحديث:</div>
                <div className="text-white">-</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="mt-8 bg-gray-800/50 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-400">
            جاري تحديث خطة الاشتراك رقم <span className="text-cyan-400 font-mono">{id}</span>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => r.push("/admin/subscription-plans")}
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              إلغاء والعودة
            </Button>
            <Button
              onClick={() => document.getElementById('subscription-form-submit')?.click()}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث الخطة
            </Button>
          </div>
        </div>
      </div>

      {/* Best Practices Section */}
      <div className="mt-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/20 shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-2">أفضل الممارسات</h3>
            <p className="text-blue-300 text-sm">
              استخدم أسماء واضحة مثل "الفضية"، "الذهبية"، "البلاتينية" لتمييز الخطط
            </p>
          </div>
          <Crown className="w-8 h-8 text-blue-400" />
        </div>
      </div>
    </div>
  );
}