'use client';

const HowItWorksPage = () => {
  return (
    <main className="container mx-auto p-8 bg-card rounded-lg shadow my-8">
      <div className="prose prose-lg max-w-none text-right space-y-8" dir="rtl">
        <h1 className="text-3xl font-bold mb-6 text-center text-foreground">
          كيف تعمل المنصة
        </h1>

        <p className="text-foreground leading-relaxed">
          منصة DASM هي منصة إلكترونية متخصصة في الإعلانات الرقمية وتنظيم وإدارة المزادات المباشرة، وتركز في مرحلتها الحالية على قطاع السيارات.
        </p>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">فكرة المنصة</h2>
          <p className="text-foreground leading-relaxed">
            تجمع المنصة بين عرض المركبات، والإعلان عنها، وإتاحة بيعها عبر المزاد أو من خلال العرض المباشر، ضمن آلية واضحة تساعد البائع والمشتري على الوصول إلى صفقة أكثر تنظيمًا ووضوحًا.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">كيف تبدأ العملية؟</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">1. عرض المركبة</h3>
              <p className="text-foreground leading-relaxed">
                يقوم البائع أو الجهة العارضة بإدخال بيانات المركبة ورفع تفاصيلها وصورها ومعلوماتها الأساسية بحسب ما تسمح به المنصة.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">2. نشر الإعلان أو إدخال المركبة إلى المزاد</h3>
              <p className="text-foreground leading-relaxed">
                بحسب نوع الخدمة المتاحة، يمكن عرض المركبة كإعلان مباشر أو إدخالها ضمن مزاد رقمي مباشر وفق آلية المنصة المعتمدة.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">3. تفاعل المشترين</h3>
              <p className="text-foreground leading-relaxed">
                يتمكن المشترون من متابعة الإعلانات أو دخول المزاد والمشاركة في المزايدة وفق الشروط والضوابط المعلنة داخل المنصة.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">4. إتمام البيع</h3>
              <p className="text-foreground leading-relaxed">
                عند الوصول إلى اتفاق بيع أو رسو المزاد وفق الآلية المعتمدة، يتم الانتقال إلى استكمال الإجراءات المرتبطة بالعملية بحسب نوع البيع.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">5. السداد والتحصيل</h3>
              <p className="text-foreground leading-relaxed">
                تتم عمليات السداد والتحصيل المرتبطة بخدمات المنصة عبر القنوات ووسائل الدفع النظامية المعتمدة، وذلك وفق الأنظمة والتعليمات المعمول بها.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">6. نقل الملكية</h3>
              <p className="text-foreground leading-relaxed">
                عند الحاجة إلى نقل الملكية، يتم تنفيذ الإجراء وفق الآلية النظامية المعتمدة، مع تطبيق الرسوم ذات العلاقة بحسب نوع العملية ومكان وجود المركبة.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">الرسوم والعمولات</h2>
          <p className="text-foreground leading-relaxed mb-4">
            تعتمد المنصة هيكلًا واضحًا للرسوم والعمولات، ويشمل ذلك عمولات البيع ورسوم نقل الملكية عند انطباقها.
          </p>

          <h3 className="text-xl font-semibold text-foreground mb-3">عمولات البيع</h3>
          <ul className="list-none space-y-2 mb-6 text-foreground">
            <li>من 0 إلى 50,000 ريال: 250 ريال</li>
            <li>من 50,001 إلى 100,000 ريال: 500 ريال</li>
            <li>من 100,001 إلى 150,000 ريال: 1,000 ريال</li>
            <li>من 150,001 إلى 200,000 ريال: 2,000 ريال</li>
            <li>من 200,001 ريال فأعلى: 2,500 ريال</li>
          </ul>

          <div className="border-r-4 border-primary/30 pr-4 space-y-2">
            <p className="text-foreground font-semibold">رسوم نقل الملكية: 600 ريال</p>
            <p className="text-foreground">382 ريال رسوم حكومية للمرور ونظام تم</p>
            <p className="text-foreground">218 ريال للمعرض الذي تتواجد فيه السيارة وقت نقل الملكية</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">ما الذي توفره المنصة للمستخدم؟</h2>
          <ul className="list-none space-y-2 text-foreground">
            <li>عرض المركبات بشكل منظم وواضح</li>
            <li>إمكانية الإعلان أو البيع عبر المزاد</li>
            <li>وضوح في الرسوم والعمولات</li>
            <li>مسار أكثر ترتيبًا في المتابعة وإتمام الإجراءات</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">المرحلة الحالية</h2>
          <p className="text-foreground leading-relaxed">
            تركز منصة DASM حاليًا على قطاع السيارات، مع إمكانية التوسع مستقبلًا إلى فئات أخرى بحسب ما تقرره المنصة في مراحلها اللاحقة.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">تنبيه</h2>
          <p className="text-foreground leading-relaxed">
            تخضع جميع الخدمات والإجراءات والرسوم للضوابط والشروط المعتمدة داخل المنصة، وللأنظمة والتعليمات المعمول بها في المملكة العربية السعودية.
          </p>
        </section>
      </div>
    </main>
  );
};

export default HowItWorksPage;
