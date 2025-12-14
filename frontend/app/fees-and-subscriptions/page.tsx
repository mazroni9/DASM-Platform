// frontend/app/fees-and-subscriptions/page.tsx
import type { Metadata } from "next";
import LoadingLink from "@/components/LoadingLink";
import {
  BadgeCheck,
  CreditCard,
  FileText,
  Gavel,
  Landmark,
  Receipt,
  ShieldAlert,
} from "lucide-react";

export const metadata: Metadata = {
  title: "سياسة الرسوم والاشتراكات | منصة DASM-e",
  description:
    "النسخة الرسمية لرسوم وعمولات منصة DASM-e ونموذج الاشتراكات، بما يتوافق مع أنظمة التجارة الإلكترونية ولوائح هيئة الزكاة والضريبة والجمارك (ZATCA).",
};

const Page = () => {
  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoadingLink href="/" className="hover:text-primary transition-colors">
                الرئيسية
              </LoadingLink>
              <span className="text-border">/</span>
              <span className="text-foreground">سياسة الرسوم والاشتراكات</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                    النسخة الرسمية لرسوم وعمولات المنصة ونموذج الاشتراكات — منصة DASM-e
                  </h1>
                  <p className="text-muted-foreground leading-relaxed">
                    توضح هذه الوثيقة تفاصيل الاشتراكات، عمولات البيع، الرسوم الحكومية والإدارية،
                    ورسوم الدفع الإلكتروني والسياسة الضريبية وفق الأنظمة المعمول بها في المملكة العربية السعودية.
                  </p>
                </div>

                <div className="shrink-0 rounded-xl border border-border bg-background px-4 py-3">
                  <div className="text-xs text-muted-foreground">تاريخ الإصدار</div>
                  <div className="font-semibold">13 ديسمبر 2025</div>
                  <div className="mt-2 text-xs text-muted-foreground">رقم الإصدار</div>
                  <div className="font-semibold">V-1.2 (النسخة النهائية)</div>
                </div>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  <span>مرجعية: متوافق مع أنظمة التجارة الإلكترونية ولوائح ZATCA</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  <span>ضريبة القيمة المضافة: 15% على رسوم الخدمات</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* TOC */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 font-semibold">
                <FileText className="h-4 w-4 text-primary" />
                محتويات الصفحة
              </div>

              <nav className="mt-4 space-y-2 text-sm">
                {[
                  ["intro", "1. مقدمة وإخلاء مسؤولية"],
                  ["subs", "2. باقات الاشتراك (دخول المزاد)"],
                  ["success", "3. هيكلة عمولات البيع (Success Fees)"],
                  ["transfer", "4. الرسوم الحكومية والإدارية (نقل الملكية)"],
                  ["gateway", "5. رسوم الدفع الإلكتروني (Payment Gateway)"],
                  ["vat", "6. السياسة الضريبية (VAT Compliance)"],
                  ["example", "7. مثال تطبيقي للفاتورة (للتوضيح)"],
                ].map(([id, label]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="block rounded-xl border border-transparent px-3 py-2 hover:border-border hover:bg-background transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </nav>

              <div className="mt-5 text-xs text-muted-foreground leading-relaxed">
                ملاحظة: قد يتم تحديث هذه السياسة عند الحاجة. يُنصح بمراجعتها قبل إتمام أي عملية.
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1 */}
            <section id="intro" className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-lg">
                <ShieldAlert className="h-5 w-5 text-primary" />
                1. مقدمة وإخلاء مسؤولية
              </div>

              <p className="mt-3 text-muted-foreground leading-relaxed">
                تحدد هذه الوثيقة السياسات المالية المعتمدة لمنصة DASM-e للمزادات الرقمية.
                تلتزم المنصة بمبدأ الشفافية المطلقة في عرض كافة التكاليف قبل إتمام أي عملية.
                وتخضع جميع <span className="font-semibold text-foreground">رسوم الخدمات</span> لضريبة القيمة المضافة (15%) حسب الأنظمة السعودية،
                بينما يُعفى <span className="font-semibold text-foreground">سعر المركبة</span> من ضريبة المنصة (كونه مبلغاً عابراً Pass-through).
              </p>

              <div className="mt-4 rounded-xl border border-border bg-background p-4 text-sm">
                <div className="flex items-start gap-2">
                  <BadgeCheck className="h-4 w-4 text-primary mt-0.5" />
                  <div className="leading-relaxed">
                    سيتم عرض تفاصيل الرسوم قبل الدفع/الإتمام، مع توضيح ما يخضع للضريبة وما يُعد مبلغاً عابراً.
                  </div>
                </div>
              </div>
            </section>

            {/* 2 */}
            <section id="subs" className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Gavel className="h-5 w-5 text-primary" />
                2. باقات الاشتراك (دخول المزاد)
              </div>

              <p className="mt-3 text-muted-foreground leading-relaxed">
                للمشاركة في المزايدة، يتوجب على المستخدم تفعيل إحدى باقات الاشتراك التالية.
                هذه الرسوم غير مستردة وتعتبر مقابل <span className="font-semibold text-foreground">"خدمة الوصول والتحقق"</span>.
              </p>

              <div className="mt-4 rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto bg-background">
                  <table className="min-w-[760px] w-full text-sm">
                    <thead className="bg-card">
                      <tr className="border-b border-border">
                        <th className="text-right p-4 font-semibold">نوع الباقة</th>
                        <th className="text-right p-4 font-semibold">السعر (ر.س)</th>
                        <th className="text-right p-4 font-semibold">الصلاحية</th>
                        <th className="text-right p-4 font-semibold">المزايا</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">باقة "يوم واحد"</td>
                        <td className="p-4">35 ريال</td>
                        <td className="p-4">24 ساعة</td>
                        <td className="p-4">
                          <ul className="list-disc pr-5 space-y-1 text-muted-foreground">
                            <li>دخول غير محدود للمزادات لمدة يوم.</li>
                            <li>إمكانية المزايدة على سيارة واحدة.</li>
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium">باقة "شهر كامل"</td>
                        <td className="p-4">235 ريال</td>
                        <td className="p-4">30 يوماً</td>
                        <td className="p-4">
                          <ul className="list-disc pr-5 space-y-1 text-muted-foreground">
                            <li>دخول غير محدود لكافة المزادات.</li>
                            <li>إضافة سياراته الخاصة للمزادات.</li>
                            <li>دخول المزادات بدون تأمين (No Deposit Required).</li>
                            <li>أولوية في الدعم الفني.</li>
                          </ul>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-border bg-card p-4 text-xs text-muted-foreground">
                  ملاحظة: الأسعار أعلاه غير شاملة ضريبة القيمة المضافة 15%.
                </div>
              </div>
            </section>

            {/* 3 */}
            <section id="success" className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Receipt className="h-5 w-5 text-primary" />
                3. هيكلة عمولات البيع (Success Fees)
              </div>

              <p className="mt-3 text-muted-foreground leading-relaxed">
                تُستحق عمولة المنصة فقط في حال إتمام البيع. تتبع العمولة نظام الشرائح القيمية بناءً على
                سعر إغلاق المزاد، وتختلف المسؤولية عنها حسب نوع البائع.
              </p>

              <div className="mt-5 font-semibold">أولاً: جدول الشرائح (قيمة العمولة الثابتة - C)</div>

              <div className="mt-3 rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto bg-background">
                  <table className="min-w-[720px] w-full text-sm">
                    <thead className="bg-card">
                      <tr className="border-b border-border">
                        <th className="text-right p-4 font-semibold">اسم الفئة</th>
                        <th className="text-right p-4 font-semibold">شريحة سعر السيارة (من - إلى)</th>
                        <th className="text-right p-4 font-semibold">قيمة العمولة (ر.س)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">الفئة الأولى</td>
                        <td className="p-4">من 0 إلى 50,000 ريال</td>
                        <td className="p-4">350 ريال</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">الفئة الثانية</td>
                        <td className="p-4">من 50,001 إلى 100,000 ريال</td>
                        <td className="p-4">700 ريال</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">الفئة الثالثة</td>
                        <td className="p-4">من 100,001 إلى 150,000 ريال</td>
                        <td className="p-4">1,000 ريال</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">الفئة الرابعة</td>
                        <td className="p-4">من 150,001 إلى 200,000 ريال</td>
                        <td className="p-4">1,500 ريال</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium">الفئة الخامسة</td>
                        <td className="p-4">ما فوق 200,001 ريال</td>
                        <td className="p-4">تبدأ من 2,500 ريال + زيادة تراكمية*</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-border bg-card p-4 text-sm">
                  <div className="font-semibold">* آلية حساب الفئة الخامسة</div>
                  <p className="mt-1 text-muted-foreground leading-relaxed">
                    العمولة الأساسية هي 2,500 ريال، ويُضاف إليها مبلغ 1,000 ريال عن كل 100,000 ريال زيادة في سعر السيارة.
                  </p>
                  <ul className="mt-2 list-disc pr-5 space-y-1 text-muted-foreground">
                    <li>مثال: سيارة بسعر 300,000 ريال → العمولة 3,500 ريال.</li>
                    <li>مثال: سيارة بسعر 400,000 ريال → العمولة 4,500 ريال.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 font-semibold">ثانياً: توزيع تحمل العمولة</div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="font-semibold">1) حالة البائع "فرد"</div>
                  <ul className="mt-2 list-disc pr-5 space-y-1 text-muted-foreground text-sm">
                    <li>على المشتري: دفع قيمة العمولة (C) كاملة + الضريبة.</li>
                    <li>على البائع: يُخصم من مستحقاته قيمة عمولة مماثلة (C) + الضريبة.</li>
                    <li>
                      <span className="font-semibold text-foreground">المحصلة:</span> المنصة تحصل على (2×C).
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="font-semibold">2) حالة البائع "معرض شريك"</div>
                  <ul className="mt-2 list-disc pr-5 space-y-1 text-muted-foreground text-sm">
                    <li>على البائع (المعرض): 0 ريال (معفى من عمولة المنصة).</li>
                    <li>
                      على المشتري: يدفع (20% من قيمة C) للمنصة، والباقي (80% من قيمة C) يذهب للمعرض كحافز.
                    </li>
                    <li>
                      <span className="font-semibold text-foreground">المحصلة:</span> المنصة تحصل على 20% فقط من عمولة المشتري.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 4 */}
            <section id="transfer" className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Landmark className="h-5 w-5 text-primary" />
                4. الرسوم الحكومية والإدارية (نقل الملكية)
              </div>

              <p className="mt-3 text-muted-foreground leading-relaxed">
                يتم تحصيل مبلغ ثابت وموحد لتغطية التكاليف التشغيلية لنقل الملكية عبر الجهات الرسمية.
              </p>

              <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                <ul className="list-disc pr-5 space-y-2 text-sm text-muted-foreground">
                  <li>
                    <span className="font-semibold text-foreground">قيمة الرسم:</span> 600 ريال سعودي.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">التغطية:</span> تشمل رسوم المرور الحكومية، رسوم منصة "تم"، وأتعاب المعرض المعقّب.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">المستفيد:</span> يتم تحويل هذا المبلغ بالكامل للمعرض المنفذ للخدمة (سواء كان معرض DASM-e أو معرضاً شريكاً).
                  </li>
                </ul>
              </div>
            </section>

            {/* 5 */}
            <section id="gateway" className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                5. رسوم الدفع الإلكتروني (Payment Gateway)
              </div>

              <p className="mt-3 text-muted-foreground leading-relaxed">
                يتحمل المشتري رسوم المعالجة البنكية حسب تسعيرة مزود الخدمة (Telr) المعتمدة:
              </p>

              <div className="mt-4 rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto bg-background">
                  <table className="min-w-[560px] w-full text-sm">
                    <thead className="bg-card">
                      <tr className="border-b border-border">
                        <th className="text-right p-4 font-semibold">وسيلة الدفع</th>
                        <th className="text-right p-4 font-semibold">نسبة الرسوم</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">مدى (Mada)</td>
                        <td className="p-4">1.00%</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">البطاقات المحلية (Visa/MC)</td>
                        <td className="p-4">2.50% + 1 ريال</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">البطاقات الدولية</td>
                        <td className="p-4">3.50% + 1 ريال</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">UrPay</td>
                        <td className="p-4">0.80%</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium">STC Pay</td>
                        <td className="p-4">0.90%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-border bg-card p-4 text-xs text-muted-foreground">
                  ملاحظة: تُطبق ضريبة 15% على مبلغ رسوم البوابة.
                </div>
              </div>
            </section>

            {/* 6 */}
            <section id="vat" className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-lg">
                <BadgeCheck className="h-5 w-5 text-primary" />
                6. السياسة الضريبية (VAT Compliance)
              </div>

              <p className="mt-3 text-muted-foreground leading-relaxed">
                منصة DASM-e مسجلة في الهيئة العامة للزكاة والضريبة والجمارك.
              </p>

              <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                <ol className="list-decimal pr-5 space-y-2 text-sm text-muted-foreground">
                  <li>
                    <span className="font-semibold text-foreground">الفاتورة الضريبية:</span> تصدر المنصة فاتورة ضريبية رسمية للمستخدم عن مبالغ "الاشتراكات" و"العمولات" فقط.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">سعر السيارة:</span> لا تصدر المنصة فاتورة ضريبية لسعر السيارة (حيث أن السيارة ملك للبائع)، وتكون العلاقة الضريبية في سعر السيارة بين البائع والمشتري مباشرة.
                  </li>
                </ol>
              </div>
            </section>

            {/* 7 */}
            <section id="example" className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Receipt className="h-5 w-5 text-primary" />
                7. مثال تطبيقي للفاتورة (للتوضيح)
              </div>

              <div className="mt-3 rounded-xl border border-border bg-background p-4 text-sm">
                <div className="font-semibold">السيناريو:</div>
                <div className="text-muted-foreground mt-1 leading-relaxed">
                  شراء سيارة بـ <span className="font-semibold text-foreground">60,000</span> ريال (الفئة الثانية)
                  من بائع فرد عبر بطاقة فيزا محلية.
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto bg-background">
                  <table className="min-w-[720px] w-full text-sm">
                    <thead className="bg-card">
                      <tr className="border-b border-border">
                        <th className="text-right p-4 font-semibold">البند</th>
                        <th className="text-right p-4 font-semibold">الحسبة</th>
                        <th className="text-right p-4 font-semibold">المبلغ (ر.س)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">سعر المركبة</td>
                        <td className="p-4">--</td>
                        <td className="p-4">60,000</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">رسوم نقل الملكية</td>
                        <td className="p-4">ثابت</td>
                        <td className="p-4">600</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">عمولة المنصة</td>
                        <td className="p-4">الفئة الثانية</td>
                        <td className="p-4">700</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">ضريبة العمولة</td>
                        <td className="p-4">15% من 700</td>
                        <td className="p-4">105</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">المجموع قبل الرسوم البنكية</td>
                        <td className="p-4">--</td>
                        <td className="p-4">61,405</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">رسوم بوابة الدفع (فيزا)</td>
                        <td className="p-4">(2.5% × 61,405) + 1</td>
                        <td className="p-4">1,536.12</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-4 font-medium">ضريبة بوابة الدفع</td>
                        <td className="p-4">15% من 1,536.12</td>
                        <td className="p-4">230.42</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-bold">الإجمالي النهائي على البطاقة</td>
                        <td className="p-4 font-bold">--</td>
                        <td className="p-4 font-bold">63,171.54 ريال</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-background p-4">
                <div className="font-semibold">اعتماد:</div>
                <div className="text-muted-foreground mt-1">إدارة منصة DASM-e</div>
              </div>
            </section>

            {/* Back links */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <LoadingLink
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                الرجوع إلى سياسة الخصوصية
              </LoadingLink>

              <LoadingLink
                href="/terms"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                عرض الشروط والأحكام
              </LoadingLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;
