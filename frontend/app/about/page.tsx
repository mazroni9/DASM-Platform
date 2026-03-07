'use client';

import { Building2, ShieldCheck, FileCheck } from 'lucide-react';

const AboutPage = () => {
  return (
    <main className="container mx-auto p-8 bg-card rounded-lg shadow my-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-foreground flex items-center justify-center gap-3">
        <Building2 size={32} />
        من نحن - منصة DASMe
      </h1>

      <div className="prose prose-lg max-w-none text-right space-y-6" dir="rtl">
        {/* بيانات المؤسسة */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <FileCheck className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">البيانات الرسمية</h2>
          </div>

          {/* مؤسسة داسم-اي */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">مؤسسة داسم-اي</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-background/50 px-5 py-4">
                <p className="text-sm text-foreground/70 mb-1">الرقم الوطني الموحد</p>
                <p className="text-xl font-bold text-foreground font-mono tracking-wide" dir="ltr">
                  ٧٠٥١١١٥٦١١
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-background/50 px-5 py-4">
                <p className="text-sm text-foreground/70 mb-1">تاريخ الإصدار</p>
                <p className="text-xl font-bold text-foreground font-mono tracking-wide" dir="ltr">
                  ٠٩/٠٨/٢٠٢٥
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-background/50 px-5 py-4">
                <p className="text-sm text-foreground/70 mb-1">رقم التوثيق</p>
                <p className="text-xl font-bold text-foreground font-mono tracking-wide" dir="ltr">
                  ٠٠٠٠٢٠٦٢١٨
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-background/50 px-5 py-4">
                <p className="text-sm text-foreground/70 mb-1">تاريخ انتهاء الشهادة</p>
                <p className="text-xl font-bold text-foreground font-mono tracking-wide" dir="ltr">
                  ١١/٠٣/٢٠٢٨
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-background/50 px-5 py-4">
                <p className="text-sm text-foreground/70 mb-1">رقم التسجيل الضريبي</p>
                <p className="text-xl font-bold text-foreground font-mono tracking-wide" dir="ltr">
                  ٣١٠٨٠٥٣٤٥٨٠٠٠٠٣
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground/60 mt-2">حالة السجل: نشط</p>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">التعريف القانوني للمنصة</h2>
          </div>
          
          <div className="space-y-4 text-foreground">
            <p className="leading-relaxed">
              منصة DASM هي منصة إلكترونية متخصصة في الإعلانات الرقمية وتنظيم وإدارة المزادات المباشرة، وتركز في مرحلتها الحالية على قطاع السيارات.
            </p>

            <p className="leading-relaxed">
              تقتصر خدمات المنصة على عرض المركبات، وإدارة عمليات الإعلان والمزايدة، وتنظيم الرسوم والاشتراكات والخدمات المرتبطة بالمنصة.
            </p>

            <p className="leading-relaxed">
              وتتم عمليات السداد والتحصيل المرتبطة بخدمات المنصة عبر القنوات ووسائل الدفع النظامية المعتمدة، وذلك وفق الأنظمة والتعليمات المعمول بها.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AboutPage;
