import LoadingLink from "@/components/LoadingLink";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  Instagram,
  Mail,
  Users,
  Facebook,
  Home,
  Info,
  HelpCircle,
  BookOpen,
  LineChart,
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
      rounded-md
      bg-white/90
      px-3 py-2
      h-10
      shadow-sm
      border border-black/10
      transition-transform duration-300
      hover:scale-105
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
 *  Social Icon Button (square)
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
        h-12 w-12
        rounded-xl
        bg-white/5
        border border-white/10
        text-white/70
        hover:text-white
        hover:bg-white/10
        transition-all duration-300
      "
    >
      {children}
    </a>
  );
};

/** =========================
 *  Team Link
 *  ========================= */
const TeamLink = () => (
  <a
    href="https://maz-and-devloper-profile.vercel.app/"
    target="_blank"
    rel="noopener noreferrer"
    className="
      inline-flex items-center gap-2
      text-sm font-semibold
      text-cyan-300/90
      hover:text-cyan-200
      transition-colors
      whitespace-nowrap
    "
    aria-label="فريق داسم"
    title="فريق داسم"
  >
    <Users className="h-4 w-4" />
    فريق داسم
  </a>
);

type Payment = { key: string; title: string; node: ReactNode };

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // ✅ Nav مع أيقونات
  const navLinks = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/about", label: "من نحن", icon: Info },
    { href: "/faq", label: "الأسئلة الشائعة", icon: HelpCircle },
    { href: "/blog", label: "المدونة", icon: BookOpen },
    { href: "/similar-price-analysis", label: "تحليل السيارات", icon: LineChart, active: true },
  ];

  const socialLinks = [
    { href: "mailto:mazroni@dasm.host", label: "البريد", icon: <Mail className="h-5 w-5" /> },
    { href: "https://www.facebook.com/", label: "Facebook", icon: <Facebook className="h-5 w-5" /> },
    {
      href: "https://www.instagram.com/dasm_net?igsh=eW44aW5mcWFkcjkw&utm_source=qr",
      label: "Instagram",
      icon: <Instagram className="h-5 w-5" />,
    },
    { href: "https://x.com/DASM0909", label: "Twitter", icon: <TwitterBirdIcon className="h-5 w-5" /> },
  ];

  const payments: Payment[] = [
    { key: "stc", title: "stc pay", node: <PaymentLogo src="/payments/stc-bank.png" alt="stc pay" /> },
    { key: "apple", title: "Apple Pay", node: <PaymentLogo src="/payments/apple-pay.png" alt="Apple Pay" /> },
    { key: "mc", title: "Mastercard", node: <PaymentLogo src="/payments/mastercard.png" alt="Mastercard" /> },
    { key: "visa", title: "Visa", node: <PaymentLogo src="/payments/visa.png" alt="Visa" /> },
    { key: "mada", title: "Mada", node: <PaymentLogo src="/payments/mada.png" alt="Mada" /> },
  ];

  return (
    <footer
      dir="rtl"
      className="
        relative w-full text-white
        bg-gradient-to-b from-[#06162a] via-[#071a33] to-[#06162a]
        border-t border-white/5
      "
    >
      {/* glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* =======================
            Row 1: Payments (TOP RIGHT)
           ======================= */}
        <div dir="ltr" className="py-6 flex items-center justify-end">
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {payments.map((p) => (
              <LogoCard key={p.key} title={p.title}>
                {p.node}
              </LogoCard>
            ))}
          </div>
        </div>

        <div className="h-px w-full bg-white/10" />

        {/* =======================
            Row 2: Right = NAV | Left = Newsletter
           ======================= */}
        <div dir="ltr" className="py-7 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* LEFT (Newsletter) */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="w-full lg:w-[520px] flex items-center gap-3"
          >
            <button
              type="submit"
              className="
                shrink-0
                h-12 px-8
                rounded-full
                bg-emerald-500
                hover:bg-emerald-400
                text-white font-extrabold
                transition-colors
                shadow-lg shadow-emerald-500/20
              "
            >
              اشترك
            </button>

            <div
              className="
                flex-1 h-12
                rounded-full
                bg-white/5
                border border-white/10
                flex items-center
                px-5
              "
            >
              <input
                type="email"
                placeholder="النشرة البريدية"
                className="
                  w-full bg-transparent outline-none
                  text-sm text-white/90
                  placeholder:text-white/40
                "
              />
            </div>
          </form>

          {/* RIGHT (Nav) */}
          <nav
            dir="rtl"
            className="w-full lg:w-auto flex items-center justify-center lg:justify-end gap-6 flex-wrap"
          >
            {navLinks.map((l) => {
              const Icon = l.icon;
              return (
                <LoadingLink
                  key={l.href}
                  href={l.href}
                  className={[
                    "group inline-flex items-center gap-2 text-sm font-semibold transition-colors",
                    l.active ? "text-cyan-300" : "text-white/70 hover:text-white",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 text-white/45 group-hover:text-cyan-300 transition-colors" />
                  {l.label}
                </LoadingLink>
              );
            })}
          </nav>
        </div>

        <div className="h-px w-full bg-white/10" />

        {/* =======================
            Row 3: Left = Social | Right = Copyright + Team
           ======================= */}
        <div dir="ltr" className="py-7 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* LEFT (Social) */}
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            {socialLinks.map((s) => (
              <SocialIconButton key={s.href} href={s.href} label={s.label}>
                {s.icon}
              </SocialIconButton>
            ))}
          </div>

          {/* RIGHT (Copyright + Team) */}
          <div
            dir="rtl"
            className="flex items-center gap-4 text-sm text-white/55 flex-wrap justify-center lg:justify-end"
          >
            <span className="whitespace-nowrap">
              © {currentYear} DASMe. جميع الحقوق محفوظة.
            </span>
            <span className="text-white/25">•</span>
            <TeamLink />
          </div>
        </div>

        {/* iPhone safe area */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </footer>
  );
};

export default Footer;
