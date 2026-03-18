'use client';

import { Sparkles, Zap, Heart } from 'lucide-react';

const WhyDasmPage = () => {
  return (
    <main className="container mx-auto p-8 bg-card rounded-lg shadow my-8" dir="rtl">
      <div className="prose prose-lg max-w-none text-right space-y-8">
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">لماذا «داسم»؟ ولماذا الآن؟</h2>
          </div>
          <div className="space-y-4 text-foreground">
            <p className="leading-relaxed">
              في لغتنا، «الدسم» هو الجوهر الغني بالقيمة، الثقيل بفائدته، والوافي في عطائه.
            </p>
            <p className="leading-relaxed">
              لم نطلق هذا الاسم لمجرد التميز، بل ليكون وعدًا لكل من يبحث عن منصة تُقدّر الجوهر وتمنحه الثقل الذي يستحقه. نحن لا نعرض أصولًا فحسب، بل نعيد لها وزنها الحقيقي في سوقٍ ازدحم بالضجيج وخفّت فيه المعايير.
            </p>
            <p className="leading-relaxed">
              لكن لماذا الآن؟
            </p>
            <p className="leading-relaxed">
              لأن سوق الأصول المستعملة — من السيارات إلى العقار والمنتجات المجددة — أصبح واسعًا ومؤثرًا، لكنه يعاني من تشتت المعلومات، وتفاوت التسعير، وضعف الشفافية. الإعلانات كثرت، الثقة تراجعت، والقرارات أصبحت تُتخذ تحت ضغط لا تحت وضوح.
            </p>
            <p className="leading-relaxed">
              وفي المقابل، نضجت البنية الرقمية: البث المباشر، الدفع الإلكتروني، المحافظ الذكية، والتحليل القائم على البيانات. أصبح ممكنًا تقنيًا واقتصاديًا بناء سوق منظم، لا مجرد منصة إعلانات.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">هنا تأتي داسم</h2>
          </div>
          <div className="space-y-4 text-foreground">
            <p className="leading-relaxed">
              داسم ليست مجرد منصة مزادات — بل نظام سوق رقمي يعيد تنظيم البيع والشراء عبر مزاد مباشر، ومزاد فوري، وأدوات تسعير ذكية، وشفافية كاملة في حركة السعر.
            </p>
            <p className="leading-relaxed">
              وجهتك نحو القيمة الحقيقية، حيث تصبح الفرص في متناول الجميع، والخبرة ليست شرطًا للدخول.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">رسالتنا واضحة</h2>
          <div className="space-y-4 text-foreground">
            <p className="leading-relaxed">
              لقد جئنا لنساعد لا لنربك السوق، لنكون السند لكل من يطمح للأفضل، ونمنح كل مشارك أدوات واضحة وتجربة عادلة، سواء كان بائعًا، مشتريًا، أو مستثمرًا.
            </p>
            <p className="leading-relaxed">
              من سوق المعارض إلى الحراج المباشر، ومن السيارات إلى العقار والمنتجات المجددة، نجمع الأصول في مكان واحد موثوق، حيث تصبح القيمة مرئية، والقرار مبنيًا على معلومات، والمشاركة قائمة على الشفافية.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">داسم لمن لا داسم له ...</h2>
          </div>
          <div className="space-y-4 text-foreground">
            <ul className="list-disc list-inside space-y-2">
              <li>سهولة الوصول.</li>
              <li>تقنيات حديثة.</li>
              <li>فرص حقيقية.</li>
            </ul>
            <p className="leading-relaxed font-semibold">
              لأن كل شخص يستحق فرصة عادلة
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default WhyDasmPage;
