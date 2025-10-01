// src/components/shared/Footer.tsx
import LoadingLink from "@/components/LoadingLink";
import { Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="bg-slate-950 text-slate-400 text-sm border-t border-slate-800/40"
      dir="rtl"
    >
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Desktop Layout */}
        <div className="hidden lg:flex justify-between items-center">
          <div className="w-1/3 flex justify-start gap-4">
            <LoadingLink
              href="/about"
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              من نحن
            </LoadingLink>
            <span className="text-slate-600">|</span>
            <LoadingLink
              href="/how-it-works"
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              كيف نعمل
            </LoadingLink>
            <span className="text-slate-600">|</span>
            <LoadingLink
              href="/privacy"
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              سياسة الخصوصية
            </LoadingLink>
            <span className="text-slate-600">|</span>
            <LoadingLink
              href="/terms"
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              الشروط والأحكام
            </LoadingLink>
          </div>
          <div className="w-1/3 text-center text-slate-500">
            © {currentYear} منصة DASM-e. جميع الحقوق محفوظة.
          </div>
          <div className="w-1/3 flex justify-end">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-cyan-400" />
              <span className="text-slate-300 hover:text-cyan-300 transition-colors break-all">
                zahrma0p@yahoo.com
              </span>
            </div>
          </div>
        </div>

        {/* Tablet Layout */}
        <div className="hidden md:flex lg:hidden flex-col gap-4">
          <div className="flex justify-center items-center gap-3 flex-wrap">
            <LoadingLink
              href="/about"
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              من نحن
            </LoadingLink>
            <span className="text-slate-600">|</span>
            <LoadingLink
              href="/how-it-works"
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              كيف نعمل
            </LoadingLink>
            <span className="text-slate-600">|</span>
            <LoadingLink
              href="/privacy"
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              سياسة الخصوصية
            </LoadingLink>
            <span className="text-slate-600">|</span>
            <LoadingLink
              href="/terms"
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              الشروط والأحكام
            </LoadingLink>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-slate-500">
              © {currentYear} منصة DASM-e. جميع الحقوق محفوظة.
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-cyan-400" />
              <span className="text-slate-300 hover:text-cyan-300 transition-colors text-xs sm:text-sm break-all">
                zahrma0p@yahoo.com
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 text-center">
            <LoadingLink
              href="/about"
              className="text-slate-400 hover:text-cyan-400 transition-colors py-2 px-1 rounded hover:bg-slate-900"
            >
              من نحن
            </LoadingLink>
            <LoadingLink
              href="/how-it-works"
              className="text-slate-400 hover:text-cyan-400 transition-colors py-2 px-1 rounded hover:bg-slate-900"
            >
              كيف نعمل
            </LoadingLink>
            <LoadingLink
              href="/privacy"
              className="text-slate-400 hover:text-cyan-400 transition-colors py-2 px-1 rounded hover:bg-slate-900"
            >
              سياسة الخصوصية
            </LoadingLink>
            <LoadingLink
              href="/terms"
              className="text-slate-400 hover:text-cyan-400 transition-colors py-2 px-1 rounded hover:bg-slate-900"
            >
              الشروط والأحكام
            </LoadingLink>
          </div>

          <div className="flex justify-center items-center gap-2 py-2 border-t border-slate-800/40">
            <Mail className="h-4 w-4 text-cyan-400 flex-shrink-0" />
            <span className="text-slate-300 text-xs break-all">
              zahrma0p@yahoo.com
            </span>
          </div>

          <div className="text-center text-slate-500 text-xs border-t border-slate-800/40 pt-3">
            © {currentYear} منصة DASM-e
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> - </span>
            جميع الحقوق محفوظة
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;