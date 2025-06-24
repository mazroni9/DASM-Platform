'use client';

import { FileText, Shield, Users, Gavel, CreditCard, AlertTriangle, Scale, Car, Package, Clock, Building2 } from 'lucide-react';

const TermsPage = () => {
  return (
    <main className="container mx-auto p-8 bg-white rounded-lg shadow my-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 flex items-center justify-center gap-3">
         <FileText size={32} />
         الشروط والأحكام – منصة DASM-e
      </h1>
      
      <div className="prose prose-lg max-w-none text-right" dir="rtl">
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">التعريف القانوني للمنصة</h2>
          </div>
          <div className="space-y-4 text-gray-700">
            <p>
              منصة DASM-e هي منصة إلكترونية متخصصة في تقديم خدمات المزادات الرقمية المباشرة، انطلاقًا من النشاط التجاري الرسمي لمعرض محمد أحمد الزهراني وإخوانه لتجارة السيارات.
            </p>
            <p>
              لا تُعد المنصة جهة مالية، ولا تُقدم خدمات الدفع الإلكتروني، أو التمويل البنكي، أو الإقراض النقدي.
            </p>
            <p>
              جميع الأرصدة الظاهرة في حسابات المستخدمين تُعبّر عن "رصيد داخلي" يُستخدم حصريًا داخل نظام المزادات، ولا يُعتبر وديعة مالية، ولا يخضع لتنظيمات البنوك أو مزودي خدمات المدفوعات.
            </p>
            <p>
              المنصة تلتزم بربط كل محفظة داخلية برقم حساب بنكي (آيبان) وهوية وطنية موثقة، ويتم تحويل الأرصدة بناءً على طلب المستخدم عبر شركاء التحويل المعتمدين فقط.
            </p>
            <p>
              باستخدامك المنصة، فأنت تقر وتوافق أن جميع عملياتك المالية تتم في نطاق الاشتراك في خدمات المزادات، دون أي التزام تعاقدي من المنصة بتقديم تمويل أو أرباح أو تحويلات مالية خارجة عن هذا الإطار.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">العضوية والحسابات</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>يجب أن يكون عمر المستخدم 18 عاماً أو أكثر للتسجيل في المنصة.</li>
            <li>يجب تقديم معلومات دقيقة وصحيحة عند إنشاء الحساب.</li>
            <li>يحق للمنصة تعليق أو إنهاء أي حساب يخالف الشروط والأحكام.</li>
            <li>المستخدم مسؤول عن حماية معلومات حسابه وكلمة المرور.</li>
          </ul>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Gavel className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">المزادات والمزايدة</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>جميع المزايدات نهائية وملزمة قانونياً.</li>
            <li>يجب على المزايد التأكد من قدرته المالية قبل المزايدة.</li>
            <li>تحتفظ المنصة بحق إلغاء أي مزاد أو مزايدة مشبوهة.</li>
            <li>يمنع التواطؤ أو التلاعب في المزادات منعاً باتاً.</li>
          </ul>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">شروط خاصة بمزادات السيارات</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>يجب تقديم جميع وثائق السيارة المطلوبة قبل بدء المزاد.</li>
            <li>يجب الإفصاح عن أي عيوب أو حوادث سابقة للسيارة.</li>
            <li>يتحمل البائع مسؤولية صحة المعلومات المقدمة عن السيارة.</li>
            <li>تطبق رسوم فحص وتقييم خاصة على السيارات.</li>
          </ul>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">المنتجات والخدمات</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>يجب أن تكون جميع المنتجات المعروضة قانونية ومملوكة للبائع.</li>
            <li>يمنع عرض المنتجات المقلدة أو المسروقة.</li>
            <li>يجب وصف المنتج بدقة وذكر أي عيوب موجودة.</li>
            <li>تحتفظ المنصة بحق رفض أي منتج لا يتوافق مع سياساتها.</li>
          </ul>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">الدفع والعمولات</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>يجب دفع قيمة المزاد كاملة خلال 24 ساعة من إغلاق المزاد.</li>
            <li>عمولة المنصة تختلف حسب نوع المنتج وقيمة البيع.</li>
            <li>رسوم التسجيل والتقييم غير قابلة للاسترداد.</li>
            <li>يتم تطبيق ضريبة القيمة المضافة حسب القوانين المحلية.</li>
          </ul>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">مواعيد وإجراءات التسليم</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>يجب استلام المنتج خلال 48 ساعة من إتمام عملية الدفع.</li>
            <li>يتم التسليم في المواقع المحددة من قبل المنصة فقط.</li>
            <li>يجب توقيع محضر الاستلام والتأكد من حالة المنتج.</li>
            <li>المنصة غير مسؤولة عن النقل خارج مراكز التسليم المعتمدة.</li>
          </ul>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">التحكيم وحل النزاعات</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>تخضع جميع النزاعات للقوانين المحلية في المملكة العربية السعودية.</li>
            <li>تلتزم المنصة بالوساطة لحل النزاعات بين الأطراف.</li>
            <li>في حال تعذر الحل الودي، يتم اللجوء للجهات القضائية المختصة.</li>
            <li>قرارات المنصة في النزاعات الفنية والإجرائية نهائية وملزمة.</li>
          </ul>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">حدود المسؤولية</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>المنصة غير مسؤولة عن أي أضرار مباشرة أو غير مباشرة.</li>
            <li>المنصة وسيط بين البائع والمشتري وليست طرفاً في عملية البيع.</li>
            <li>المنصة غير مسؤولة عن صحة المعلومات المقدمة من المستخدمين.</li>
            <li>يتحمل المستخدم مسؤولية جميع قراراته وإجراءاته على المنصة.</li>
          </ul>
        </section>

        <p className="text-sm text-gray-500 mt-8 text-center">
          تحتفظ المنصة بحق تعديل هذه الشروط والأحكام في أي وقت. سيتم إخطار المستخدمين بأي تغييرات جوهرية.
        </p>
      </div>
    </main>
  );
};

export default TermsPage; 