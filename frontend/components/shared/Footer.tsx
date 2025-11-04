// src/components/shared/Footer.tsx
import LoadingLink from "@/components/LoadingLink";
import { Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="bg-background text-foreground text-sm border-t border-border"
      dir="rtl"
    >
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Desktop Layout */}
        <div className="hidden lg:flex justify-between items-center">
          <div className="w-1/3 flex justify-start gap-4">
            <LoadingLink
              href="/about"
              className="text-foreground hover:text-primary transition-colors"
            >
              من نحن
            </LoadingLink>
            <span className="text-border">|</span>
            <LoadingLink
              href="/how-it-works"
              className="text-foreground hover:text-primary transition-colors"
            >
              كيف نعمل
            </LoadingLink>
            <span className="text-border">|</span>
            <LoadingLink
              href="/privacy"
              className="text-foreground hover:text-primary transition-colors"
            >
              سياسة الخصوصية
            </LoadingLink>
            <span className="text-border">|</span>
            <LoadingLink
              href="/terms"
              className="text-foreground hover:text-primary transition-colors"
            >
              الشروط والأحكام
            </LoadingLink>
          </div>
          <div className="w-1/3 text-center text-foreground">
            © {currentYear} منصة DASM-e. جميع الحقوق محفوظة.
          </div>
          <div className="w-1/3 flex justify-end">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-foreground hover:text-primary transition-colors break-all">
                mazroni@dasm.host
              </span>
            </div>
          </div>
        </div>

        {/* Tablet Layout */}
        <div className="hidden md:flex lg:hidden flex-col gap-4">
          <div className="flex justify-center items-center gap-3 flex-wrap">
            <LoadingLink
              href="/about"
              className="text-foreground hover:text-primary transition-colors"
            >
              من نحن
            </LoadingLink>
            <span className="text-border">|</span>
            <LoadingLink
              href="/how-it-works"
              className="text-foreground hover:text-primary transition-colors"
            >
              كيف نعمل
            </LoadingLink>
            <span className="text-border">|</span>
            <LoadingLink
              href="/privacy"
              className="text-foreground hover:text-primary transition-colors"
            >
              سياسة الخصوصية
            </LoadingLink>
            <span className="text-border">|</span>
            <LoadingLink
              href="/terms"
              className="text-foreground hover:text-primary transition-colors"
            >
              الشروط والأحكام
            </LoadingLink>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-foreground">
              © {currentYear} منصة DASM-e. جميع الحقوق محفوظة.
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-foreground hover:text-primary transition-colors text-xs sm:text-sm break-all">
                mazroni@dasm.host
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 text-center">
            <LoadingLink
              href="/about"
              className="text-foreground hover:text-primary transition-colors py-2 px-1 rounded hover:bg-border"
            >
              من نحن
            </LoadingLink>
            <LoadingLink
              href="/how-it-works"
              className="text-foreground hover:text-primary transition-colors py-2 px-1 rounded hover:bg-border"
            >
              كيف نعمل
            </LoadingLink>
            <LoadingLink
              href="/privacy"
              className="text-foreground hover:text-primary transition-colors py-2 px-1 rounded hover:bg-border"
            >
              سياسة الخصوصية
            </LoadingLink>
            <LoadingLink
              href="/terms"
              className="text-foreground hover:text-primary transition-colors py-2 px-1 rounded hover:bg-border"
            >
              الشروط والأحكام
            </LoadingLink>
          </div>

          <div className="flex justify-center items-center gap-2 py-2 border-t border-border">
            <Mail className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-foreground text-xs break-all">
              mazroni@dasm.host
            </span>
          </div>

          <div className="text-center text-foreground text-xs border-t border-border pt-3">
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