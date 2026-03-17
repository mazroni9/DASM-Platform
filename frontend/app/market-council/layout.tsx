import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "مجلس السوق | DASM - ثقافة التاجر المحترف",
  description: "ثقافة التاجر المحترف — قصص السوق، علم المزاد، أخلاقيات التجارة وتجارب المستخدمين",
};

export default function MarketCouncilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
