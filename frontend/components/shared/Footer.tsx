// src/components/shared/Footer.tsx
import LoadingLink from "@/components/LoadingLink";
import {
  ArrowUpRight,
  Gavel,
  HelpCircle,
  Mail,
  Scale,
  ShieldCheck,
  Sparkles,
  Book,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const mainLinks = [
    { href: "/about", label: "من نحن", icon: <Sparkles className="h-4 w-4" /> },
    { href: "/how-it-works", label: "كيف نعمل", icon: <Gavel className="h-4 w-4" /> },
    { href: "/auctions", label: "الأسواق الرقمية", icon: <ArrowUpRight className="h-4 w-4" /> },
    { href: "/faq", label: "الأسئلة الشائعة", icon: <HelpCircle className="h-4 w-4" /> },
  ];

  const policyLinks = [
    { href: "/privacy", label: "سياسة الخصوصية", icon: <ShieldCheck className="h-4 w-4" /> },
    { href: "/terms", label: "الشروط والأحكام", icon: <Scale className="h-4 w-4" /> },
    { href: "/fees-and-subscriptions", label: "سياسة الرسوم والاشتراكات", icon: <Gavel className="h-4 w-4" /> },
  ];

  return (
    <footer dir="rtl" className="relative overflow-hidden border-t border-border bg-background text-foreground">
      {/* Soft background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 left-10 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-10 sm:py-12 relative">
        {/* Top grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 sm:p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    منصة DASMe
                  </div>
                  <div className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Digital Auctions Specialists Markets
                  </div>
                </div>

                <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  شفافية + مزادات رقمية
                </div>
              </div>

              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                منصة وطنية رقمية تُعيد تعريف تجربة المزادات عبر تقنيات ذكية،
                شفافية مطلقة، ووصول عالمي. هدفنا تجربة واضحة، سريعة، وموثوقة للجميع.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <LoadingLink
                  href="/auctions"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-4 py-3 text-sm font-bold hover:bg-primary/90 transition"
                >
                  استكشف الأسواق
                  <ArrowUpRight className="h-4 w-4" />
                </LoadingLink>

                <LoadingLink
                  href="/how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold hover:bg-border/60 transition"
                >
                  كيف نعمل
                  <Gavel className="h-4 w-4 text-primary" />
                </LoadingLink>
              </div>

              <div className="mt-6 rounded-xl border border-border bg-background/60 p-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">الدعم والبريد</span>
                </div>
                <a
                  href="mailto:mazroni@dasm.host"
                  className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors break-all"
                >
                  mazroni@dasm.host
                </a>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 sm:p-6 shadow-sm h-full">
              <div className="text-sm font-bold">روابط مهمة</div>

              <nav aria-label="روابط مهمة" className="mt-4">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mainLinks.map((l) => (
                    <li key={l.href}>
                      <LoadingLink
                        href={l.href}
                        className="group flex items-center justify-between rounded-xl border border-transparent bg-background/40 px-4 py-3 hover:bg-background hover:border-border transition"
                      >
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          <span className="text-primary">{l.icon}</span>
                          {l.label}
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </LoadingLink>
                    </li>
                  ))}

                  {/* ✅ المدونة هنا بدل النافبار */}
                  <li>
                    <a
                      href="https://blog.dasm.com.sa/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-xl border border-transparent bg-background/40 px-4 py-3 hover:bg-background hover:border-border transition"
                    >
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        <span className="text-primary">
                          <Book className="h-4 w-4" />
                        </span>
                        المدونة
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  </li>
                </ul>
              </nav>

              <div className="mt-6 text-xs text-muted-foreground leading-relaxed">
                تقدر تراجع{" "}
                <LoadingLink href="/faq" className="text-primary hover:underline">
                  الأسئلة الشائعة
                </LoadingLink>{" "}
                قبل التواصل لتصل لأقرب إجابة بسرعة.
              </div>
            </div>
          </div>

          {/* Policies */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 sm:p-6 shadow-sm h-full">
              <div className="text-sm font-bold">السياسات</div>

              <ul className="mt-4 space-y-2">
                {policyLinks.map((l) => (
                  <li key={l.href}>
                    <LoadingLink
                      href={l.href}
                      className="group flex items-center justify-between rounded-xl px-3 py-2 hover:bg-background/60 transition"
                    >
                      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                        <span className="text-primary">{l.icon}</span>
                        <span className="relative">
                          {l.label}
                          <span className="absolute right-0 -bottom-1 h-[2px] w-0 bg-primary/70 transition-all duration-300 group-hover:w-full" />
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </LoadingLink>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-xl border border-border bg-background/60 p-4">
                <div className="text-xs text-muted-foreground leading-relaxed">
                  الاطلاع على السياسات يضمن تجربة واضحة قبل الاشتراك أو المشاركة في المزادات.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-border pt-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-muted-foreground text-center md:text-right">
            © {currentYear} منصة DASMe. جميع الحقوق محفوظة.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
            <LoadingLink
              href="/privacy"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              سياسة الخصوصية
            </LoadingLink>
            <span className="text-border">|</span>
            <LoadingLink
              href="/terms"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              الشروط والأحكام
            </LoadingLink>
            <span className="text-border">|</span>
            <LoadingLink
              href="/fees-and-subscriptions"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              الرسوم والاشتراكات
            </LoadingLink>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
