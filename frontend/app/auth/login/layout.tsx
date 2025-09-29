// app/auth/login/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'منصة قلب - المصادقة',
  description: 'صفحات تسجيل الدخول وإنشاء الحساب والتحقق',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center p-4">
      {children}
    </div>
  );
}