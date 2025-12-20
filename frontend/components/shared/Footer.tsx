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
  Instagram,
  Ghost,
  Music2,
} from "lucide-react";

/** =========================
 *  Inline SVG Logos (Guaranteed)
 *  ========================= */

const LogoCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      title={title}
      aria-label={title}
      className="
        flex items-center justify-center
        rounded-2xl border border-border/70
        bg-white dark:bg-white
        px-4 py-3
        shadow-sm transition
        hover:shadow-md
      "
    >
      {children}
    </div>
  );
};

const AmexLogo = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 180 70"
    role="img"
    aria-label="American Express"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>American Express</title>
    <rect x="0" y="0" width="180" height="70" rx="14" fill="#1A73E8" />
    <rect
      x="10"
      y="10"
      width="160"
      height="50"
      rx="10"
      fill="#0B4CC2"
      opacity="0.35"
    />
    <text
      x="90"
      y="45"
      textAnchor="middle"
      fontFamily="Arial, Helvetica, sans-serif"
      fontSize="32"
      fontWeight="900"
      fill="#FFFFFF"
      letterSpacing="1"
    >
      AMEX
    </text>
  </svg>
);

const MastercardLogo = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 200 70"
    role="img"
    aria-label="Mastercard"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Mastercard</title>
    <g transform="translate(20,12)">
      <circle cx="52" cy="23" r="23" fill="#EB001B" />
      <circle cx="86" cy="23" r="23" fill="#F79E1B" />
      <path
        d="M69 0c7.8 4.4 13 12.8 13 23s-5.2 18.6-13 23c-7.8-4.4-13-12.8-13-23S61.2 4.4 69 0z"
        fill="#FF5F00"
      />
    </g>
    <text
      x="125"
      y="46"
      fontFamily="Arial, Helvetica, sans-serif"
      fontSize="22"
      fontWeight="800"
      fill="#111827"
    >
      mastercard
    </text>
  </svg>
);

const VisaLogo = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 200 70"
    role="img"
    aria-label="Visa"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Visa</title>
    <text
      x="90"
      y="48"
      textAnchor="middle"
      fontFamily="Arial Black, Arial, Helvetica, sans-serif"
      fontSize="44"
      fontWeight="900"
      fill="#1A3D8F"
      letterSpacing="-1"
    >
      VISA
    </text>
    <path
      d="M70 54h40"
      stroke="#F59E0B"
      strokeWidth="6"
      strokeLinecap="round"
    />
  </svg>
);

const MadaLogo = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 220 70"
    role="img"
    aria-label="Mada"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Mada</title>

    {/* bars */}
    <rect x="18" y="16" width="66" height="12" rx="6" fill="#1E88E5" />
    <rect x="18" y="34" width="66" height="12" rx="6" fill="#43A047" />

    {/* Arabic wordmark "مدى" - stylized */}
    <text
      x="140"
      y="46"
      textAnchor="middle"
      fontFamily="Tahoma, Arial, sans-serif"
      fontSize="34"
      fontWeight="900"
      fill="#111827"
    >
      مدى
    </text>

    {/* small latin */}
    <text
      x="192"
      y="46"
      textAnchor="end"
      fontFamily="Arial, Helvetica, sans-serif"
      fontSize="18"
      fontWeight="800"
      fill="#111827"
    >
      mada
    </text>
  </svg>
);

const SamsungPayLogo = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 240 70"
    role="img"
    aria-label="Samsung Pay"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Samsung Pay</title>
    <text
      x="88"
      y="32"
      textAnchor="middle"
      fontFamily="Arial Black, Arial, Helvetica, sans-serif"
      fontSize="22"
      fontWeight="900"
      fill="#111827"
      letterSpacing="1"
    >
      SAMSUNG
    </text>
    <text
      x="88"
      y="56"
      textAnchor="middle"
      fontFamily="Arial Black, Arial, Helvetica, sans-serif"
      fontSize="28"
      fontWeight="900"
      fill="#111827"
      letterSpacing="-0.5"
    >
      Pay
    </text>
  </svg>
);

const ApplePayLogo = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 240 70"
    role="img"
    aria-label="Apple Pay"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Apple Pay</title>

    {/* simple apple mark */}
    <path
      d="M70 38c0-10 8-18 18-18 1 0 2 0 3 .2 1-4 4-8 8-10-1 5-3 9-7 11 6 2 10 8 10 16 0 12-8 22-18 22S70 50 70 38z"
      fill="#111827"
    />
    <path
      d="M96 14c-2 2-5 3-8 3 .2-3 2-6 4-8 2-2 6-3 8-3-.1 3-2 6-4 8z"
      fill="#111827"
    />

    <text
      x="160"
      y="48"
      textAnchor="middle"
      fontFamily="Arial Black, Arial, Helvetica, sans-serif"
      fontSize="34"
      fontWeight="900"
      fill="#111827"
      letterSpacing="-1"
    >
      Pay
    </text>
  </svg>
);

const StcBankLogo = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 240 70"
    role="img"
    aria-label="STC Bank"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>STC Bank</title>
    <text
      x="70"
      y="46"
      textAnchor="middle"
      fontFamily="Arial Black, Arial, Helvetica, sans-serif"
      fontSize="42"
      fontWeight="900"
      fill="#6C2BD9"
      letterSpacing="-1"
    >
      STC
    </text>
    <text
      x="172"
      y="46"
      textAnchor="middle"
      fontFamily="Arial Black, Arial, Helvetica, sans-serif"
      fontSize="38"
      fontWeight="900"
      fill="#24B47E"
      letterSpacing="-0.5"
    >
      Bank
    </text>
  </svg>
);

/** =========================
 *  X (Twitter) Icon (Inline SVG)
 *  ========================= */
const XIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    role="img"
    aria-label="X (Twitter)"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>X (Twitter)</title>
    <path
      fill="currentColor"
      d="M18.285 2H21.7l-7.46 8.53L23 22h-7.27l-5.68-7.39L3.4 22H0l8.03-9.18L0 2h7.45l5.1 6.72L18.285 2Zm-1.27 18h1.89L7.04 3.93H5.01L17.015 20Z"
    />
  </svg>
);

type Payment = {
  key: string;
  title: string;
  node: React.ReactNode;
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const mainLinks = [
    { href: "/about", label: "من نحن", icon: <Sparkles className="h-4 w-4" /> },
    { href: "/how-it-works", label: "كيف نعمل", icon: <Gavel className="h-4 w-4" /> },
    { href: "/faq", label: "الأسئلة الشائعة", icon: <HelpCircle className="h-4 w-4" /> },
  ];

  const policyLinks = [
    { href: "/privacy", label: "سياسة الخصوصية", icon: <ShieldCheck className="h-4 w-4" /> },
    { href: "/terms", label: "الشروط والأحكام", icon: <Scale className="h-4 w-4" /> },
    { href: "/fees-and-subscriptions", label: "سياسة الرسوم والاشتراكات", icon: <Gavel className="h-4 w-4" /> },
  ];

  const socialLinks = [
    {
      href: "https://snapchat.com/t/4IDzLfrK",
      label: "Snapchat",
      icon: <Ghost className="h-4 w-4" />,
    },
    {
      href: "https://www.instagram.com/dasm_net?igsh=eW44aW5mcWFkcjkw&utm_source=qr",
      label: "Instagram",
      icon: <Instagram className="h-4 w-4" />,
    },
    {
      href: "https://www.tiktok.com/@dasm0202",
      label: "TikTok",
      icon: <Music2 className="h-4 w-4" />,
    },
    {
      href: "https://x.com/DASM0909",
      label: "Twitter",
      icon: <XIcon className="h-4 w-4" />,
    },
  ];

  const payments: Payment[] = [
    { key: "amex", title: "American Express", node: <AmexLogo className="h-9 w-auto" /> },
    { key: "mc", title: "Mastercard", node: <MastercardLogo className="h-9 w-auto" /> },
    { key: "visa", title: "Visa", node: <VisaLogo className="h-9 w-auto" /> },
    { key: "mada", title: "Mada", node: <MadaLogo className="h-9 w-auto" /> },
    { key: "samsung", title: "Samsung Pay", node: <SamsungPayLogo className="h-9 w-auto" /> },
    { key: "apple", title: "Apple Pay", node: <ApplePayLogo className="h-9 w-auto" /> },
    { key: "stc", title: "STC Bank", node: <StcBankLogo className="h-9 w-auto" /> },
  ];

  return (
    <footer
      dir="rtl"
      className="relative overflow-hidden border-t border-border bg-background text-foreground"
    >
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

        {/* ✅ وسائل الدفع (مضمون + ثابت في الداكن/الفاتح) */}
        <div className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold">وسائل الدفع المتاحة</div>
            <div className="hidden sm:block text-xs text-muted-foreground">
              آمن — سريع — موثوق
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {payments.map((p) => (
              <LogoCard key={p.key} title={p.title}>
                {p.node}
              </LogoCard>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-border pt-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-muted-foreground text-center md:text-right">
            © {currentYear} منصة DASMe. جميع الحقوق محفوظة.
          </div>

          {/* ✅ المدونة في النصف السفلي من الفوتر (بالنص) */}
          <LoadingLink
            href="/blog"
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-2 text-xs sm:text-sm text-muted-foreground hover:text-primary hover:bg-background transition-colors"
          >
            <span className="text-primary">
              <Book className="h-4 w-4" />
            </span>
            المدونة
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </LoadingLink>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {socialLinks.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1.5 text-xs sm:text-sm text-muted-foreground hover:text-primary hover:bg-background transition-colors"
              >
                <span className="text-primary">{s.icon}</span>
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
