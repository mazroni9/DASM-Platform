'use client';

import { 
  UserCheck, 
  CreditCard, 
  Video, 
  Gavel, 
  Wallet, 
  Calculator, 
  BanknoteIcon
} from 'lucide-react';

const HowItWorksPage = () => {
  return (
    <main className="container mx-auto p-8 bg-card rounded-lg shadow my-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-foreground flex items-center justify-center gap-3">
        كيف نعمل في منصة DASMe
      </h1>

      <div className="prose prose-lg max-w-none text-right space-y-8" dir="rtl">
        <section className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold">1</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">التسجيل والتحقق</h2>
            <p className="text-foreground">
              يسجل المستخدم في المنصة، ويقوم برفع صورة الهوية ورقم الآيبان الخاص به لتوثيق الحساب وربط المحفظة البنكية.
            </p>
          </div>
        </section>

        <section className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold">2</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">اختيار الاشتراك</h2>
            <p className="text-foreground">
              يختار التاجر أو الفرد الاشتراك المناسب له. الاشتراك يمنحه صلاحية الدخول في المزادات والتمويل المؤهل حسب الفئة المختارة.
            </p>
          </div>
        </section>

        <section className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold">3</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">الحراج المباشر</h2>
            <p className="text-foreground">
              يتم بث المزاد اليومي من المعرض، ويستطيع المشتركون المزايدة في الوقت الحقيقي.
            </p>
          </div>
        </section>

        <section className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold">4</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">المزاد الفوري والمزاد الصامت</h2>
            <p className="text-foreground">
              تنتقل السيارات غير المباعة تلقائيًا إلى المزاد الفوري، ثم المزاد الصامت لبقية اليوم، مما يمنح فرصًا أكبر للبيع.
            </p>
          </div>
        </section>

        <section className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold">5</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">التمويل الداخلي</h2>
            <p className="text-foreground">
              بناءً على الاشتراك، يُمنح المستخدم رصيدًا داخليًا مؤقتًا للمزايدة، ويتم خصمه عند الفوز بالمزاد.
            </p>
          </div>
        </section>

        <section className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold">6</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">التصفية المالية</h2>
            <p className="text-foreground">
              بعد بيع السيارة، تخصم المنصة الرسوم والتمويل ثم يتم تحويل صافي الربح إلى محفظة البائع الداخلية.
            </p>
          </div>
        </section>

        <section className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold">7</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">تحويل الأرباح</h2>
            <p className="text-foreground">
              يمكن للمستخدم تحويل الرصيد إلى حسابه البنكي في أي وقت عبر نظام سريع أو عبر أحد شركاء الدفع مثل دي360 أو برق.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default HowItWorksPage; 