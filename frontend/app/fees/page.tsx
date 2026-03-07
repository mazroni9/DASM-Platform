'use client';

const FeesPage = () => {
  const commissionTiers = [
    { range: "من 0 ريال إلى 50,000 ريال", amount: "250 ريال" },
    { range: "من 50,001 ريال إلى 100,000 ريال", amount: "500 ريال" },
    { range: "من 100,001 ريال إلى 150,000 ريال", amount: "1,000 ريال" },
    { range: "من 150,001 ريال إلى 200,000 ريال", amount: "2,000 ريال" },
    { range: "من 200,001 ريال فأعلى", amount: "2,500 ريال" },
  ];

  return (
    <main className="container mx-auto p-8 bg-card rounded-lg shadow my-8">
      <div className="prose prose-lg max-w-none text-right space-y-8" dir="rtl">
        <h1 className="text-3xl font-bold mb-6 text-center text-foreground">
          الرسوم والعمولات
        </h1>

        <p className="text-foreground leading-relaxed">
          تعتمد منصة DASM هيكلًا واضحًا ومعلنًا للرسوم والعمولات المرتبطة بخدماتها، وذلك بهدف بيان التكاليف المستحقة على العمليات التي تتم من خلالها بصورة واضحة ومنظمة.
        </p>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">أولًا: عمولات البيع</h2>
          <p className="text-foreground leading-relaxed mb-4">
            تُحتسب عمولة البيع بحسب قيمة المركبة محل الصفقة، وذلك وفق الشرائح التالية:
          </p>
          <div className="overflow-x-auto my-6">
            <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-4 py-3 text-right font-bold text-foreground">
                    شريحة قيمة المركبة
                  </th>
                  <th className="border border-border px-4 py-3 text-right font-bold text-foreground">
                    العمولة
                  </th>
                </tr>
              </thead>
              <tbody>
                {commissionTiers.map((tier, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/50"}>
                    <td className="border border-border px-4 py-3 text-foreground">
                      {tier.range}
                    </td>
                    <td className="border border-border px-4 py-3 text-foreground font-medium">
                      {tier.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">ثانيًا: رسوم نقل الملكية</h2>
          <p className="text-foreground leading-relaxed mb-4">
            تبلغ رسوم نقل الملكية 600 ريال عن كل عملية نقل ملكية يتم تنفيذها، وتُوزع على النحو التالي:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground">
            <li>382 ريال رسوم حكومية للمرور ونظام تم</li>
            <li>218 ريال للمعرض الذي تتواجد فيه السيارة وقت تنفيذ معاملة نقل الملكية</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">ثالثًا: الفصل بين الرسوم</h2>
          <p className="text-foreground leading-relaxed">
            تُعد عمولة البيع ورسوم نقل الملكية بندين مستقلين، ويتم احتساب كل منهما بحسب نوع العملية المنفذة.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">رابعًا: نطاق التطبيق</h2>
          <p className="text-foreground leading-relaxed mb-4">
            تُطبق عمولات البيع عند إتمام الصفقة وفق الآلية المعتمدة داخل المنصة أو من خلال القنوات التشغيلية المرتبطة بها.
          </p>
          <p className="text-foreground leading-relaxed">
            كما تُطبق رسوم نقل الملكية فقط عند تنفيذ إجراء نقل الملكية فعليًا.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">خامسًا: المرجعية المعتمدة</h2>
          <p className="text-foreground leading-relaxed">
            تُعد هذه الصفحة، وما يتم تحديثه فيها داخل المنصة، المرجع المعتمد في بيان الرسوم والعمولات المرتبطة بالخدمات المقدمة عبر منصة DASM.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">سادسًا: التحديثات</h2>
          <p className="text-foreground leading-relaxed">
            تحتفظ المنصة بحق تعديل الرسوم أو العمولات أو طريقة عرضها متى اقتضت الحاجة التشغيلية أو التنظيمية ذلك، على أن يتم نشر النسخة المعتمدة داخل المنصة، ويُعمل بها من تاريخ اعتمادها أو نشرها.
          </p>
        </section>
      </div>
    </main>
  );
};

export default FeesPage;
