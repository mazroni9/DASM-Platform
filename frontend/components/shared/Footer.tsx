import LoadingLink from "@/components/LoadingLink";
import Image from "next/image";
import type { ReactNode } from "react";
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
  Users,
} from "lucide-react";

/** =========================
 *  Payment Logos (More Compact + Professional)
 *  ========================= */

const LogoCard = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  return (
    <div
      title={title}
      aria-label={title}
      className="
        flex items-center justify-center
        rounded-2xl border border-border/70
        bg-white dark:bg-white
        shadow-sm transition
        hover:shadow-md
        px-3
        h-[52px]
      "
    >
      {children}
    </div>
  );
};

const PaymentLogo = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <div className="relative w-[72px] h-[22px] sm:w-[80px] sm:h-[24px] overflow-hidden">
      <Image
        src={src}
        alt={alt}
        title={alt}
        fill
        className="object-contain"
        sizes="(max-width: 640px) 72px, 80px"
        priority={false}
      />
    </div>
  );
};

/** =========================
 *  Twitter Bird
 *  ========================= */
const TwitterBirdIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    role="img"
    aria-label="Twitter"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Twitter</title>
    <path
      fill="currentColor"
      d="M19.944 7.926c.013.18.013.36.013.54 0 5.49-4.18 11.82-11.82 11.82-2.35 0-4.53-.69-6.37-1.88.33.04.65.05.99.05 1.94 0 3.73-.66 5.15-1.78-1.82-.03-3.35-1.23-3.88-2.88.25.04.5.06.77.06.36 0 .73-.05 1.07-.14-1.9-.38-3.33-2.06-3.33-4.07v-.05c.55.31 1.19.5 1.86.52-1.12-.75-1.86-2.03-1.86-3.48 0-.77.21-1.48.57-2.1 2.03 2.5 5.08 4.14 8.51 4.31-.06-.3-.1-.61-.1-.93 0-2.25 1.82-4.08 4.08-4.08 1.17 0 2.23.49 2.97 1.29.93-.18 1.8-.52 2.58-.99-.3.95-.95 1.75-1.79 2.25.82-.1 1.61-.32 2.34-.64-.55.81-1.24 1.52-2.04 2.09Z"
    />
  </svg>
);

/** =========================
 *  Social Icon Button
 *  ========================= */
const SocialIconButton = ({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) => {
  const isMail = href.startsWith("mailto:");

  return (
    <a
      href={href}
      target={isMail ? undefined : "_blank"}
      rel={isMail ? undefined : "noopener noreferrer"}
      aria-label={label}
      title={label}
      className="
        inline-flex items-center justify-center
        h-11 w-11
        rounded-xl
        border border-primary/20
        bg-primary/10
        text-primary
        hover:bg-primary/15
        hover:border-primary/30
        transition
        shadow-sm
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background
      "
    >
      {children}
    </a>
  );
};

/** =========================
 *  Team Link Row
 *  ========================= */
const TeamLinkRow = () => {
  const href = "https://maz-and-devloper-profile.vercel.app/";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="
        group flex items-center justify-between
        rounded-xl border border-border
        bg-background/40
        px-4 py-3
        hover:bg-background hover:border-border
        transition
      "
      aria-label="Maz - ملف المطور"
      title="Maz - ملف المطور"
    >
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
        <span className="text-primary">
          <Users className="h-4 w-4" />
        </span>
        Maz (Developer Profile)
      </span>

      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </a>
  );
};

type Payment = {
  key: string;
  title: string;
  node: ReactNode;
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { href: "mailto:mazroni@dasm.host", label: "البريد", icon: <Mail className="h-5 w-5" /> },
    { href: "https://snapchat.com/t/4IDzLfrK", label: "Snapchat", icon: <Ghost className="h-5 w-5" /> },
    {
      href: "https://www.instagram.com/dasm_net?igsh=eW44aW5mcWFkcjkw&utm_source=qr",
      label: "Instagram",
      icon: <Instagram className="h-5 w-5" />,
    },
    { href: "https://www.tiktok.com/@dasm0202", label: "TikTok", icon: <Music2 className="h-5 w-5" /> },
    { href: "https://x.com/DASM0909", label: "Twitter", icon: <TwitterBirdIcon className="h-5 w-5" /> },
  ];

  const policyLinks = [
    { href: "/privacy", label: "سياسة الخصوصية", icon: <ShieldCheck className="h-4 w-4" /> },
    { href: "/terms", label: "الشروط والأحكام", icon: <Scale className="h-4 w-4" /> },
    { href: "/fees-and-subscriptions", label: "سياسة الرسوم والاشتراكات", icon: <Gavel className="h-4 w-4" /> },
  ];

  const payments: Payment[] = [
    { key: "amex", title: "American Express", node: <PaymentLogo src="/payments/amex.png" alt="American Express" /> },
    { key: "mc", title: "Mastercard", node: <PaymentLogo src="/payments/mastercard.png" alt="Mastercard" /> },
    { key: "visa", title: "Visa", node: <PaymentLogo src="/payments/visa.png" alt="Visa" /> },
    { key: "mada", title: "Mada", node: <PaymentLogo src="/payments/mada.png" alt="Mada" /> },
    { key: "samsung", title: "Samsung Pay", node: <PaymentLogo src="/payments/samsung-pay.png" alt="Samsung Pay" /> },
    { key: "apple", title: "Apple Pay", node: <PaymentLogo src="/payments/apple-pay.png" alt="Apple Pay" /> },
    { key: "stc", title: "STC Bank", node: <PaymentLogo src="/payments/stc-bank.png" alt="STC Bank" /> },
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Brand */}
          <div className="lg:col-span-8 h-full">
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 sm:p-6 shadow-sm h-full flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold tracking-tight">منصة DASMe</div>
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
                منصة وطنية رقمية تُعيد تعريف تجربة المزادات عبر تقنيات ذكية، شفافية مطلقة، ووصول عالمي.
                هدفنا تجربة واضحة، سريعة، وموثوقة للجميع.
              </p>

              {/* ✅ نقل من نحن + الأسئلة الشائعة بجانب كيف نعمل */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <LoadingLink
                  href="/how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold hover:bg-border/60 transition"
                >
                  كيف نعمل
                  <Gavel className="h-4 w-4 text-primary" />
                </LoadingLink>

                <LoadingLink
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold hover:bg-border/60 transition"
                >
                  من نحن
                  <Sparkles className="h-4 w-4 text-primary" />
                </LoadingLink>

                <LoadingLink
                  href="/faq"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold hover:bg-border/60 transition"
                >
                  الأسئلة الشائعة
                  <HelpCircle className="h-4 w-4 text-primary" />
                </LoadingLink>
              </div>

              <div className="mt-auto pt-6">
                <div className="rounded-xl border border-border bg-background/60 p-4">
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
          </div>

          {/* Policies + Team */}
          <div className="lg:col-span-4 h-full">
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 sm:p-6 shadow-sm h-full flex flex-col">
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

              <div className="mt-auto pt-6">
                <div className="text-sm font-bold mb-3">فريق الدواسم</div>
                <div className="space-y-2">
                  <TeamLinkRow />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ وسائل الدفع */}
        <div className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold">وسائل الدفع المتاحة</div>
            <div className="hidden sm:block text-xs text-muted-foreground">آمن — سريع — موثوق</div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {payments.map((p) => (
              <LogoCard key={p.key} title={p.title}>
                {p.node}
              </LogoCard>
            ))}
          </div>
        </div>

        {/* ✅ Social Icons */}
        <div className="mt-10">
          <div className="flex items-center justify-center gap-2">
            {socialLinks.map((s) => (
              <SocialIconButton key={s.href} href={s.href} label={s.label}>
                {s.icon}
              </SocialIconButton>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-border pt-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-muted-foreground text-center md:text-right">
            © {currentYear} منصة DASMe. جميع الحقوق محفوظة.
          </div>

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
        </div>
      </div>
    </footer>
  );
};

export default Footer;
