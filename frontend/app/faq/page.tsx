// frontend/app/faq/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import LoadingLink from "@/components/LoadingLink";
import { HelpCircle, Search, MessageCircle, ShieldCheck } from "lucide-react";

type FAQ = {
  question: string;
  answer: string;
};

export default function Page() {
  const faqs: FAQ[] = [
    {
      question: "كيف يمكنني المشاركة في المزاد؟",
      answer:
        "يمكنك المشاركة بالتسجيل في المنصة، ثم اختيار السيارة المناسبة ووضع مزايدتك خلال فترة المزاد.",
    },
    {
      question: "هل يمكنني استرجاع السيارة بعد الشراء؟",
      answer:
        "نعم، يوجد سياسة استرجاع محددة توضح شروط وإجراءات استرجاع السيارة في حال وجود عيوب خفية.",
    },
    {
      question: "ما هي طرق الدفع المتاحة؟",
      answer:
        "نوفر طرق دفع متعددة تشمل التحويل البنكي وبطاقات الائتمان والدفع الإلكتروني عبر منصات آمنة.",
    },
    {
      question: "كيف يتم فحص السيارات قبل المزاد؟",
      answer:
        "جميع السيارات تخضع لفحص فني دقيق يشمل المحرك، الهيكل، النظام الكهربائي، والتأكد من عدم وجود عيوب هيكلية.",
    },
  ];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );
  }, [query, faqs]);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

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
              <span className="text-foreground">الأسئلة الشائعة</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                    الأسئلة الشائعة
                  </h1>
                  <p className="text-muted-foreground leading-relaxed max-w-3xl">
                    هنا تجد إجابات واضحة لأكثر الأسئلة شيوعًا حول منصة DASMe للمزادات.
                    إذا لم تجد إجابتك، تواصل معنا وسنساعدك فورًا.
                  </p>
                </div>

                <div className="shrink-0 rounded-xl border border-border bg-background px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="font-semibold">معلومات موثوقة</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    مُحدّثة لتوضيح تجربة المزاد
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="mt-5">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ابحث داخل الأسئلة الشائعة..."
                    className="w-full rounded-2xl border border-border bg-background pr-11 pl-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {filtered.length} نتيجة
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-10">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-3 md:space-y-4">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-center">
                <HelpCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="font-semibold">لا توجد نتائج مطابقة</div>
                <div className="text-sm text-muted-foreground mt-1">
                  جرّب كلمات بحث مختلفة أو تواصل معنا.
                </div>
              </div>
            ) : (
              filtered.map((faq, index) => (
                <motion.div
                  key={`${faq.question}-${index}`}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className="bg-card rounded-xl md:rounded-2xl overflow-hidden border border-border hover:border-border transition-colors duration-300"
                >
                  <button
                    className="w-full text-right p-4 md:p-6 flex justify-between items-center text-foreground font-medium text-base md:text-lg hover:bg-border transition-colors duration-200"
                    onClick={() => toggleFAQ(index)}
                    aria-expanded={activeIndex === index}
                    aria-controls={`faq-panel-${index}`}
                  >
                    <span className="flex-1 text-right pr-3 md:pr-4">
                      {faq.question}
                    </span>

                    <motion.div
                      animate={{ rotate: activeIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 9L12 15L18 9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  </button>

                  <motion.div
                    id={`faq-panel-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: activeIndex === index ? "auto" : 0,
                      opacity: activeIndex === index ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 md:p-6 pt-0 text-foreground border-t border-border text-sm md:text-base leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                </motion.div>
              ))
            )}
          </div>

          {/* CTA */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">ما زالت لديك أسئلة؟</div>
                <div className="text-sm text-muted-foreground">
                  تواصل معنا وسنساعدك بأسرع وقت.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <LoadingLink
                href="/terms"
                className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-border/60 transition"
              >
                الشروط والأحكام
              </LoadingLink>
              <LoadingLink
                href="/privacy"
                className="inline-flex items-center justify-center rounded-xl bg-primary text-white px-4 py-2 text-sm font-bold hover:bg-primary/90 transition"
              >
                سياسة الخصوصية
              </LoadingLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
