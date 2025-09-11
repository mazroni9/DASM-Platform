/**
 * 🧩 مكون زر إضافة سيارة
 * 📁 المسار: Frontend-local/components/CarDataEntryButton.tsx
 *
 * ✅ الوظيفة:
 * - عرض زر سريع للانتقال إلى صفحة إضافة بيانات سيارة جديدة
 * - يستخدم في صفحات الخطأ وعند عدم وجود بيانات
 * 
 * 🔄 الارتباط:
 * - يرتبط بصفحة: Frontend-local/app/add/Car/page.tsx
 */

import LoadingLink from "@/components/LoadingLink";
import { Car, PlusCircle } from 'lucide-react';

interface CarDataEntryButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  label?: string;
  className?: string;
}

export default function CarDataEntryButton({
  variant = 'primary',
  label = 'إضافة سيارة جديدة',
  className = '',
}: CarDataEntryButtonProps) {
  // تحديد الأنماط بناءً على المتغير variant
  const styles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-green-600 hover:bg-green-700 text-white',
    outline: 'bg-white hover:bg-gray-50 text-blue-600 border border-blue-300',
  };

  const buttonStyle = styles[variant];

  return (
    <LoadingLink
      href="/add/Car"
      className={`inline-flex items-center justify-center px-6 py-3 rounded-md shadow-sm text-base font-medium transition-colors ${buttonStyle} ${className}`}
    >
      {variant === 'primary' ? (
        <PlusCircle className="ml-2 h-5 w-5" />
      ) : (
        <Car className="ml-2 h-5 w-5" />
      )}
      {label}
    </LoadingLink>
  );
} 