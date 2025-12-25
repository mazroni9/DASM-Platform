// src/components/shared/Footer.tsx
import LoadingLink from "@/components/LoadingLink";
import { Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="bg-slate-950 text-slate-300 text-sm border-t border-slate-800/40"
      dir="rtl"
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* الروابط القانونية */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <LoadingLink
              href="/privacy"
              className="text-slate-400 hover:text-cyan-400 transition-colors duration-300"
            >
              سياسة الخصوصية
            </LoadingLink>
            <span className="hidden md:inline text-slate-600">|</span>
            <LoadingLink
              href="/terms"
              className="text-slate-400 hover:text-cyan-400 transition-colors duration-300"
            >
              الشروط والأحكام
            </LoadingLink>
            <span className="hidden md:inline text-slate-600">|</span>
            <LoadingLink
              href="/how-it-works"
              className="text-slate-400 hover:text-cyan-400 transition-colors duration-300"
            >
              كيف نعمل
            </LoadingLink>
          </div>

          {/* حقوق الملكية */}
          <div className="text-center text-slate-500 order-first md:order-none">
            © {currentYear} منصة داسم. جميع الحقوق محفوظة.
          </div>

          {/* البريد الإلكتروني */}
          <div className="flex items-center gap-2 text-slate-400">
            <Mail className="h-4 w-4 text-cyan-400 flex-shrink-0" />
            <span className="hover:text-cyan-300 transition-colors break-all">
              mazroni@alb-mazz.com
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;