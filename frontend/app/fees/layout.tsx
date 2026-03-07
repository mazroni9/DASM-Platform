import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الرسوم والعمولات | DASM",
  description: "الرسوم والعمولات المعتمدة في منصة DASM للإعلانات الرقمية والمزادات المباشرة للسيارات",
};

export default function FeesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
