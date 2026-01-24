// app/auth/login/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'منصة داسم - المصادقة',
  description: 'صفحات تسجيل الدخول وإنشاء الحساب والتحقق',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      {children}
    </div>
  );
}