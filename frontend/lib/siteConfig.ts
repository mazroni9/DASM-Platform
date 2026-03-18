/**
 * مصدر موحد لروابط التنقل والألوان في منصة DASM
 * يُستخدم في الفوتر والهيدر وأي مكون يحتاج نفس البيانات
 */
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Info,
  HelpCircle,
  BookOpen,
  LineChart,
  FileText,
} from "lucide-react";

/** روابط التنقل الرئيسية (الفوتر) — الروابط التنظيمية المعتمدة */
export const FOOTER_NAV_LINKS: {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
}[] = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/about", label: "من نحن", icon: Info },
  { href: "/terms", label: "الشروط والأحكام", icon: FileText },
  { href: "/privacy", label: "سياسة الخصوصية", icon: FileText },
  { href: "/how-it-works", label: "كيف تعمل المنصة", icon: HelpCircle },
  { href: "/fees", label: "الرسوم والعمولات", icon: FileText },
  { href: "/faq", label: "الأسئلة الشائعة", icon: HelpCircle },
  { href: "/blog", label: "المدونة", icon: BookOpen },
  { href: "/similar-price-analysis", label: "تحليل السيارات", icon: LineChart, active: true },
];

/** ألوان العلامة التجارية الموحدة */
export const BRAND_COLORS = {
  /** لون الهيدر (أزرق داكن) */
  navbarBg: "#1A4270",
  /** اللون الأساسي (أزرق) */
  primary: "#1F4B7A",
  /** اللون الثانوي (أخضر) */
  secondary: "#009345",
  /** خلفية الفوتر */
  footerBg: "#06162a",
} as const;
