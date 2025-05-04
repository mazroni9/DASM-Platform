'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  backUrl: string;
  backLabel?: string;
  gradient?: boolean;
}

export default function PageHeader({ 
  title, 
  backUrl, 
  backLabel = 'العودة',
  gradient = true
}: PageHeaderProps) {
  return (
    <div className={`py-6 ${gradient ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-green-500'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-2">
          {/* زر الرجوع (على اليمين) */}
          <Link 
            href={backUrl} 
            className="flex items-center text-white hover:text-white/90 transition"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>{backLabel}</span>
          </Link>
          
          {/* العنوان في المنتصف */}
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center flex-1">{title}</h1>
          
          {/* عنصر فارغ للحفاظ على المحاذاة */}
          <div className="w-[100px]"></div>
        </div>
      </div>
    </div>
  );
} 