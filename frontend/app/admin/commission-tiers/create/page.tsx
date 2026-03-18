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
  Rocket,
} from "lucide-react";

export default function Page() {
  const r = useLoadingRouter();

  return (
    <div className="min-h-screen bg-background text-foreground p-2">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <Button
            onClick={() => r.push("/admin/commission-tiers")}
            variant="ghost"
            className="text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="w-5 h-5 ml-2" />
            العودة إلى قائمة الفئات
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            إنشاء فئة عمولة جديدة
          </h1>
          <p className="text-muted-foreground mt-2">
            إضافة فئة عمولة جديدة إلى النظام مع الإعدادات المناسبة
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <div className="bg-primary text-primary-foreground p-3 rounded-xl">
            <Plus className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Form Content */}
        <div className="lg:col-span-3">
          {/* Welcome & Progress Section */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-4 space-x-reverse mb-4">
              <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  مرحباً بك في إنشاء فئة عمولة جديدة
                </h2>
                <p className="text-muted-foreground mt-1">
                  املأ النموذج أدناه لإنشاء فئة عمولة جديدة في النظام
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Sparkles className="w-5 h-5 ml-2 text-amber-400" />
                إنشاء فئة العمولة
              </h3>
              <div className="text-sm text-primary">الخطوة 1 من 1</div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full w-full"></div>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
            <CommissionTierForm
              id={undefined as any}
              onSuccess={() => r.push("/admin/commission-tiers")}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Creation Guide */}
          <div className="bg-muted rounded-2xl border border-border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
              <Target className="w-5 h-5 ml-2" />
              دليل الإنشاء
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  اختر اسمًا واضحًا يعبر عن نطاق الأسعار
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  حدد نطاق الأسعار بدقة لتجنب التداخل
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  العمولة التدريجية تناسب المنتجات متنوعة الأسعار
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  يمكنك تعطيل الفئة لاحقًا إذا لزم الأمر
                </span>
              </div>
            </div>
          </div>

          {/* Commission Types */}
          <div className="bg-muted rounded-2xl border border-border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 ml-2" />
              أنواع العمولة
            </h3>

            <div className="space-y-4">
              <div className="bg-muted border border-border rounded-lg p-3">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-foreground font-medium text-sm">
                    تدريجية
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  مناسبة للأسعار المتغيرة والحسابات المعقدة
                </p>
              </div>

              <div className="bg-muted border border-border rounded-lg p-3">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span className="text-foreground font-medium text-sm">
                    ثابتة
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  مناسبة للأسعار الثابتة والحسابات البسيطة
                </p>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-muted rounded-2xl border border-border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
              <Shield className="w-5 h-5 ml-2" />
              أفضل الممارسات
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  تأكد من عدم تداخل نطاقات الأسعار
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  اختبر العمولة قبل التطبيق النهائي
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  استخدم أسماء واضحة وسهلة التذكر
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  احتفظ بنسخة من الإعدادات السابقة
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-muted rounded-2xl border border-border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              معلومات سريعة
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">الحالة</span>
                <span className="text-green-400 bg-green-500/20 px-2 py-1 rounded-full text-xs">
                  جديد
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">النوع</span>
                <span className="text-foreground">قيد الإنشاء</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">المعرف</span>
                <span className="text-muted-foreground">سيتم إنشاؤه</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">التاريخ</span>
                <span className="text-foreground">الآن</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="mt-8 bg-muted rounded-xl p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            جاري إنشاء فئة عمولة جديدة في النظام
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => r.push("/admin/commission-tiers")}
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              إلغاء والعودة
            </Button>
            <Button
              onClick={() =>
                document.getElementById("commission-form-submit")?.click()
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 ml-2" />
              إنشاء الفئة
            </Button>
          </div>
        </div>
      </div>

      {/* Inspiration Section */}
      <div className="mt-6 bg-muted rounded-2xl border border-border shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary mb-2">
              هل تحتاج إلى إلهام؟
            </h3>
            <p className="text-muted-foreground text-sm">
              جرب هذه الأسماء الشائعة للفئات: "اقتصادية"، "متوسطة"، "متميزة"،
              "فاخرة"
            </p>
          </div>
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
      </div>
    </div>
  );
}
