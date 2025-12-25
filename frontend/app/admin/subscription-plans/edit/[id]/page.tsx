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
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <Button
            onClick={() => r.push("/admin/subscription-plans")}
            variant="ghost"
            className="text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="w-5 h-5 ml-2" />
            العودة إلى قائمة الخطط
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            تعديل خطة الاشتراك
          </h1>
          <p className="text-muted-foreground mt-2">
            تحديث إعدادات خطة الاشتراك ومعلوماتها الأساسية
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <div className="bg-primary p-3 rounded-xl">
            <Settings className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Form Content */}
        <div className="lg:col-span-3">
          {/* Progress Indicator */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Sparkles className="w-5 h-5 ml-2 text-amber-400" />
                تحديث خطة الاشتراك
              </h3>
              <div className="text-sm text-primary">الخطوة 1 من 1</div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full w-full"></div>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
            <SubscriptionPlanForm 
              id={id} 
              onSuccess={() => r.push("/admin/subscription-plans")} 
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Tips */}
          <div className="bg-muted rounded-2xl border border-border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
              <Target className="w-5 h-5 ml-2" />
              نصائح سريعة
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">اختر اسمًا جذابًا يعكس قيمة الخطة</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">اضبط الأسعار بما يتناسب مع القيمة المقدمة</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">استخدم أوصافًا واضحة للمستخدمين</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">سيتم تطبيق التغييرات فور الحفظ</span>
              </div>
            </div>
          </div>

          {/* Pricing Guidelines */}
          <div className="bg-muted rounded-2xl border border-border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 ml-2" />
              إرشادات التسعير
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">السعر الشهري يحسب تلقائيًا</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">اختبر الأسعار الجديدة قبل التطبيق</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">التغييرات تؤثر على المشتركين الجدد فقط</span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">احتفظ بنسخة من الإعدادات السابقة</span>
              </div>
            </div>
          </div>

          {/* User Types Info */}
          <div className="bg-muted rounded-2xl border border-border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center">
              <Users className="w-5 h-5 ml-2" />
              أنواع المستخدمين
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">مزايد</span>
                <span className="text-foreground text-xs">المستخدم العادي</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">تاجر</span>
                <span className="text-foreground text-xs">بائع ومشتري</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">مزاد</span>
                <span className="text-foreground text-xs">منظم المزادات</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">منسق</span>
                <span className="text-foreground text-xs">إداري ومشرف</span>
              </div>
            </div>
          </div>

          {/* Support Info */}
          <div className="bg-muted rounded-2xl border border-border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
              <Shield className="w-5 h-5 ml-2" />
              معلومات الدعم
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="text-muted-foreground">
                <div className="font-medium">معرف الخطة:</div>
                <div className="text-foreground font-mono">{id}</div>
              </div>
              <div className="text-muted-foreground">
                <div className="font-medium">حالة التعديل:</div>
                <div className="text-foreground">نشط</div>
              </div>
              <div className="text-muted-foreground">
                <div className="font-medium">آخر تحديث:</div>
                <div className="text-foreground">-</div>
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