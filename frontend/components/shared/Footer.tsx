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
      h-10
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
      inline-flex items-center gap-2
      px-4 py-2
      rounded-full
      bg-white/5
      border border-white/10
      text-white/70
      hover:bg-white/10
      hover:border-cyan-400/30
      hover:text-cyan-400
      transition-all duration-300
      text-sm font-medium
    "
  >
    <span className="text-white/50 group-hover:text-cyan-400 transition-colors">
      {icon}
    </span>
    {label}
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
      "
    >
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 right-0 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-0 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-8 lg:px-12 py-8">
        {/* ========== 1. Payment Methods (TOP) ========== */}
        <div className="flex flex-col items-center gap-3 pb-6 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/50 font-medium">
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

        {/* ========== 2. Main Content (✅ FIXED LAYOUT) ========== */}
        {/* بدل justify-between اللي كان يخلق فراغ ضخم، استخدمنا Grid + max width داخلي */}
        <div className="py-8">
          <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* RIGHT: Brand Section */}
            <div className="lg:col-span-5 text-center lg:text-right">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight bg-gradient-to-l from-white to-cyan-200 bg-clip-text text-transparent">
                منصة DASMe
              </h2>

              <p className="mt-3 text-lg sm:text-xl text-white/60 leading-relaxed font-medium">
                Digital Auctions Specialists Markets
              </p>
              <p className="mt-1 text-base sm:text-lg text-white/45 font-medium">
                منصتك الموثوقة للمزادات الرقمية
              </p>

              <a
                href="mailto:mazroni@dasm.host"
                className="mt-4 inline-flex items-center gap-2 text-base sm:text-lg text-cyan-400/80 hover:text-cyan-300 transition-colors"
              >
                <Mail className="h-4 w-4" />
                mazroni@dasm.host
              </a>
            </div>

            {/* LEFT: Nav + Newsletter */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left">
              {/* Nav Links with Icons */}
              <div>
                <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center justify-center lg:justify-start gap-2">
                  روابط سريعة
                  <span className="w-8 h-[1px] bg-gradient-to-r from-cyan-400/50 to-transparent hidden lg:block" />
                </h3>
                <nav className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  {navLinks.map((l) => (
                    <NavLink key={l.href} href={l.href} label={l.label} icon={l.icon} />
                  ))}
                </nav>
              </div>

              {/* Newsletter */}
              <div>
                <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center justify-center lg:justify-start gap-2">
                  النشرة البريدية
                  <span className="w-8 h-[1px] bg-gradient-to-r from-cyan-400/50 to-transparent hidden lg:block" />
                </h3>

                <form
                  className="
                    w-full max-w-md
                    mx-auto lg:mx-0
                    flex items-center
                    rounded-full
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
                    className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none"
                  />
                  <button
                    type="submit"
                    className="
                      shrink-0 m-1 px-4 py-2 rounded-full
                      bg-gradient-to-r from-cyan-500 to-blue-500
                      hover:from-cyan-400 hover:to-blue-400
                      text-white text-xs font-bold
                      transition-all
                      flex items-center gap-1.5
                      hover:shadow-lg hover:shadow-cyan-500/20
                    "
                  >
                    <Send className="h-3.5 w-3.5 rotate-180" />
                    اشترك
                  </button>
                </form>

                <p className="mt-2 text-xs text-white/40">احصل على آخر التحديثات والعروض الحصرية</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== 3. Bottom: Social + Copyright ========== */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Social Icons */}
          <div className="flex items-center gap-2">
            {socialLinks.map((s) => (
              <SocialIconButton key={s.href} href={s.href} label={s.label}>
                {s.icon}
              </SocialIconButton>
            ))}
            <div className="w-[1px] h-6 bg-white/10 mx-1" />
            <TeamIconLink />
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>© {currentYear} DASMe. جميع الحقوق محفوظة</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              آمن • سريع • موثوق
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
