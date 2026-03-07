import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | DASM",
  description: "سياسة الخصوصية لمنصة DASM للإعلانات الرقمية والمزادات المباشرة للسيارات",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
