"use client";
import { useParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import CommissionTierForm from "@/components/admin/CommissionTierForm";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Settings,
  RefreshCw,
  Shield,
  Sparkles,
  BarChart3,
} from "lucide-react";

export default function Page() {
  const p = useParams();
  const r = useLoadingRouter();
  const id = p?.id as string;

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
            تعديل فئة العمولة
          </h1>
          <p className="text-muted-foreground mt-2">
            تحديث إعدادات فئة العمولة ومعلوماتها الأساسية
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <div className="bg-primary text-primary-foreground p-3 rounded-xl">
            <Settings className="w-6 h-6" />
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
                تحديث فئة العمولة
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
              id={id}
              onSuccess={() => r.push("/admin/commission-tiers")}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Tips */}
          <div className="bg-muted rounded-2xl border border-border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
              <Sparkles className="w-5 h-5 ml-2" />
              نصائح سريعة
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  تأكد من صحة نطاق الأسعار
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  العمولة التدريجية تناسب الأسعار المتغيرة
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  اختر اسمًا واضحًا يعبر عن الفئة
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  سيتم تطبيق التغييرات فور الحفظ
                </span>
              </div>
            </div>
          </div>

          {/* Form Guidelines */}
          <div className="bg-muted rounded-2xl border border-border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 ml-2" />
              إرشادات التعديل
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  يمكن تعطيل الفئة مؤقتًا دون حذفها
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  التغييرات تؤثر على المعاملات الجديدة فقط
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  احتفظ بنسخة من الإعدادات السابقة
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">
                  اختبر العمولة الجديدة قبل التطبيق
                </span>
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
                <div className="font-medium">معرف الفئة:</div>
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
      <div className="mt-8 bg-muted rounded-xl p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            جاري تحديث فئة العمولة رقم{" "}
            <span className="text-primary font-mono">{id}</span>
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
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث الفئة
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
