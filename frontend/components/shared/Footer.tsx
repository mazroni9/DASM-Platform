import LoadingLink from "@/components/LoadingLink";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  Instagram,
  Mail,
  Ghost,
  Music2,
  Users,
  Book,
  Send,
  Home,
  Info,
  Settings,
  HelpCircle,
  CreditCard,
  TvMinimalPlay,
  Layers,
  ChevronLeft,
  Link as LinkIcon,
  AtSign,
} from "lucide-react";

/** =========================
 *  Payment Logo Card
 *  ========================= */
const LogoCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div
    title={title}
    aria-label={title}
    className="
      flex items-center justify-center
      rounded-lg
      bg-white
      shadow-sm
      px-3 py-1.5
      h-9 sm:h-10
      shrink-0
      hover:shadow-md
      hover:scale-105
      transition-all duration-300
    "
  >
    {children}
  </div>
);

const PaymentLogo = ({ src, alt }: { src: string; alt: string }) => (
  <div className="relative w-16 h-5 sm:w-20 sm:h-6 overflow-hidden">
    <Image
      src={src}
      alt={alt}
      title={alt}
      fill
      className="object-contain"
      sizes="(max-width: 640px) 64px, 80px"
      priority={false}
    />
  </div>
);

/** =========================
 *  Twitter Bird (X)
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
        h-9 w-9
        rounded-full
        bg-white/10
        text-white/80
        hover:bg-gradient-to-br hover:from-cyan-400 hover:to-blue-500
        hover:text-white
        hover:scale-110
        transition-all duration-300
      "
    >
      {children}
    </a>
  );
};

/** =========================
 *  Team Icon Link
 *  ========================= */
const TeamIconLink = () => (
  <a
    href="https://maz-and-devloper-profile.vercel.app/"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="فريق الدواسم"
    title="فريق الدواسم"
    className="
      inline-flex items-center gap-1.5
      h-9 px-4
      rounded-full
      bg-gradient-to-r from-cyan-500/20 to-blue-500/20
      border border-cyan-400/30
      text-white text-xs font-semibold
      hover:from-cyan-500/30 hover:to-blue-500/30
      hover:scale-105
      transition-all duration-300
    "
  >
    <Users className="h-3.5 w-3.5" />
    <span>فريق الدواسم</span>
  </a>
);

/** =========================
 *  Nav Link with Icon
 *  ========================= */
const NavLink = ({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) => (
  <LoadingLink
    href={href}
    className="
      group
      w-full
      inline-flex items-center justify-center
      gap-2
      px-4 py-2.5
      rounded-2xl
      bg-white/5
      text-white/70
      hover:bg-white/10
      hover:text-cyan-300
      transition-all duration-300
      text-sm font-semibold
    "
  >
    <span className="text-white/50 group-hover:text-cyan-300 transition-colors">
      {icon}
    </span>
    {label}
  </LoadingLink>
);

/** =========================
 *  Feature Link
 *  ========================= */
const FeatureLink = ({
  href,
  title,
  subtitle,
  icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
}) => (
  <LoadingLink href={href} className="group block">
    <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md px-5 py-5 min-h-[96px] hover:bg-white/[0.08] transition-all duration-300">
      <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-cyan-200 group-hover:text-white transition-colors">
            {icon}
          </div>
          <div className="text-right">
            <div className="text-white font-extrabold text-base sm:text-lg leading-tight">
              {title}
            </div>
            <div className="text-white/55 text-xs sm:text-sm font-medium mt-1">
              {subtitle}
            </div>
          </div>
        </div>
        <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:text-cyan-300 group-hover:border-cyan-400/30 transition-all">
          <ChevronLeft className="h-5 w-5" />
        </div>
      </div>
    </div>
  </LoadingLink>
);

type Payment = { key: string; title: string; node: ReactNode };

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { href: "/", label: "الرئيسية", icon: <Home className="h-4 w-4" /> },
    { href: "/about", label: "من نحن", icon: <Info className="h-4 w-4" /> },
    { href: "/how-it-works", label: "كيف نعمل", icon: <Settings className="h-4 w-4" /> },
    { href: "/faq", label: "الأسئلة الشائعة", icon: <HelpCircle className="h-4 w-4" /> },
    { href: "/blog", label: "المدونة", icon: <Book className="h-4 w-4" /> },
  ];

  const socialLinks = [
    { href: "mailto:mazroni@dasm.host", label: "البريد", icon: <Mail className="h-4 w-4" /> },
    { href: "https://snapchat.com/t/4IDzLfrK", label: "Snapchat", icon: <Ghost className="h-4 w-4" /> },
    {
      href: "https://www.instagram.com/dasm_net?igsh=eW44aW5mcWFkcjkw&utm_source=qr",
      label: "Instagram",
      icon: <Instagram className="h-4 w-4" />,
    },
    { href: "https://www.tiktok.com/@dasm0202", label: "TikTok", icon: <Music2 className="h-4 w-4" /> },
    { href: "https://x.com/DASM0909", label: "Twitter", icon: <TwitterBirdIcon className="h-4 w-4" /> },
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
    <footer
      dir="rtl"
      className="
        relative w-full
        bg-gradient-to-br from-[#0a1628] via-[#0d2847] to-[#0a1628]
        text-white
        border-t border-white/5
        /* تم إزالة تحديد الارتفاع و overflow-hidden */
      "
    >
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 right-0 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-0 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl" />
      </div>

      {/* ✅ Layout now grows with content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* TOP: Payments */}
        <div className="shrink-0 px-4 sm:px-8 lg:px-12 pt-4 pb-3 border-b border-white/10">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-[11px] text-white/50 font-semibold">
              <CreditCard className="h-4 w-4" />
              <span>وسائل الدفع المعتمدة</span>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {payments.map((p) => (
                <LogoCard key={p.key} title={p.title}>
                  {p.node}
                </LogoCard>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE: Content Area (No Scroll) */}
        <div className="flex-1 px-4 sm:px-8 lg:px-12 py-3">
          <div className=""> {/* تم إزالة overflow-y-auto و h-full */}
            <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
              
              {/* RIGHT: Feature Links */}
              <div className="lg:col-span-5">
                <div className="flex flex-col gap-3">
                  <FeatureLink
                    href="/auctions"
                    title="الأسواق الرقمية"
                    subtitle="تصفّح الأسواق والمزادات"
                    icon={<TvMinimalPlay className="h-6 w-6" />}
                  />
                  <FeatureLink
                    href="/similar-price-analysis"
                    title="تحليل السيارات المشابهة"
                    subtitle="قارن الأسعار واتخذ قرارك"
                    icon={<Layers className="h-6 w-6" />}
                  />
                </div>
              </div>

              {/* LEFT: unified block */}
              <div className="lg:col-span-7">
                <div className="rounded-3xl bg-white/[0.04] backdrop-blur-md p-4 sm:p-5 flex flex-col gap-4">
                  
                  {/* Quick Links */}
                  <div>
                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                      <div className="h-9 w-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <LinkIcon className="h-4 w-4 text-cyan-300" />
                      </div>
                      <h3 className="text-sm sm:text-base font-extrabold text-white/80">
                        روابط سريعة
                      </h3>
                    </div>
                    <nav className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 auto-rows-fr">
                      {navLinks.map((l) => (
                        <NavLink key={l.href} href={l.href} label={l.label} icon={l.icon} />
                      ))}
                    </nav>
                  </div>

                  <div className="h-px bg-white/10" />

                  {/* Newsletter */}
                  <div>
                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                      <div className="h-9 w-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <AtSign className="h-4 w-4 text-cyan-300" />
                      </div>
                      <h3 className="text-sm sm:text-base font-extrabold text-white/80">
                        النشرة البريدية
                      </h3>
                    </div>
                    <form
                      className="
                        w-full
                        flex items-center
                        rounded-2xl
                        bg-white/5
                        border border-white/10
                        hover:border-cyan-400/30
                        transition-colors
                        overflow-hidden
                      "
                      onSubmit={(e) => e.preventDefault()}
                    >
                      <input
                        type="email"
                        dir="ltr"
                        placeholder="your@email.com"
                        className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none"
                      />
                      <button
                        type="submit"
                        className="
                          shrink-0 m-1 px-4 py-2.5 rounded-xl
                          bg-gradient-to-r from-cyan-500 to-blue-500
                          hover:from-cyan-400 hover:to-blue-400
                          text-white text-xs font-extrabold
                          transition-all
                          flex items-center gap-1.5
                          hover:shadow-lg hover:shadow-cyan-500/20
                        "
                      >
                        <Send className="h-3.5 w-3.5 rotate-180" />
                        اشترك
                      </button>
                    </form>
                    <p className="mt-2 text-[11px] text-white/40">
                      اشترك لتصلك التحديثات والعروض.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: Social + Copyright */}
        <div className="shrink-0 px-4 sm:px-8 lg:px-12 pt-3 pb-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {socialLinks.map((s) => (
                <SocialIconButton key={s.href} href={s.href} label={s.label}>
                  {s.icon}
                </SocialIconButton>
              ))}
              <div className="w-[1px] h-6 bg-white/10 mx-1" />
              <TeamIconLink />
            </div>
            <div className="flex items-center gap-3 text-[11px] text-white/40">
              <span>© {currentYear} DASMe. جميع الحقوق محفوظة</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                آمن • سريع • موثوق
              </span>
            </div>
          </div>
          {/* iPhone safe area */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
