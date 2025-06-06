import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'منصة قلب - المصادقة',
  description: 'صفحات تسجيل الدخول وإنشاء الحساب والتحقق',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
