'use client';

import { Building2, ShieldCheck } from 'lucide-react';

const AboutPage = () => {
  return (
    <main className="container mx-auto p-8 bg-white rounded-lg shadow my-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 flex items-center justify-center gap-3">
        <Building2 size={32} />
        من نحن - منصة DASM-e
      </h1>

      <div className="prose prose-lg max-w-none text-right space-y-6" dir="rtl">
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">التعريف القانوني للمنصة</h2>
          </div>
          
          <div className="space-y-4 text-gray-700">
            <p className="leading-relaxed">
              منصة DASM-e هي منصة إلكترونية متخصصة في تقديم خدمات المزادات الرقمية المباشرة، انطلاقًا من النشاط التجاري الرسمي لمعرض محمد أحمد الزهراني وإخوانه لتجارة السيارات.
            </p>

            <p className="leading-relaxed">
              لا تُعد المنصة جهة مالية، ولا تُقدم خدمات الدفع الإلكتروني، أو التمويل البنكي، أو الإقراض النقدي.
            </p>

            <p className="leading-relaxed">
              جميع الأرصدة الظاهرة في حسابات المستخدمين تُعبّر عن "رصيد داخلي" يُستخدم حصريًا داخل نظام المزادات، ولا يُعتبر وديعة مالية، ولا يخضع لتنظيمات البنوك أو مزودي خدمات المدفوعات.
            </p>

            <p className="leading-relaxed">
              المنصة تلتزم بربط كل محفظة داخلية برقم حساب بنكي (آيبان) وهوية وطنية موثقة، ويتم تحويل الأرصدة بناءً على طلب المستخدم عبر شركاء التحويل المعتمدين فقط.
            </p>

            <p className="leading-relaxed">
              باستخدامك المنصة، فأنت تقر وتوافق أن جميع عملياتك المالية تتم في نطاق الاشتراك في خدمات المزادات، دون أي التزام تعاقدي من المنصة بتقديم تمويل أو أرباح أو تحويلات مالية خارجة عن هذا الإطار.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AboutPage; 