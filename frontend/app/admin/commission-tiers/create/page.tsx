"use client";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import CommissionTierForm from "@/components/admin/CommissionTierForm";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    Plus,
    Sparkles,
    Settings,
    Shield,
    BarChart3,
    TrendingUp,
    Layers,
    Target,
    Rocket
} from "lucide-react";

export default function Page() {
  const r = useLoadingRouter();
  
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
            إنشاء فئة عمولة جديدة
          </h1>
          <p className="text-gray-400 mt-2">
            إضافة فئة عمولة جديدة إلى النظام مع الإعدادات المناسبة
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl">
            <Plus className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Form Content */}
        <div className="lg:col-span-3">
          {/* Welcome & Progress Section */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-4 space-x-reverse mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">مرحباً بك في إنشاء فئة عمولة جديدة</h2>
                <p className="text-gray-400 mt-1">
                  املأ النموذج أدناه لإنشاء فئة عمولة جديدة في النظام
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Sparkles className="w-5 h-5 ml-2 text-amber-400" />
                إنشاء فئة العمولة
              </h3>
              <div className="text-sm text-cyan-400">الخطوة 1 من 1</div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full w-full"></div>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
            <CommissionTierForm 
              id={undefined as any} 
              onSuccess={() => r.push("/admin/commission-tiers")}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Creation Guide */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center">
              <Target className="w-5 h-5 ml-2" />
              دليل الإنشاء
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-cyan-300">اختر اسمًا واضحًا يعبر عن نطاق الأسعار</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-cyan-300">حدد نطاق الأسعار بدقة لتجنب التداخل</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-cyan-300">العمولة التدريجية تناسب المنتجات متنوعة الأسعار</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-cyan-300">يمكنك تعطيل الفئة لاحقًا إذا لزم الأمر</span>
              </div>
            </div>
          </div>

          {/* Commission Types */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 ml-2" />
              أنواع العمولة
            </h3>
            
            <div className="space-y-4">
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 font-medium text-sm">تدريجية</span>
                </div>
                <p className="text-amber-200 text-xs">
                  مناسبة للأسعار المتغيرة والحسابات المعقدة
                </p>
              </div>
              
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-300 font-medium text-sm">ثابتة</span>
                </div>
                <p className="text-blue-200 text-xs">
                  مناسبة للأسعار الثابتة والحسابات البسيطة
                </p>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
              <Shield className="w-5 h-5 ml-2" />
              أفضل الممارسات
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-green-300">تأكد من عدم تداخل نطاقات الأسعار</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-green-300">اختبر العمولة قبل التطبيق النهائي</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-green-300">استخدم أسماء واضحة وسهلة التذكر</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-green-300">احتفظ بنسخة من الإعدادات السابقة</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-purple-400 mb-4">معلومات سريعة</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-purple-300">الحالة</span>
                <span className="text-green-400 bg-green-500/20 px-2 py-1 rounded-full text-xs">جديد</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-300">النوع</span>
                <span className="text-white">قيد الإنشاء</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-300">المعرف</span>
                <span className="text-gray-400">سيتم إنشاؤه</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-300">التاريخ</span>
                <span className="text-white">الآن</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="mt-8 bg-gray-800/50 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-400">
            جاري إنشاء فئة عمولة جديدة في النظام
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => r.push("/admin/commission-tiers")}
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              إلغاء والعودة
            </Button>
            <Button
              onClick={() => document.getElementById('commission-form-submit')?.click()}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-300"
            >
              <Plus className="w-4 h-4 ml-2" />
              إنشاء الفئة
            </Button>
          </div>
        </div>
      </div>

      {/* Inspiration Section */}
      <div className="mt-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/20 shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-2">هل تحتاج إلى إلهام؟</h3>
            <p className="text-blue-300 text-sm">
              جرب هذه الأسماء الشائعة للفئات: "اقتصادية"، "متوسطة"، "متميزة"، "فاخرة"
            </p>
          </div>
          <Sparkles className="w-8 h-8 text-blue-400" />
        </div>
      </div>
    </div>
  );
}